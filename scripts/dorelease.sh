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

# Ensure PR exists (or create it)
if gh pr list --head "$BRANCH" --base main --json number --jq 'length' | grep -q '^0$'; then
  gh pr create \
    --base main \
    --head "$BRANCH" \
    --title "Release PR: ${BRANCH}" \
    --body "Release PR from \`${BRANCH}\` into \`main\`.\n\nThis PR is labeled \`auto\` and will merge when CI passes." \
    --label "auto"
  echo "✅ PR created and labeled auto."
else
  PR_NUM="$(gh pr list --head "$BRANCH" --base main --json number --jq '.[0].number')"
  gh pr edit "$PR_NUM" --add-label "auto" >/dev/null || true
  echo "✅ PR already exists (#$PR_NUM). Ensured label 'auto' is present."
fi

echo "🚀 Release flow started: CI should run on the PR, then auto-merge if green."
