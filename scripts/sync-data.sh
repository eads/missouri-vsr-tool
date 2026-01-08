#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
DEST_DIR="$ROOT_DIR/packages/web/static/data"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env file at $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${MISSOURI_VSR_BUCKET_NAME:?Missing MISSOURI_VSR_BUCKET_NAME in .env}"
MISSOURI_VSR_S3_PREFIX="${MISSOURI_VSR_S3_PREFIX-}"

if [[ -n "$MISSOURI_VSR_S3_PREFIX" ]]; then
  SRC_URI="s3://${MISSOURI_VSR_BUCKET_NAME}/${MISSOURI_VSR_S3_PREFIX}/"
else
  SRC_URI="s3://${MISSOURI_VSR_BUCKET_NAME}/"
fi

aws s3 sync "$SRC_URI" "$DEST_DIR"
