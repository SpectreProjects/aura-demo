#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
exec npm run dev:ui
