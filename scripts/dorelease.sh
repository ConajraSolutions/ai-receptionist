#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./dorelease.sh "commit message" [release/branch-name]
#
# What it does:
# - Ensures gh is installed (auto-installs on Debian/Ubuntu if missing)
# - Ensures you're on a release/* branch (creates/switches if needed)
# - add/commit/push
# - Creates (or reuses) PR -> main using gh (NOT GitHub Actions token)
# - Ensures PR is labeled "auto"
# - Enables auto-merge (does NOT delete the branch)

MSG="${1:-"release: update"}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"
BASE_BRANCH="main"

die() { echo "ERROR: $*" >&2; exit 1; }

# --- 0) Ensure gh is installed ---
if ! command -v gh >/dev/null 2>&1; then
  echo "gh not found. Attempting install..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y gh
  else
    die "gh CLI is not installed, and this system isn't Debian/Ubuntu (no apt-get). Install gh manually: https://cli.github.com/"
  fi
fi

# --- 1) Ensure gh is authenticated ---
if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Running: gh auth login"
  gh auth login
fi

# --- 2) Validate / switch branch ---
if [[ "$BRANCH" != release/* ]]; then
  die "Release pushes must use a branch like release/<name>. You gave: $BRANCH"
fi

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"

# --- 3) Commit (only if changes exist) ---
git add -A
if git diff --cached --quiet; then
  echo "ℹ️ No changes staged. Nothing to commit/push. Exiting."
  exit 0
fi

git commit -m "$MSG"

# --- 4) Push branch ---
git push -u origin "$BRANCH"

# --- 5) Create or reuse PR to main ---
REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

PR_NUMBER="$(gh pr list --repo "$REPO" --head "$BRANCH" --base "$BASE_BRANCH" --json number --jq '.[0].number // empty')"

if [[ -z "$PR_NUMBER" ]]; then
  echo "Creating PR: $BRANCH -> $BASE_BRANCH"
  gh pr create \
    --repo "$REPO" \
    --base "$BASE_BRANCH" \
    --head "$BRANCH" \
    --title "Release: $BRANCH" \
    --body "Automated release PR from \`$BRANCH\` into \`$BASE_BRANCH\`." \
    >/dev/null

  PR_NUMBER="$(gh pr list --repo "$REPO" --head "$BRANCH" --base "$BASE_BRANCH" --json number --jq '.[0].number')"
else
  echo "PR already exists: #$PR_NUMBER"
fi

# --- 6) Ensure 'auto' label exists and is applied ---

if ! gh api repos/$REPO/labels --jq '.[].name' | grep -q '^auto$'; then
  echo "Creating 'auto' label..."
  gh api repos/$REPO/labels \
    -X POST \
    -f name=auto \
    -f color=0E8A16 \
    -f description="Automated PR - will auto-merge when CI passes"
else
  echo "'auto' label already exists."
fi

gh pr edit "$PR_NUMBER" --add-label auto


# --- 7) Enable auto-merge (won't delete branch) ---
# This will succeed only if repo settings allow auto-merge for you.
# If required checks/approvals are missing, GitHub will just keep it pending until satisfied.
set +e
gh pr merge "$PR_NUMBER" --repo "$REPO" --auto --squash --delete-branch=false
rc=$?
set -e

PR_URL="https://github.com/${REPO}/pull/${PR_NUMBER}"

if [[ $rc -ne 0 ]]; then
  echo "⚠️ Could not enable auto-merge (maybe auto-merge is disabled, approvals required, or permissions missing)."
  echo "PR: $PR_URL"
  echo "You can still merge once checks pass using:"
  echo "  gh pr merge $PR_NUMBER --repo $REPO --squash --delete-branch=false"
  exit 0
fi

echo "🚀 Release flow started."
echo "PR: $PR_URL"
echo "CI should run on the PR. If checks pass, GitHub will auto-merge it (branch will NOT be deleted)."

# --- 8) Wait for checks, then merge ---
echo "⏳ Waiting for PR checks to complete..."
if ! gh pr checks "$PR_NUMBER" --repo "$REPO" --watch; then
  echo "❌ Checks failed. Not merging."
  echo "PR: $PR_URL"
  exit 1
fi

# Re-check mergeability (conflicts can still block)
MERGEABLE="$(gh pr view "$PR_NUMBER" --repo "$REPO" --json mergeable --jq '.mergeable')"
if [[ "$MERGEABLE" == "CONFLICTING" ]]; then
  echo "❌ Merge conflicts detected. Not merging."
  echo "Resolve here: https://github.com/${REPO}/pull/${PR_NUMBER}/conflicts"
  exit 1
fi

echo "✅ Checks passed and PR is mergeable. Merging now..."
gh pr merge "$PR_NUMBER" --repo "$REPO" --squash --delete-branch=false

echo "🎉 Merged: $PR_URL"
