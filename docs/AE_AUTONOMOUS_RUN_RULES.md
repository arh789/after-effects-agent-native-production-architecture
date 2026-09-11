# Autonomous After Effects Runs

Use `AfterFX.com` for agent-controlled execution. Before launching, check whether
After Effects is already open and whether the active project may contain unsaved
manual work.

Automation runners should:

- set `$.global.SUPPRESS_BUILD_ALERTS = true`;
- call `app.beginSuppressDialogs()` when supported;
- run one narrow operation;
- write success or failure to a report file;
- save only to an explicit project path;
- close only projects or applications opened by that runner;
- never depend on a popup to communicate completion.

Do not stack commands behind a blocked AE process. Check process state, report
timestamps, AEP timestamps, and reference-frame counts before retrying. Clean up
temporary `_codex_*` runners only after their output has been verified.

Crash-recovery prompts indicate application state, not necessarily a script bug.
If manual work is present, stop and preserve it before attempting recovery.

