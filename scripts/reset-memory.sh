#!/usr/bin/env bash
set -euo pipefail

if [ -d "$HOME/.mnemochron/memory" ]; then
  rm -rf "$HOME/.mnemochron/memory"
fi

node dist/scripts/setup.js
