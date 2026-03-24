#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# run-tasks.sh — Execute all tasks in a PRD directory via Claude
#
# Usage:
#   ./scripts/run-tasks.sh tasks/prd-<feature-name>
#   ./scripts/run-tasks.sh tasks/prd-<feature-name> --from 3
#   ./scripts/run-tasks.sh tasks/prd-<feature-name> --dry-run
#   ./scripts/run-tasks.sh --status
# ─────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

LOG_DIR="/tmp/run-tasks-logs"
PID_FILE="/tmp/run-tasks.pid"
STATUS_FILE="/tmp/run-tasks-status"

mkdir -p "$LOG_DIR"

# ─── Helpers ──────────────────────────────────────────────────

usage() {
  cat <<EOF
${BOLD}Usage:${RESET}
  $(basename "$0") <prd-directory> [options]
  $(basename "$0") --status

${BOLD}Options:${RESET}
  --from <N>     Start from task N (skip earlier tasks)
  --dry-run      Show what would be executed without running
  --status       Show running Claude task processes
  -h, --help     Show this help

${BOLD}Examples:${RESET}
  $(basename "$0") tasks/prd-authentication-and-users
  $(basename "$0") tasks/prd-authentication-and-users --from 3
  $(basename "$0") --status
EOF
}

log() { echo -e "${DIM}[$(date +%H:%M:%S)]${RESET} $*"; }
info() { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }
error() { echo -e "${RED}✗${RESET} $*"; }

