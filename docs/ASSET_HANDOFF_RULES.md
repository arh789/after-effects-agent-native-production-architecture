# Asset Handoff Rules

Generated candidates do not enter After Effects directly. The user first selects
an asset, then the selected still or video receives a stable approved filename
and provenance record.

Every project-local `assets/asset_manifest.json` entry records:

- slide ID;
- local path consumed by AE;
- shared asset ID or external source ID;
- source batch and candidate, when applicable;
- media type;
- fit, crop, offset, zoom, opacity, and loop policy;
- whether seam effects are enabled;
- approval status.

AE consumes simple local paths such as `assets/backgrounds/slide_01.mp4`. It does
not inspect ComfyUI batches or external libraries during a build.

Copy approved media into the project when independence and archiving matter.
Reference media in place only when the source is explicitly registered and its
owner accepts that dependency. Never rename or reorganise a user-managed source
library to satisfy a build script.

