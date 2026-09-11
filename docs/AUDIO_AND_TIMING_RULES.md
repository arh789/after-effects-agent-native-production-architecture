# Audio And Timing Rules

`audio/final_audio.wav` defines final composition duration. The marked transcript
defines the intended semantic boundaries. A local speech model provides word
timestamps and provisional matches; manual listening remains authoritative.

Workflow:

1. Confirm final audio and transcript wording match.
2. From the repository, run `tools/align_audio.py --project-dir <project path>`.
3. Review low-confidence marker matches.
4. Copy approved starts and ends into `after_effects/ae_scripts/01_timeline.json`.
5. Build and listen in After Effects.
6. Write every manual correction back to the JSON.

At 30 fps, all values should land on frame boundaries. Each slide normally starts
where the previous slide ends. Any overlap or gap must be intentional and noted.
`durationSec` must equal `endSec - startSec`.

The best historical results came from final transcript wording, explicit slide
markers, final edited audio, local word-level timing, and targeted manual review.
