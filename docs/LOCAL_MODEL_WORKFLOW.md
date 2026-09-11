# Local Model Workflow

Codex orchestrates local models for expensive first-pass media analysis, then
evaluates and applies their outputs. Suitable tasks include transcription,
word-level timing, forced alignment, OCR, repetitive frame inspection, and asset
inventory.

Set the model location explicitly so projects remain portable:

```text
VIDEO_WHISPER_MODEL=<absolute path to a local faster-whisper model>
```

If the environment variable is absent, `tools/align_audio.py` looks for:

```text
<user home>/models/faster-whisper/large-v3
```

Use a dedicated Python virtual environment with `faster-whisper` installed.
Do not commit model weights, virtual environments, transcripts containing
private material, or generated timestamp evidence.

Skip local inference when the model is absent, setup would exceed the task, or
direct inspection is more reliable. Model output is provisional until checked
against the source material.
