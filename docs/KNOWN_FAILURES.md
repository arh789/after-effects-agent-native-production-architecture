# Known Failures And Recovery

| Failure | Likely cause | Recovery |
| --- | --- | --- |
| `BlendMode is undefined` | Wrong AE enum name | Use `BlendingMode` supported by ExtendScript. |
| `JSON is undefined` | Older ExtendScript host | Use the guarded local JSON parse fallback. |
| `app.project.items.addSolid is undefined` | Solid creation called on the wrong object | Use `comp.layers.addSolid(...)`. |
| Cannot set value because property is hidden | Plugin group or non-value property selected | Inspect the effect property tree and set only writable value properties. |
| Background file cannot open | File renamed or mapping stale | Verify exact filenames and update the manifest. |
| Old slide structure returns | Stale timeline/content files were rebuilt | Confirm the exact entry script and project folder before running. |
| Only some reference PNGs appear | AE or sync layer has not flushed files | Delay report completion and verify actual file count. |
| AE appears stalled | Modal dialog or recovery prompt is blocking | Inspect process/UI state; do not launch stacked runs. |
| Manual AEP work is lost | Broad rebuild treated generated and manual state alike | Save a recovery copy and rebuild only named generated components. |

