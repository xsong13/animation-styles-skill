#!/usr/bin/env bash
# new_project.sh <target-dir> [--style=<name>] [--keep-demo]
# Scaffolds a painted-animation project from the skill's template, sets the style, installs deps and checks the toolchain.
# Styles: watercolor (default), pixel, cutout, crayon, chalk, neon, riso (see template/docs/styles.jpg).
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?usage: new_project.sh <target-dir> [--style=<name>] [--keep-demo]}"
shift
KEEP_DEMO="" STYLE="watercolor"
for a in "$@"; do
  case "$a" in
    --keep-demo) KEEP_DEMO=1 ;;
    --style=*) STYLE="${a#--style=}" ;;
    *) echo "error: unknown option $a" >&2; exit 1 ;;
  esac
done
case "$STYLE" in watercolor|pixel|cutout|crayon|chalk|neon|riso) ;; *) echo "error: unknown style '$STYLE' (watercolor, pixel, cutout, crayon, chalk, neon, riso)" >&2; exit 1 ;; esac

if [ -e "$TARGET/studio.html" ]; then echo "error: $TARGET already has a studio.html; not overwriting" >&2; exit 1; fi
mkdir -p "$TARGET"
# rsync isn't in Git Bash on Windows; cp works everywhere (the template has no node_modules or out/ to skip in the skill)
if command -v rsync >/dev/null; then rsync -a --exclude node_modules --exclude out "$SKILL_DIR/template/" "$TARGET/"
else (cd "$SKILL_DIR/template" && for f in * .gitignore; do case "$f" in node_modules|out) ;; *) cp -R "$f" "$TARGET/" ;; esac; done); fi
mkdir -p "$TARGET/assets" "$TARGET/out/check"

# The demo is an example, not a template: unless asked, unhook it so the new video starts clean.
if [ -z "$KEEP_DEMO" ]; then
  sed -i.bak 's|<script src="src/scenes/demo.js"></script>|<!-- <script src="src/scenes/demo.js"></script>  (example only) -->|' "$TARGET/studio.html" && rm -f "$TARGET/studio.html.bak"
fi
sed -i.bak "s|style: 'watercolor'|style: '$STYLE'|" "$TARGET/src/config.js" && rm -f "$TARGET/src/config.js.bak"

cd "$TARGET"
echo "== style: $STYLE"
echo "== installing p5, p5.brush, puppeteer-core"
npm install --silent

echo "== toolchain"
command -v node   >/dev/null && echo "node   $(node -v)"   || echo "MISSING: node"
command -v ffmpeg >/dev/null && echo "ffmpeg ok"           || echo "MISSING: ffmpeg (brew install ffmpeg / winget install ffmpeg / apt install ffmpeg)"
for c in "${CHROME_PATH:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /usr/bin/google-chrome /usr/bin/chromium \
         "/c/Program Files/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
         "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" "/c/Program Files/Microsoft/Edge/Application/msedge.exe"; do
  [ -n "$c" ] && [ -e "$c" ] && { echo "chrome $c"; FOUND=1; break; }
done
[ "${FOUND:-}" = 1 ] || echo "MISSING: Chrome or Edge (install one, or pass --chrome=<path> to render.mjs)"
echo "== ready: $TARGET"
