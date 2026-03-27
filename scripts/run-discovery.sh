#!/bin/bash
# Muse local discovery runner — called by launchd
# Runs fetchers locally and pushes results to AWS backend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="/tmp/muse-discovery.log"
LOCK_FILE="/tmp/muse-discovery.lock"
ENV_FILE="$PROJECT_DIR/.env.local"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# Rotate log if over 5MB
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt 5242880 ]; then
  mv "$LOG_FILE" "$LOG_FILE.old"
fi

# Acquire exclusive lock (non-blocking) — exit if already running
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another discovery run is already in progress, exiting."
  exit 0
fi

log "=== Discovery run starting ==="

# Load env vars
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
  log "Loaded env from $ENV_FILE"
elif [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
  log "Loaded env from $PROJECT_DIR/.env"
fi

if [ -z "${MUSE_API_URL:-}" ]; then
  log "ERROR: MUSE_API_URL not set. Set it in .env.local"
  exit 1
fi

# Check if API is reachable
if ! curl -sf --max-time 5 "$MUSE_API_URL/sources" > /dev/null 2>&1; then
  log "ERROR: Cannot reach API at $MUSE_API_URL"
  exit 1
fi

log "API reachable at $MUSE_API_URL"

# Run discovery
cd "$PROJECT_DIR"
npx tsx scripts/discovery.ts 2>&1 | tee -a "$LOG_FILE"

log "=== Discovery run finished ==="
