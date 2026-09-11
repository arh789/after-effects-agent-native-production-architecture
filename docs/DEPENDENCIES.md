# Dependencies

## Required

- Adobe After Effects with script execution permitted.
- PowerShell 5.1 or later on Windows.
- Fonts configured by the active project.

## Optional

- Adobe Photoshop for scripted thumbnail construction.
- Python 3.10+ and `faster-whisper` for local word timestamps.
- Video Copilot Twitch for internal video-loop seam effects.

Twitch is not bundled. The template stores only property-setting code and leaves
the integration disabled by default. The example fonts are common system fonts;
projects should replace them with appropriately licensed typography.

Set `VIDEO_WHISPER_MODEL` to a local faster-whisper model directory before
running audio alignment:

```powershell
$env:VIDEO_WHISPER_MODEL = "C:\Models\faster-whisper\large-v3"
python .\tools\align_audio.py --project-dir "C:\VideoProjects\example_video"
```
