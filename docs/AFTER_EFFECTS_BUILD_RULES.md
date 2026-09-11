# After Effects Build Rules

Run `after_effects/ae_scripts/00_build_project.jsx` as the user-facing entry point.
It reads `project.json`, imports final audio when present, builds the text deck,
builds the background deck, and exports slide reference frames.

Sources of truth:

```text
project.json                         format and project identity
design/style_config.json             visual values
ae_scripts/01_timeline.json          authoritative timing
ae_scripts/slide_content/*.json      stable visible slide content
assets/asset_manifest.json           background mapping
audio/final_audio.wav                final duration
```

The main comp contains the audio, background deck, text deck, and watermark.
Each text slide is transparent. Each background slide owns its media loops and
optional internal seam effects.

Numbered assets map to the same numbered slide. Never reorder media to compensate
for incorrect editorial structure. Correct the transcript, slide plan, manifest,
or timeline instead.

Rebuilding may replace generated comps and layers with standard names. It must
not overwrite manually edited files or unknown layers. If the AEP contains manual
changes, verify the active project and save a recovery copy before rebuilding.

