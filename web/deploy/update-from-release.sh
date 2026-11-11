#!/usr/bin/env bash
# Server-side updater for ICU (public repository, no credentials needed).
# Download the prebuilt standalone bundle from the GitHub Release,
# unpack it, switch a symlink and restart PM2.
# This machine NEVER runs npm ci or next build.
#
# Usage:  bash update-from-release.sh
# Log:    nohup bash update-from-release.sh > /opt/icu-update.log 2>&1 &
#
# Manual rollback:
#   ln -sfn /opt/icu-app/releases/<older-id> /opt/icu-app/current
#   pm2 restart icu --update-env

set -euo pipefail

OWNER='CHUANHU-MIAO'
REPO='godsayicu'
TAG='standalone-latest'
ASSET='icu-standalone.tar.gz'

APP_ROOT='/opt/icu-app'
RELEASE_DIR="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"
LOG_DIR="$APP_ROOT/logs"
KEEP=3

for c in curl tar pm2 node; do
  command -v "$c" >/dev/null 2>&1 || { echo "$c missing"; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

BUNDLE_URL="https://github.com/$OWNER/$REPO/releases/download/$TAG/$ASSET"
BUNDLE="$WORK/bundle.tar.gz"

echo '==> 1/6 download bundle'
echo "$BUNDLE_URL"
DOWNLOAD_OK=0
for i in 1 2 3 4 5; do
  echo "download attempt $i / 5"
  if curl -fL --retry 3 --retry-delay 2 --retry-all-errors \
      --connect-timeout 15 --max-time 300 \
      "$BUNDLE_URL" -o "$BUNDLE"; then
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
  echo 'HINT: this server may not reach the GitHub release CDN'
  exit 1
fi

STAMP="$(date +%Y%m%d%H%M%S)"
DEST="$RELEASE_DIR/$STAMP"

echo "==> 2/6 unpack to $DEST"
mkdir -p "$RELEASE_DIR" "$LOG_DIR"
if [ -d "$DEST" ]; then
  rm -rf "$DEST"
fi
mkdir -p "$DEST"
tar xzf "$BUNDLE" -C "$DEST"
if [ ! -f "$DEST/server.js" ]; then
  echo 'server.js missing in bundle'
  exit 1
fi
if [ ! -d "$DEST/.next/static" ]; then
  echo '.next/static missing in bundle'
  exit 1
fi

echo '==> 3/6 switch current'
PREV=''
if [ -L "$CURRENT" ]; then
  PREV="$(readlink -f "$CURRENT")"
fi
ln -sfn "$DEST" "$CURRENT.new"
mv -fT "$CURRENT.new" "$CURRENT"

echo '==> 4/6 write pm2 config'
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
echo "OK: ICU running $STAMP (HTTP 200), current -> $(readlink -f "$CURRENT")"
