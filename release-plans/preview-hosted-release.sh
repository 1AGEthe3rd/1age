#!/usr/bin/env bash
# Local read-only release rehearsal. No merge, push, Pages, DNS or Railway changes.
set -euo pipefail
workspace=$(mktemp -d "$HOME/1AGE-hosted-release-XXXXXX")
echo "Release workspace: $workspace"
command -v gh >/dev/null
command -v node >/dev/null
command -v python3 >/dev/null
test "$(gh api user --jq .login)" = "1AGEthe3rd"
cat > "$workspace/release-list.tsv" <<'EOF'
1age-world-web 7 8100 destinations/
1age-space 50 8101 /
1agepage 7 8102 /
1age-games 4 8103 /
1age-exchange 3 8104 /
1age-cash 10 8105 /
1age-quest 4 8106 /
1age-shop 3 8107 /
1age-store 3 8108 /
1age-plus 5 8109 /
1age-app 3 8110 /
1age-blog 3 8111 /
1age-design 3 8112 /
EOF
: > "$workspace/reviewed-heads.tsv"
while read -r repo pr port route; do
  full="1AGEthe3rd/$repo"
  echo "=== $repo PR #$pr ==="
  state=$(gh pr view "$pr" -R "$full" --json state --jq .state)
  test "$state" = OPEN
  branch=$(gh pr view "$pr" -R "$full" --json headRefName --jq .headRefName)
  head=$(gh pr view "$pr" -R "$full" --json headRefOid --jq .headRefOid)
  base=$(gh pr view "$pr" -R "$full" --json baseRefName --jq .baseRefName)
  test "$base" = main
  behind=$(gh api "repos/$full/compare/main...$branch" --jq .behind_by)
  if [ "$behind" != 0 ]; then echo "STOP: $repo branch is behind main; preserve newer work."; exit 1; fi
  gh repo clone "$full" "$workspace/$repo" -- --branch "$branch" --single-branch --depth 1
  test "$(git -C "$workspace/$repo" rev-parse HEAD)" = "$head"
  (
    cd "$workspace/$repo"
    for folder in spatial distribution destinations; do
      if [ -d "$folder" ]; then
        find "$folder" -name '*.mjs' -type f -print0 | xargs -0 -r -n 1 node --check
        while IFS= read -r -d '' testfile; do node --test "$testfile"; done < <(find "$folder" -name '*.test.mjs' -type f -print0)
      fi
    done
  )
  printf '%s\t%s\t%s\t%s\n' "$repo" "$pr" "$head" "$port" >> "$workspace/reviewed-heads.tsv"
done < "$workspace/release-list.tsv"
echo "=== Local previews (not production) ==="
pids=()
trap 'for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done' EXIT
while read -r repo pr port route; do
  python3 -m http.server "$port" --bind 127.0.0.1 --directory "$workspace/$repo" > "$workspace/$repo-http.log" 2>&1 &
  pids+=("$!")
  if [ "$route" = / ]; then route=""; fi
  printf '%-21s http://127.0.0.1:%s/%s\n' "$repo" "$port" "$route"
done < "$workspace/release-list.tsv"
echo "Review World directory and Space first. Test render, walking, camera, center logo, department interactions, fallback paths; Cash account/auth separately. Do not enable payments or sign transactions."
echo "Keep this terminal running. Ctrl+C stops preview servers. Source clones and reviewed-heads.tsv remain available."
echo "Workspace: $workspace"
wait
