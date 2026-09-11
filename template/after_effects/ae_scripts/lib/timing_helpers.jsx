function snapTimeToFrame(seconds, fps) {
    return Math.round(seconds * fps) / fps;
}

function roundUpSecondsToFrame(seconds, fps) {
    return Math.ceil(seconds * fps) / fps;
}

function secondsToTimecode(seconds, fps) {
    var totalFrames = Math.round(seconds * fps);
    var frames = totalFrames % fps;
    var totalSeconds = Math.floor(totalFrames / fps);
    var secs = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var mins = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);
    return pad2(hours) + ":" + pad2(mins) + ":" + pad2(secs) + ":" + pad2(frames);
}

function secondsToFileTime(seconds, fps) {
    return secondsToTimecode(seconds, fps).replace(/:/g, "-");
}

function validateTimeline(timeline, fps) {
    if (!timeline.slides || timeline.slides.length === 0) {
        throw new Error("Timeline contains no slides.");
    }
    var tolerance = 0.5 / fps;
    for (var i = 0; i < timeline.slides.length; i++) {
        var slide = timeline.slides[i];
        if (slide.endSec <= slide.startSec) {
            throw new Error(slide.id + " has an invalid time range.");
        }
        if (Math.abs((slide.endSec - slide.startSec) - slide.durationSec) > tolerance) {
            throw new Error(slide.id + " durationSec does not match its boundaries.");
        }
        if (i > 0 && Math.abs(slide.startSec - timeline.slides[i - 1].endSec) > tolerance) {
            throw new Error(slide.id + " does not begin at the previous slide boundary.");
        }
    }
}

