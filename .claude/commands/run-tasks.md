Run the task loop script to execute all tasks in a PRD feature directory.

## Input

The user will provide a PRD directory path, for example:

```
tasks/prd-authentication-and-users
```

Optionally with flags like `--from 3` or `--dry-run`.

## What to Do

Run the shell script `scripts/run-tasks.sh` with the user's arguments:

```bash
./scripts/run-tasks.sh $ARGUMENTS
```

If the user only provides a feature name (e.g., `authentication-and-users`), prepend `tasks/prd-` automatically:

```bash
./scripts/run-tasks.sh tasks/prd-authentication-and-users
```

After the script finishes, report the final summary to the user.

If the script fails, show the error and suggest next steps (e.g., `--from N` to resume).