show_status() {
  echo -e "\n${BOLD}═══ Claude Task Runner — Status ═══${RESET}\n"

  # Show main runner process
  if [[ -f "$PID_FILE" ]]; then
    local runner_pid
    runner_pid=$(cat "$PID_FILE")
    if kill -0 "$runner_pid" 2>/dev/null; then
      echo -e "${GREEN}●${RESET} Runner process: PID ${BOLD}$runner_pid${RESET}"
    else
      echo -e "${RED}●${RESET} Runner process: ${DIM}not running (stale PID file)${RESET}"
    fi
  else
    echo -e "${DIM}No runner process found${RESET}"
  fi

  # Show current status
  if [[ -f "$STATUS_FILE" ]]; then
    echo ""
    cat "$STATUS_FILE"
  fi

  # Show Claude processes
  echo -e "\n${BOLD}─── Active Claude Processes ───${RESET}\n"
  local claude_procs
  claude_procs=$(ps aux | grep -E '[c]laude' | grep -v "run-tasks" || true)
  if [[ -n "$claude_procs" ]]; then
    echo -e "${DIM}PID     CPU  MEM   TIME     COMMAND${RESET}"
    echo "$claude_procs" | awk '{printf "%-7s %-4s %-5s %-8s %s\n", $2, $3, $4, $10, $11}'
  else
    echo -e "${DIM}No Claude processes running${RESET}"
  fi

  # Show recent log files
  echo -e "\n${BOLD}─── Recent Logs ───${RESET}\n"
  if ls "$LOG_DIR"/*.log 1>/dev/null 2>&1; then
    ls -lt "$LOG_DIR"/*.log | head -5 | awk '{print $NF}' | while read -r f; do
      local basename
      basename=$(basename "$f" .log)
      local last_line
      last_line=$(tail -1 "$f" 2>/dev/null || echo "empty")
      echo -e "  ${DIM}$basename${RESET} → ${last_line:0:80}"
    done
  else
    echo -e "${DIM}  No logs yet${RESET}"
  fi

  echo ""
}

is_task_complete() {
  local tasks_file="$1"
  local task_num="$2"
  grep -qE "^\- \[x\].*${task_num}\.0" "$tasks_file"
}

update_status() {
  local prd_name="$1"
  local task_num="$2"
  local total="$3"
  local state="$4"

  cat > "$STATUS_FILE" <<EOF
${BOLD}Feature:${RESET} $prd_name
${BOLD}Progress:${RESET} Task $task_num / $total — $state
${BOLD}Started:${RESET} $(cat /tmp/run-tasks-start-time 2>/dev/null || echo "unknown")
EOF
}

# ─── Parse Arguments ──────────────────────────────────────────

PRD_DIR=""
START_FROM=1
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status)
      show_status
      exit 0
      ;;
    --from)
      START_FROM="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      PRD_DIR="$1"
      shift
      ;;
  esac
done

if [[ -z "$PRD_DIR" ]]; then
  error "Missing PRD directory argument"
  usage
  exit 1
fi

# Strip trailing slash
PRD_DIR="${PRD_DIR%/}"

if [[ ! -d "$PRD_DIR" ]]; then
  error "Directory not found: $PRD_DIR"
  exit 1
fi

# ─── Validate PRD directory ──────────────────────────────────

PRD_NAME=$(basename "$PRD_DIR")

for required in prd.md techspec.md tasks.md; do
  if [[ ! -f "$PRD_DIR/$required" ]]; then
    error "Missing required file: $PRD_DIR/$required"
    exit 1
  fi
done

# ─── Discover tasks ──────────────────────────────────────────

TASK_FILES=($(ls "$PRD_DIR"/*_task.md 2>/dev/null | sort -V))

if [[ ${#TASK_FILES[@]} -eq 0 ]]; then
  error "No task files found in $PRD_DIR"
  exit 1
fi

TOTAL=${#TASK_FILES[@]}

echo -e "\n${BOLD}═══ Claude Task Runner ═══${RESET}"
echo -e "${BOLD}Feature:${RESET}  $PRD_NAME"
echo -e "${BOLD}Tasks:${RESET}    $TOTAL found"
echo -e "${BOLD}Start:${RESET}    Task $START_FROM"
echo -e "${BOLD}Dry run:${RESET}  $DRY_RUN"
echo ""

# ─── List tasks ───────────────────────────────────────────────

echo -e "${BOLD}─── Task Plan ───${RESET}\n"

for task_file in "${TASK_FILES[@]}"; do
  filename=$(basename "$task_file")
  task_num="${filename%%_*}"
  task_title=$(head -1 "$task_file" | sed 's/^#\+\s*//')

  if is_task_complete "$PRD_DIR/tasks.md" "$task_num"; then
    status="${GREEN}✓ done${RESET}"
  elif [[ "$task_num" -lt "$START_FROM" ]]; then
    status="${DIM}skip${RESET}"
  else
    status="${YELLOW}● pending${RESET}"
  fi

  echo -e "  ${BOLD}$task_num${RESET}. $task_title  [$status]"
done

echo ""

if $DRY_RUN; then
  info "Dry run — no tasks will be executed."
  exit 0
fi

# ─── Execute tasks ────────────────────────────────────────────

echo "$$" > "$PID_FILE"
date +"%Y-%m-%d %H:%M:%S" > /tmp/run-tasks-start-time

trap 'rm -f "$PID_FILE" "$STATUS_FILE" /tmp/run-tasks-start-time; echo -e "\n${RED}Runner stopped.${RESET}"' EXIT

COMPLETED=0
FAILED=0
SKIPPED=0

for task_file in "${TASK_FILES[@]}"; do
  filename=$(basename "$task_file")
  task_num="${filename%%_*}"
  task_title=$(head -1 "$task_file" | sed 's/^#\+\s*//')

  # Skip completed tasks
  if is_task_complete "$PRD_DIR/tasks.md" "$task_num"; then
    success "Task $task_num already complete — skipping"
    ((SKIPPED++))
    continue
  fi

  # Skip tasks before --from
  if [[ "$task_num" -lt "$START_FROM" ]]; then
    warn "Task $task_num skipped (--from $START_FROM)"
    ((SKIPPED++))
    continue
  fi

  echo -e "\n${BOLD}═══════════════════════════════════════════════${RESET}"
  echo -e "${CYAN}▸ Starting Task $task_num:${RESET} $task_title"
  echo -e "${BOLD}═══════════════════════════════════════════════${RESET}\n"

  update_status "$PRD_NAME" "$task_num" "$TOTAL" "running"

  LOG_FILE="$LOG_DIR/${PRD_NAME}_task${task_num}_$(date +%Y%m%d_%H%M%S).log"
  TASK_PATH="$task_file"

  info "Log file: $LOG_FILE"
  info "Claude process starting..."
  echo ""

  # Build the prompt by reading the execute-task command template
  COMMAND_FILE="$(dirname "$0")/../.claude/commands/execute-task.md"
  if [[ ! -f "$COMMAND_FILE" ]]; then
    error "Command file not found: $COMMAND_FILE"
    ((FAILED++))
    break
  fi
  PROMPT="$(cat "$COMMAND_FILE")

Task file: $TASK_PATH"

  # Save prompt to temp file to avoid stdin pipe (which suppresses streaming)
  PROMPT_FILE=$(mktemp)
  EXIT_CODE_FILE=$(mktemp)
  printf '%s\n' "$PROMPT" > "$PROMPT_FILE"

  # Use script to allocate a PTY so claude streams output in real-time.
  # script -q also logs all output to LOG_FILE (replaces tee).
  set +e
  script -q "$LOG_FILE" bash -c '
    claude --print --allowedTools "Edit,Write,Read,Glob,Grep,Bash" < "$1" 2>&1
    echo $? > "$2"
  ' _ "$PROMPT_FILE" "$EXIT_CODE_FILE"
  EXIT_CODE=$(cat "$EXIT_CODE_FILE" 2>/dev/null || echo 1)
  rm -f "$PROMPT_FILE" "$EXIT_CODE_FILE"
  set -e

  if [[ $EXIT_CODE -eq 0 ]]; then
    # Verify the task was actually marked complete in tasks.md
    if is_task_complete "$PRD_DIR/tasks.md" "$task_num"; then
      success "Task $task_num completed successfully"
      update_status "$PRD_NAME" "$task_num" "$TOTAL" "completed"
      ((COMPLETED++))
    else
      warn "Task $task_num: Claude exited OK but task not marked complete in tasks.md"
      warn "Stopping — manual review needed"
      update_status "$PRD_NAME" "$task_num" "$TOTAL" "needs review"
      ((FAILED++))
      break
    fi
  else
    error "Task $task_num failed (exit code: $EXIT_CODE)"
    error "Check log: $LOG_FILE"
    update_status "$PRD_NAME" "$task_num" "$TOTAL" "failed"
    ((FAILED++))
    break
  fi
done

# ─── Summary ──────────────────────────────────────────────────

echo -e "\n${BOLD}═══ Run Summary ═══${RESET}\n"
echo -e "  ${GREEN}Completed:${RESET} $COMPLETED"
echo -e "  ${YELLOW}Skipped:${RESET}   $SKIPPED"
echo -e "  ${RED}Failed:${RESET}    $FAILED"
echo -e "  ${DIM}Total:${RESET}     $TOTAL"
echo ""

if [[ $FAILED -gt 0 ]]; then
  error "Run stopped due to failure. Fix the issue and re-run with --from <next-task>"
  exit 1
else
  success "All tasks processed!"
fi
