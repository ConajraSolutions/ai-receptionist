#!/usr/bin/env bash
set -euo pipefail

# Requirements:
# - gh CLI installed and authenticated: `gh auth login`
#
# Usage:
#   ./dorelease.sh "your commit message" release/my-feature

MSG="${1:-"release: update"}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

if [[ "$BRANCH" != release/* ]]; then
  echo "ERROR: Release pushes must use a branch like release/<name>. You gave: $BRANCH"
  exit 1
fi

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"

git add -A
git commit -m "$MSG" || echo "No new changes to commit."

git push -u origin "$BRANCH"

echo "🚀 Release flow started: CI should run on the PR, then auto-merge if green."