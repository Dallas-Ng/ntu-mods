#!/bin/bash
set -e
MAIN_ROOT=$(git worktree list | head -1 | awk '{print $1}')
exec "$MAIN_ROOT/node_modules/.bin/next" dev --turbo
