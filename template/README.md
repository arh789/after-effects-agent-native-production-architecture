# Video Project

This folder is a clean project instance created from the canonical template.

## Agent Inspection Order

1. Read `PROJECT_STATUS.md` and `project.json`.
2. Read the approved files in `content/`.
3. Confirm `audio/final_audio.wav` and inspect `audio/alignment/`.
4. Read `after_effects/ae_scripts/01_timeline.json`.
5. Read `assets/asset_manifest.json` and inventory `assets/backgrounds/`.
6. Inspect the newest `quality_control` reports and reference frames.
7. Check for an existing AEP and confirm whether it contains manual changes.

## Build

In After Effects, run:

```text
after_effects/ae_scripts/00_build_project.jsx
```

The example project contains three provisional ten-second slides and black
background fallbacks. Replace its content and timing before production.

## Sources Of Truth

- `content/condensed_script.md`: narration.
- `content/slide_plan.md`: approved human-readable slide intent.
- `audio/final_audio.wav`: final duration when present.
- `after_effects/ae_scripts/01_timeline.json`: authoritative slide timing.
- `after_effects/ae_scripts/slide_content/`: visible slide text and placement.
- `assets/asset_manifest.json`: media mapping.
- `design/style_config.json`: machine-readable visual treatment.

