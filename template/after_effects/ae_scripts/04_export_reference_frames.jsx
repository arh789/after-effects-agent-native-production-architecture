#target aftereffects

#include "./lib/ae_helpers.jsx"
#include "./lib/timing_helpers.jsx"

(function () {
    var scriptFile = new File($.fileName);
    var scriptDir = scriptFile.parent;
    var projectDir = scriptDir.parent.parent;
    var config = loadJsonFile(projectDir.fsName + "/project.json");
    var timeline = loadJsonFile(scriptDir.fsName + "/01_timeline.json");
    var names = projectConfigNames(config);
    var fps = config.format.frameRate;
    var mainComp = findCompByName(names.main);

    if (mainComp === null) {
        throw new Error("Main comp not found: " + names.main);
    }
    if (typeof mainComp.saveFrameToPng !== "function") {
        throw new Error("This AE version does not expose saveFrameToPng().");
    }

    var outputRoot = ensureFolder(new Folder(
        projectDir.fsName + "/" + config.paths.referenceFrames
    ));
    var runFolder = ensureFolder(new Folder(
        outputRoot.fsName + "/reference_build_" + timestampValue()
    ));
    var report = [
        "Slide reference frame export",
        "Main comp: " + names.main,
        "Output folder: " + runFolder.fsName,
        ""
    ];

    for (var i = 0; i < timeline.slides.length; i++) {
        var slide = timeline.slides[i];
        var midpoint = snapTimeToFrame(
            (slide.startSec + slide.endSec) / 2,
            fps
        );
        var file = new File(
            runFolder.fsName + "/" + pad2(i + 1) + "__" +
            safeName(slide.id) + "__mid_" + secondsToFileTime(midpoint, fps) + ".png"
        );
        mainComp.saveFrameToPng(midpoint, file);
        report.push(
            slide.id + " | " + slide.title + " | " +
            secondsToTimecode(midpoint, fps) + " | " + file.fsName
        );
    }

    $.sleep(valueOr(config.referenceFrames, "flushDelayMs", 3000));
    writeTextFile(
        new File(runFolder.fsName + "/reference_frame_export_report.txt"),
        report.join("\n") + "\n"
    );
    $.global.LAST_REFERENCE_FRAME_EXPORT_FOLDER = runFolder.fsName;

    if (!$.global.SUPPRESS_BUILD_ALERTS) {
        alert("Reference frames exported:\n" + runFolder.fsName);
    }
})();

function timestampValue() {
    var now = new Date();
    return String(now.getFullYear()) + pad2(now.getMonth() + 1) +
        pad2(now.getDate()) + "_" + pad2(now.getHours()) +
        pad2(now.getMinutes()) + pad2(now.getSeconds());
}

