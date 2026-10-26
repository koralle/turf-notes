#!/usr/bin/env bash
# 適用済みのマイグレーションを書き換えると、既存の DB と食い違う。
# PR の差分のうち「base にすでに存在したマイグレーションのフォルダ」への変更を失敗させる。
set -euo pipefail

base="${BASE_REF:-origin/main}"

if ! git rev-parse --verify "$base" >/dev/null 2>&1; then
  echo "base ref が見つからないためスキップします: $base"
  exit 0
fi

status=0

while IFS= read -r file; do
  [ -z "$file" ] && continue

  case "$file" in
    packages/db/drizzle/*) ;;
    *) continue ;;
  esac

  dir="$(dirname "$file")"
  if git cat-file -e "$base:$dir" 2>/dev/null; then
    echo "::error file=$file::既存のマイグレーションは変更できません。新しいマイグレーションを追加してください。"
    status=1
  fi
done < <(git diff --name-only "$base...HEAD" -- packages/db/drizzle)

exit "$status"
