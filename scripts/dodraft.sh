#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./dodraft.sh "your commit message" draft/my-feature
#
# If branch is omitted, it uses current branch name.

MSG="${1:-"draft: update"}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

if [[ "$BRANCH" != draft/* ]]; then
  echo "ERROR: Draft pushes must use a branch like draft/<name>. You gave: $BRANCH"
  exit 1
fi

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"

git add -A
git commit -m "$MSG" || echo "No new changes to commit."

git push -u origin "$BRANCH"

echo "✅ Pushed to $BRANCH (draft mode: no PR / no auto-merge)."
