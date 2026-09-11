# Visual QA Rules

Every complete AE build exports the midpoint of every slide into a timestamped
folder under `quality_control/reference_frames/`.

Inspect each frame for:

- clipping and unsafe margins;
- text density and mobile readability;
- vertical bunching;
- inconsistent hierarchy or font size;
- accidental line wrapping;
- weak contrast against the selected background;
- emphasis-colour overuse;
- watermark collisions;
- incorrect background, crop, or slide mapping.

Correct the smallest responsible input. Prefer a slide-specific line break,
position, or role change over a global redesign. Rebuild, export a new timestamped
set, and record the result in `visual_review.md`.

Script completion is structural evidence. Rendered frames are visual evidence.

