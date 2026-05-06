#!/usr/bin/env bash
set -euo pipefail

if [ -d "$HOME/.nexus/memory" ]; then
  rm -rf "$HOME/.nexus/memory"
fi

node dist/scripts/setup.js
