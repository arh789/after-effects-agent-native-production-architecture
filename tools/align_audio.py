"""Align marked slide sections to local faster-whisper word timestamps.

The default run writes provisional evidence only. Pass --update-ae-timeline to
replace the project timeline after reviewing the alignment output.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import wave
from difflib import SequenceMatcher
from pathlib import Path

REPOSITORY_DIR = Path(__file__).resolve().parents[1]
DEFAULT_PROJECT_DIR = REPOSITORY_DIR / "template"
DEFAULT_MODEL = Path.home() / "models" / "faster-whisper" / "large-v3"


def audio_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as source:
        return source.getnframes() / float(source.getframerate())


def normalize(text: str) -> list[str]:
    replacements = {
        "chatgpt": "chat gpt",
        "guardrails": "guard rails",
        "co-occurrence": "cooccurrence",
        "isn't": "isnt",
        "doesn't": "doesnt",
        "don't": "dont",
        "model's": "models",
        "answer's": "answers",
        "sda-3": "sda three",
        "->": " to ",
    }
    text = text.lower()
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"[^a-z0-9]+", " ", text).split()


def parse_markers(path: Path) -> list[dict]:
    raw = path.read_text(encoding="utf-8-sig")
    pattern = re.compile(r"^## \[SLIDE\s+(\d+)\s+-\s+([^\]]+)\]\s*$", re.I | re.M)
    matches = list(pattern.finditer(raw))
    if not matches:
        raise RuntimeError(f"No slide markers found in {path}")
    slides = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(raw)
        slides.append(
            {
                "id": f"SL{int(match.group(1)):02d}",
                "title": match.group(2).strip().title(),
                "body": raw[match.end() : end].strip(),
            }
        )
    return slides


def timecode(seconds: float, fps: int) -> str:
    frames_total = int(round(seconds * fps))
    frames = frames_total % fps
    seconds_total = frames_total // fps
    return f"{seconds_total // 3600:02d}:{(seconds_total // 60) % 60:02d}:{seconds_total % 60:02d}:{frames:02d}"


def find_anchor(target: list[str], words: list[dict], minimum: int) -> tuple[int, float, str]:
    target = target[: min(14, len(target))]
    if not target:
        return minimum, 0.0, ""
    best = (minimum, -1.0, "")
    final_start = max(minimum, len(words) - len(target))
    for index in range(minimum, final_start + 1):
        candidate = [word["norm"] for word in words[index : index + len(target)]]
        score = SequenceMatcher(None, target, candidate).ratio()
        if score > best[1]:
            best = (index, score, " ".join(candidate))
    return best


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=DEFAULT_PROJECT_DIR,
        help="Project created from this repository's template",
    )
    parser.add_argument("--update-ae-timeline", action="store_true")
    args = parser.parse_args()

    project_dir = args.project_dir.expanduser().resolve()
    project_config = project_dir / "project.json"
    marked_transcript = project_dir / "content" / "transcript_with_slide_markers.md"
    alignment_dir = project_dir / "audio" / "alignment"
    words_out = alignment_dir / "word_timestamps.json"
    timing_out = alignment_dir / "provisional_slide_timing.json"
    ae_timeline = project_dir / "after_effects" / "ae_scripts" / "01_timeline.json"

    if not project_config.exists():
        raise RuntimeError(f"Project configuration not found: {project_config}")
    config = json.loads(project_config.read_text(encoding="utf-8-sig"))
    audio = project_dir / config["paths"]["finalAudio"]
    model_path = Path(os.environ.get("VIDEO_WHISPER_MODEL", str(DEFAULT_MODEL)))
    fps = int(config["format"]["frameRate"])
    if not audio.exists():
        raise RuntimeError(f"Final audio not found: {audio}")
    if not model_path.exists():
        raise RuntimeError(f"Local faster-whisper model not found: {model_path}")

    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        raise RuntimeError(
            "faster-whisper is not installed in the active Python environment"
        ) from error

    slides = parse_markers(marked_transcript)
    model = WhisperModel(str(model_path), device="cpu", compute_type="int8", local_files_only=True)
    segments_iter, _ = model.transcribe(
        str(audio), language="en", beam_size=5, word_timestamps=True, vad_filter=False
    )
    segments = []
    words = []
    for segment in segments_iter:
        segment_words = []
        for word in segment.words or []:
            token = word.word.strip()
            normalized = normalize(token)
            record = {
                "word": token,
                "norm": normalized[0] if normalized else "",
                "start": round(float(word.start), 3),
                "end": round(float(word.end), 3),
            }
            segment_words.append(record)
            if record["norm"]:
                words.append(record)
        segments.append(
            {
                "start": round(float(segment.start), 3),
                "end": round(float(segment.end), 3),
                "text": segment.text.strip(),
                "words": segment_words,
            }
        )

    duration = audio_duration(audio)
    alignment_dir.mkdir(parents=True, exist_ok=True)
    words_out.write_text(
        json.dumps({"audio": str(audio), "model": str(model_path), "segments": segments}, indent=2),
        encoding="utf-8",
    )

    aligned = []
    minimum = 0
    for index, slide in enumerate(slides):
        if index == 0:
            word_index, score, matched = 0, 1.0, "audio start"
        else:
            word_index, score, matched = find_anchor(normalize(slide["body"]), words, minimum)
        start = words[word_index]["start"] if words else 0.0
        minimum = max(minimum, word_index + 1)
        aligned.append(
            {
                "id": slide["id"],
                "title": slide["title"],
                "startSec": round(start, 3),
                "startTimecode": timecode(start, fps),
                "alignmentScore": round(score, 3),
                "matched": matched,
            }
        )

    for index, slide in enumerate(aligned):
        end = aligned[index + 1]["startSec"] if index + 1 < len(aligned) else duration
        slide["endSec"] = round(end, 3)
        slide["endTimecode"] = timecode(end, fps)
        slide["durationSec"] = round(end - slide["startSec"], 3)

    payload = {
        "schemaVersion": 1,
        "project": config["projectId"],
        "sourceAudio": config["paths"]["finalAudio"],
        "timingSource": "local_faster_whisper_large_v3",
        "totalDurationSec": round(duration, 3),
        "totalDurationTimecode30fps": timecode(duration, fps),
        "slides": aligned,
    }
    timing_out.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    if args.update_ae_timeline:
        ae_payload = dict(payload)
        ae_payload["slides"] = [
            {key: slide[key] for key in ("id", "title", "startSec", "endSec", "durationSec")}
            for slide in aligned
        ]
        ae_timeline.write_text(json.dumps(ae_payload, indent=2), encoding="utf-8")
        print(ae_timeline)
    print(timing_out)


if __name__ == "__main__":
    main()
