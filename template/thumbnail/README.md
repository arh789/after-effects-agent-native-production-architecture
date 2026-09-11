# Thumbnail

1. Place `thumbnail.psd` or `thumbnail.png` in `source/`.
2. Define text and scrim values in `thumbnail_config.json`.
3. Run `scripts/build_thumbnail.jsx` from Photoshop.
4. Inspect the next PNG in `trial_exports/` at actual thumbnail scale.
5. Record the judgement in `THUMBNAIL_BUILD_REPORT.md`.

The script suppresses dialogs, works on a duplicate, saves `thumbnail_final.psd`,
and closes its working copy without prompting.

