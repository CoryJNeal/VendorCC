#!/bin/bash
set -euo pipefail
cat .lock-chunks/00a.txt .lock-chunks/00b.txt .lock-chunks/01a.txt .lock-chunks/01b.txt .lock-chunks/02a.txt .lock-chunks/02b.txt .lock-chunks/03a.txt .lock-chunks/03b.txt .lock-chunks/04a.txt .lock-chunks/04b.txt .lock-chunks/05a.txt .lock-chunks/05b.txt .lock-chunks/06a.txt .lock-chunks/06b.txt .lock-chunks/07a.txt .lock-chunks/07b.txt .lock-chunks/08a.txt .lock-chunks/08b.txt .lock-chunks/09a.txt .lock-chunks/09b.txt .lock-chunks/10a.txt .lock-chunks/10b.txt .lock-chunks/11a.txt .lock-chunks/11b.txt > package-lock.json
echo "Wrote package-lock.json ($(wc -c < package-lock.json) bytes)"
