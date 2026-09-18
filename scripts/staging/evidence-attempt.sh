#!/usr/bin/env bash
# Sourced by staging evidence writers. Completion is published last under an
# exclusive per-directory lock. Readers must hold the same lock in shared mode.
begin_evidence_attempt() {
  output_dir=$1
  completion_file=$2
  mkdir -p "$output_dir"
  exec {evidence_lock_fd}>"$output_dir/.evidence.lock"
  if ! flock --exclusive --nonblock "$evidence_lock_fd"; then
    echo 'Evidence directory is in use; attempt not started.' >&2
    exit 1
  fi
  # Invalidate the previous completion before any checks for this attempt.
  # Keep the lock inode: unlinking it would allow concurrent writers to bypass it.
  rm -f "$output_dir/$completion_file"
  attempt_dir="$(mktemp -d "$output_dir/.attempt.XXXXXXXX")"
  chmod 700 "$attempt_dir"
  trap 'rm -rf "$attempt_dir"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
}

publish_evidence_attempt() {
  # Artifacts are private until validated; completion rename is the final commit.
  local file
  for file in "$attempt_dir"/*; do
    [[ -f "$file" ]] || continue
    [[ "${file##*/}" == "$completion_file" ]] && continue
    mv -f "$file" "$output_dir/${file##*/}"
  done
  mv -f "$attempt_dir/$completion_file" "$output_dir/$completion_file"
}
