# After Effects Agent Workflow

A reusable, file-driven workflow for using an AI coding agent to build and
inspect short-form video projects in Adobe After Effects.

The central idea is simple: the agent should not own an opaque edit. It should
produce inspectable project state.

```text
transcript
    -> semantic slide plan
        -> marked narration
            -> audio alignment
                -> timeline JSON
                    -> After Effects build
                        -> rendered reference frames
                            -> targeted corrections
```

The repository includes a three-slide portrait template, configuration-driven
After Effects scripts, a local faster-whisper alignment tool, a Photoshop
thumbnail builder, validation tools, and the production rules that connect them.

## Status

This is an early public template extracted from a completed multi-video
production workflow. JSON, Python, PowerShell, and JSX syntax are validated. Run
an application-level test with your installed versions of After Effects and
Photoshop before using it on production work.

## Requirements

- Adobe After Effects with scripting enabled.
- PowerShell 5.1 or later for project creation and validation.
- Adobe Photoshop for the optional thumbnail workflow.
- Python 3.10+ and `faster-whisper` for optional local audio alignment.
- A locally installed font named in `template/design/style_config.json`.
- Video Copilot Twitch only if optional internal seam glitches are enabled.

No proprietary font, Adobe application, model weight, plugin, media file, or
generated asset is distributed by this repository.

## Create A Project

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\create_project.ps1" -ProjectId "example_video" -Destination "C:\VideoProjects\example_video" -Title "Example Video"
```

Then:

1. Complete `project.json` and `PROJECT_STATUS.md`.
2. Add and refine the files in `content/`.
3. Place final narration at `audio/final_audio.wav` when available.
4. Update `after_effects/ae_scripts/01_timeline.json`.
5. Add approved media to `assets/` and map it in `asset_manifest.json`.
6. Validate with `tools/validate_project.ps1 -ProjectPath <project path>`.
7. Run `after_effects/ae_scripts/00_build_project.jsx` in After Effects.
8. Inspect the exported midpoint frames in `quality_control/reference_frames/`.

The starter works without audio or media: it builds three ten-second slides over
solid backgrounds.

Validate a generated project before opening After Effects:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate_project.ps1" -ProjectPath "C:\VideoProjects\example_video"
```

After adding marked narration and final audio, create provisional local timing:

```powershell
$env:VIDEO_WHISPER_MODEL = "C:\Models\faster-whisper\large-v3"
python .\tools\align_audio.py --project-dir "C:\VideoProjects\example_video"
```

Review `audio/alignment/provisional_slide_timing.json` before rerunning with
`--update-ae-timeline`; speech alignment is evidence, not editorial approval.

## Repository Structure

```text
docs/       production rules and failure recovery
template/   clean project copied for each new video
tools/      project creation, validation, and local audio alignment
examples/   public-safe case-study and brief examples
```

## Sources Of Truth

```text
content/condensed_script.md                 narration
content/slide_plan.md                       approved slide logic
audio/final_audio.wav                       final duration
after_effects/ae_scripts/01_timeline.json   slide timing
after_effects/ae_scripts/slide_content/     visible text
assets/asset_manifest.json                  background mapping
design/style_config.json                    visual values
quality_control/reference_frames/           visual evidence
```

## Optional Integrations

The asset handoff is generator-neutral. Backgrounds may come from a camera,
stock library, 3D renderer, ComfyUI, or another image/video model. After Effects
consumes only approved project-local media and its manifest.

The optional UV preset and Twitch profile are examples derived from the original
case study. They are disabled by default. Twitch is also retained as a documented
example of integrating an optional third-party AE effect without bundling it.

## Licence

No open-source licence has been selected yet. Add a `LICENSE` file before
inviting reuse or contributions under specific terms.
