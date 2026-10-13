#!/usr/bin/env bash
# Rebuilds the SVG art and renders the PNG cards with a headless browser.
#   bash scripts/art/render.sh
# Set BROWSER to another Chromium based browser binary if Edge is not installed.
set -euo pipefail
cd "$(dirname "$0")/../.."
BROWSER="${BROWSER:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
ROOT="$(pwd -W 2>/dev/null || pwd)"

node scripts/art/build.mjs

render() {
  timeout 60 "$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size="$3" \
    --screenshot="$ROOT/$2" "file:///$ROOT/scripts/art/$1" 2>/dev/null || true
  echo "rendered $2"
}
render social-preview.html assets/social-preview.png 1280,640
render og.html docs/og.png 1200,630
