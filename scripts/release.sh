#!/usr/bin/env bash
# Conajra Solutions 2026
# Unified release script - runs local tests, creates PR, waits for CI, merges
set -euo pipefail

# Usage: ./scripts/release.sh "commit message"

MSG="${1:-}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BASE="main"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ "$BRANCH" == release/* ]] || die "Must be on a release/* branch"
[[ -n "$MSG" ]] || die "Usage: ./scripts/release.sh \"commit message\""
gh auth status >/dev/null 2>&1 || die "Run: gh auth login"

echo "=== Local tests ==="
npm run build || die "Build failed"
npm test || die "Tests failed"

echo "=== Commit & push ==="
git add -A
git diff --cached --quiet || git commit -m "$MSG"
git push -u origin "$BRANCH"

echo "=== Create/find PR ==="
PR_NUM="$(gh pr list --head "$BRANCH" --base "$BASE" --json number --jq '.[0].number // empty')"
[[ -n "$PR_NUM" ]] || {
  gh pr create --base "$BASE" --head "$BRANCH" --title "Release: ${BRANCH#release/}" --body "Release PR"
  PR_NUM="$(gh pr list --head "$BRANCH" --base "$BASE" --json number --jq '.[0].number')"
}
PR_URL="$(gh pr view "$PR_NUM" --json url --jq '.url')"
echo "PR: $PR_URL"

echo "=== Waiting for CI ==="
HEAD_SHA="$(git rev-parse HEAD)"
echo "Waiting for CI run for commit ${HEAD_SHA:0:7}..."

# Poll until a workflow run appears for this commit
RUN_ID=""
for i in {1..30}; do
  RUN_ID="$(gh run list --branch "$BRANCH" --json databaseId,headSha --jq ".[] | select(.headSha==\"$HEAD_SHA\") | .databaseId" | head -1)"
  [[ -n "$RUN_ID" ]] && break
  sleep 2
done
[[ -n "$RUN_ID" ]] || die "No CI run found after 60s"

# Watch the run until completion
gh run watch "$RUN_ID" || die "CI failed"

echo "=== Merging ==="
MERGEABLE="$(gh pr view "$PR_NUM" --json mergeable --jq '.mergeable')"
[[ "$MERGEABLE" != "CONFLICTING" ]] || die "Merge conflicts: ${PR_URL}/conflicts"
gh pr merge "$PR_NUM" --squash --delete-branch=false
echo "Merged: $PR_URL"
