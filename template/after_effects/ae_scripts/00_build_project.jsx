#target aftereffects

#include "./lib/ae_helpers.jsx"
#include "./lib/timing_helpers.jsx"

// User-facing entry point for a complete project build.

(function () {
    var scriptFile = new File($.fileName);
    var scriptDir = scriptFile.parent;
    var projectDir = scriptDir.parent.parent;
    var config = loadJsonFile(projectDir.fsName + "/project.json");
    var timeline = loadJsonFile(scriptDir.fsName + "/01_timeline.json");
    var names = projectConfigNames(config);
    var format = config.format;
    var reportFile = new File(projectDir.fsName + "/" + config.paths.buildReport);
    var quiet = $.global.SUPPRESS_BUILD_ALERTS === true;
    var undoOpen = false;

    try {
        if (app.project === null) {
            app.newProject();
        }
        validateTimeline(timeline, format.frameRate);
        app.beginUndoGroup("Build Video Project");
        undoOpen = true;
        app.project.bitsPerChannel = format.bitsPerChannel;

        var duration = roundUpSecondsToFrame(
            timeline.totalDurationSec,
            format.frameRate
        );
        var audioFile = new File(
            projectDir.fsName + "/" + config.paths.finalAudio
        );
        var audioItem = null;
        var usingAudio = false;

        if (audioFile.exists) {
            audioItem = importFootageIfNeeded(audioFile);
            refreshFootageItem(audioItem, audioFile);
            duration = roundUpSecondsToFrame(audioItem.duration, format.frameRate);
            usingAudio = true;
        }

        var mainFolder = getOrCreateFolder("01_MAIN");
        getOrCreateFolder("02_SLIDES");
        getOrCreateFolder("03_MEDIA");
        var mainComp = getOrCreateComp(
            names.main,
            format.width,
            format.height,
            format.pixelAspect,
            duration,
            format.frameRate
        );
        mainComp.parentFolder = mainFolder;
        mainComp.bgColor = hexToRgb01(config.backgrounds.solidFallback);
        removeLayerByName(mainComp, "AUDIO__FINAL");

        if (usingAudio) {
            audioItem.parentFolder = mainFolder;
            var audioLayer = mainComp.layers.add(audioItem);
            audioLayer.name = "AUDIO__FINAL";
            audioLayer.startTime = 0;
            audioLayer.inPoint = 0;
            audioLayer.outPoint = Math.min(duration, audioItem.duration);
        }

        app.endUndoGroup();
        undoOpen = false;

        $.global.SUPPRESS_BUILD_ALERTS = true;
        $.global.VIDEO_MAIN_DURATION = duration;
        $.evalFile(new File(scriptDir.fsName + "/02_build_text_deck.jsx"));
        $.evalFile(new File(scriptDir.fsName + "/03_build_background_deck.jsx"));

        var referenceResult = "disabled";
        if (config.referenceFrames.autoExport) {
            $.evalFile(new File(scriptDir.fsName + "/04_export_reference_frames.jsx"));
            referenceResult = $.global.LAST_REFERENCE_FRAME_EXPORT_FOLDER;
        }

        var report = [
            "Video project build complete",
            "Project ID: " + config.projectId,
            "Main comp: " + names.main,
            "Resolution: " + format.width + " x " + format.height,
            "Frame rate: " + format.frameRate,
            "Colour depth: " + format.bitsPerChannel + "-bpc",
            "Duration: " + secondsToTimecode(duration, format.frameRate),
            "Timing source: " + (usingAudio ? config.paths.finalAudio : "timeline JSON"),
            "Slides: " + timeline.slides.length,
            "Reference frames: " + referenceResult
        ].join("\n");
        ensureFolder(reportFile.parent);
        writeTextFile(reportFile, report + "\n");

        $.global.VIDEO_MAIN_DURATION = undefined;
        if (!quiet) {
            alert(report);
        } else {
            $.writeln(report);
        }
    } catch (error) {
        if (undoOpen) {
            try {
                app.endUndoGroup();
            } catch (ignored) {}
        }
        $.global.VIDEO_MAIN_DURATION = undefined;
        var failure = "Video project build failed\n" + error.toString();
        try {
            ensureFolder(reportFile.parent);
            writeTextFile(reportFile, failure + "\n");
        } catch (reportError) {}
        if (!quiet) {
            alert(failure);
        } else {
            $.writeln(failure);
        }
        throw error;
    }
})();

