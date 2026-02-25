#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="prsnmn"
REMOTE_HOST="personman.com"
REMOTE_DIR="~/run.personman.com"

echo "==> Building..."
npm run build

echo "==> Uploading dist/..."
rsync -avz --delete \
  --exclude 'api/' \
  dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> Uploading api/ (skipping config.php)..."
rsync -avz \
  --exclude 'config.php' \
  api/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/api/"

echo "==> Uploading .htaccess..."
rsync -avz .htaccess "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/.htaccess"

echo "==> Done. https://run.personman.com"
