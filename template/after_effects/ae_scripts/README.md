# After Effects Scripts

Run `00_build_project.jsx` to build the project. It reads project identity and
format from `../../project.json`, then runs the text builder, background builder,
and reference-frame exporter.

```text
00_build_project.jsx             complete entry point
01_timeline.json                 authoritative timing
02_build_text_deck.jsx           transparent text comps and watermark
03_build_background_deck.jsx     solid/media backgrounds and optional seams
04_export_reference_frames.jsx   midpoint PNG export
slide_content/                   one stable JSON file per slide
lib/                             shared safe helpers
presets/                         reusable style configurations
```

The included three-slide timeline is provisional. The build works without audio
or background media by using timeline duration and solid black backgrounds.

