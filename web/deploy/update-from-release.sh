#!/usr/bin/env bash
# Server-side updater for ICU.
# Download a prebuilt standalone bundle from the GitHub Release
# "standalone-latest", unpack it, switch a symlink and restart PM2.
# This machine NEVER runs npm ci or next build.
#
# Usage:
#   GH_TOKEN=ghp_xxx bash update-from-release.sh
#   # or store GH_TOKEN=... in /etc/icu.env (chmod 600) and just run the script
#
# Manual rollback:
#   ln -sfn /opt/icu-app/releases/<older-sha> /opt/icu-app/current
#   pm2 restart icu --update-env

set -euo pipefail

OWNER='CHUANHU-MIAO'
REPO='godsayicu'
TAG='standalone-latest'

APP_ROOT='/opt/icu-app'
RELEASE_DIR="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"
LOG_DIR="$APP_ROOT/logs"
KEEP=3

if [ -z "${GH_TOKEN:-}" ] && [ -r /etc/icu.env ]; then
  . /etc/icu.env
fi
: "${GH_TOKEN:?GH_TOKEN required (env var, or /etc/icu.env)}"

for c in curl tar pm2 node; do
  command -v "$c" >/dev/null 2>&1 || { echo "$c missing"; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo '==> 1/6 read release metadata'
API="https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG"
curl -fsSL -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "$API" -o "$WORK/release.json"

DL_URL="$(grep -o '"url": *"https://api.github.com/repos/[^"]*/releases/assets/[0-9]*"' \
  "$WORK/release.json" | head -1 | cut -d'"' -f4 || true)"
if [ -z "$DL_URL" ]; then
  echo "no bundle asset in release $TAG"
  exit 1
fi

SHA="$(grep -o '"target_commitish": *"[^"]*"' "$WORK/release.json" \
  | head -1 | cut -d'"' -f4 || true)"
if [ -z "$SHA" ]; then
  SHA="$(date +%Y%m%d%H%M%S)"
fi
DEST="$RELEASE_DIR/${SHA:0:12}"

echo '==> 2/6 download bundle'
BUNDLE="$WORK/bundle.tar.gz"
DOWNLOAD_OK=0
for i in 1 2 3 4 5; do
  echo "download attempt $i / 5"
  if curl -fL --retry 3 --retry-delay 2 --retry-all-errors \
      --connect-timeout 15 --max-time 300 \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Accept: application/octet-stream" \
      "$DL_URL" -o "$BUNDLE"; then
    if tar tzf "$BUNDLE" >/dev/null 2>&1; then
      DOWNLOAD_OK=1
      break
    fi
    echo 'archive incomplete, retrying'
  fi
  rm -f "$BUNDLE"
  sleep 3
done
if [ "$DOWNLOAD_OK" != '1' ]; then
  echo 'ERROR: bundle download failed after 5 attempts'
  echo 'HINT: the redirect target objects.githubusercontent.com may be blocked here'
  exit 1
fi

echo "==> 3/6 unpack to $DEST"
mkdir -p "$RELEASE_DIR" "$LOG_DIR"
if [ -d "$DEST" ]; then
  rm -rf "$DEST"
fi
mkdir -p "$DEST"
tar xzf "$WORK/bundle.tar.gz" -C "$DEST"
if [ ! -f "$DEST/server.js" ]; then
  echo 'server.js missing in bundle'
  exit 1
fi
if [ ! -d "$DEST/.next/static" ]; then
  echo '.next/static missing in bundle'
  exit 1
fi

echo '==> 4/6 switch current'
PREV=''
if [ -L "$CURRENT" ]; then
  PREV="$(readlink -f "$CURRENT")"
fi
ln -sfn "$DEST" "$CURRENT.new"
mv -fT "$CURRENT.new" "$CURRENT"

cat > "$APP_ROOT/ecosystem.config.cjs" <<EOF
module.exports = { apps: [{ name: 'icu', cwd: '$APP_ROOT',
  script: '$CURRENT/server.js', exec_mode: 'fork', instances: 1,
  env: { NODE_ENV: 'production', HOSTNAME: '0.0.0.0', PORT: '3000' },
  max_memory_restart: '512M', out_file: '$LOG_DIR/icu-out.log',
  error_file: '$LOG_DIR/icu-error.log', merge_logs: true, time: true }] };
EOF

echo '==> 5/6 restart pm2'
pm2 delete icu >/dev/null 2>&1 || true
if ! pm2 start "$APP_ROOT/ecosystem.config.cjs" --env production; then
  echo 'pm2 start failed'
fi
pm2 save >/dev/null 2>&1 || true

echo '==> 6/6 health check'
CODE='000'
for i in 1 2 3 4 5 6; do
  CODE="$(curl -s --noproxy '*' -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || true)"
  if [ "$CODE" = '200' ]; then
    break
  fi
  sleep 2
done

if [ "$CODE" != '200' ]; then
  echo "health check failed (HTTP $CODE), rolling back"
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    ln -sfn "$PREV" "$CURRENT.new"
    mv -fT "$CURRENT.new" "$CURRENT"
    pm2 delete icu >/dev/null 2>&1 || true
    pm2 start "$APP_ROOT/ecosystem.config.cjs" --env production >/dev/null 2>&1 || true
  fi
  exit 1
fi

ls -1dt "$RELEASE_DIR"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf || true
echo "OK: ICU running $SHA (HTTP 200), current -> $(readlink -f "$CURRENT")"
