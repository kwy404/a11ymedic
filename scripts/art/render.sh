#!/usr/bin/env bash
# Rebuilds the SVG art and renders the PNG cards with a headless browser.
#   bash scripts/art/render.sh
# Set BROWSER to another Chromium based browser binary if Edge is not installed.
set -euo pipefail
cd "$(dirname "$0")/../.."
BROWSER="${BROWSER:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
ROOT="$(pwd -W 2>/dev/null || pwd)"

node scripts/art/build.mjs
node scripts/art/clinic.mjs

render() {
  rm -f "$2"
  timeout 60 "$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size="$3" \
    --virtual-time-budget=6000 --screenshot="$ROOT/$2" "file:///$ROOT/scripts/art/$1" >/dev/null 2>&1 || true
  if [ -s "$2" ]; then echo "rendered $2"; else echo "could not render $2" >&2; return 1; fi
}
# One template: light for the Open Graph card, dark (#dark) for the GitHub social preview.
render "og.html#dark" assets/social-preview.png 1280,640
render og.html docs/og.png 1200,630
