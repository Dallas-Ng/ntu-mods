#!/bin/bash
# node_modules gitignore'd. fresh worktree = none. symlink main worktree's
# instead of slow duplicate `pnpm install`.
set -e

WORKTREE_ROOT=$(git rev-parse --show-toplevel)
MAIN_ROOT=$(git worktree list | head -1 | awk '{print $1}')

if [ "$WORKTREE_ROOT" != "$MAIN_ROOT" ]; then
  if [ -L "$WORKTREE_ROOT/node_modules" ]; then
    ln -sfn "$MAIN_ROOT/node_modules" "$WORKTREE_ROOT/node_modules"
  elif [ ! -e "$WORKTREE_ROOT/node_modules" ]; then
    ln -s "$MAIN_ROOT/node_modules" "$WORKTREE_ROOT/node_modules"
  fi
  # real dir here (not symlink) = someone's actual install. leave alone.
fi

cd "$WORKTREE_ROOT"

MODE="${1:-dev}"
PORT="${PORT:-4321}"

if [ "$MODE" = "dev" ]; then
  pnpm data
  exec node_modules/.bin/astro dev --port "$PORT"
else
  exec node_modules/.bin/astro preview --port "$PORT"
fi
