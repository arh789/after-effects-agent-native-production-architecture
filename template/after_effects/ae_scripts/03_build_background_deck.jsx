#target aftereffects

#include "./lib/ae_helpers.jsx"
#include "./lib/timing_helpers.jsx"
#include "./lib/media_helpers.jsx"

(function () {
    var scriptFile = new File($.fileName);
    var scriptDir = scriptFile.parent;
    var projectDir = scriptDir.parent.parent;
    var config = loadJsonFile(projectDir.fsName + "/project.json");
    var timeline = loadJsonFile(scriptDir.fsName + "/01_timeline.json");
    var manifest = loadJsonFile(projectDir.fsName + "/" + config.paths.assetManifest);
    var names = projectConfigNames(config);
    var format = config.format;
    validateTimeline(timeline, format.frameRate);

    var totalDuration = roundUpSecondsToFrame(
        timeline.totalDurationSec,
        format.frameRate
    );
    var mainDuration = $.global.VIDEO_MAIN_DURATION || totalDuration;
    var mainFolder = getOrCreateFolder("01_MAIN");
    var slidesFolder = getOrCreateFolder("02_SLIDES");
    var mediaFolder = getOrCreateFolder("03_MEDIA");
    var mainComp = getOrCreateComp(
        names.main,
        format.width,
        format.height,
        format.pixelAspect,
        mainDuration,
        format.frameRate
    );

    app.beginUndoGroup("Build Background Deck");
    removeLayerBySourceName(mainComp, names.backgroundDeck);
    removeCompIfExists(names.backgroundDeck);
    removeCompsByPrefix("BG_SLIDE_");

    var deck = app.project.items.addComp(
        names.backgroundDeck,
        format.width,
        format.height,
        format.pixelAspect,
        totalDuration,
        format.frameRate
    );
    deck.parentFolder = mainFolder;
    deck.bgColor = hexToRgb01(config.backgrounds.solidFallback);
    var totalSeams = 0;

    for (var i = 0; i < timeline.slides.length; i++) {
        var timing = timeline.slides[i];
        var entry = findManifestEntry(manifest, timing.id);
        var duration = roundUpSecondsToFrame(
            timing.durationSec,
            format.frameRate
        );
        var comp = app.project.items.addComp(
            "BG_SLIDE_" + pad2(i + 1),
            format.width,
            format.height,
            format.pixelAspect,
            duration,
            format.frameRate
        );
        comp.parentFolder = slidesFolder;
        comp.bgColor = hexToRgb01(config.backgrounds.solidFallback);
        addBaseSolid(comp, hexToRgb01(config.backgrounds.solidFallback));

        if (entry !== null && entry.localPath !== null && entry.localPath !== "") {
            var mediaFile = new File(projectDir.fsName + "/" + entry.localPath);
            if (!mediaFile.exists) {
                throw new Error(timing.id + " background is missing: " + mediaFile.fsName);
            }
            var footage = importFootageIfNeeded(mediaFile);
            refreshFootageItem(footage, mediaFile);
            footage.parentFolder = mediaFolder;
            totalSeams += addMediaToBackgroundComp(
                comp,
                footage,
                mediaFile,
                entry,
                config.backgrounds.enableTwitchSeams,
                config.backgrounds
            );
        }

        var layer = deck.layers.add(comp);
        layer.name = comp.name;
        layer.startTime = timing.startSec;
        layer.inPoint = timing.startSec;
        layer.outPoint = timing.endSec;
    }

    var deckLayer = mainComp.layers.add(deck);
    deckLayer.name = names.backgroundDeck;
    deckLayer.startTime = 0;
    deckLayer.inPoint = 0;
    deckLayer.outPoint = Math.min(totalDuration, mainDuration);
    deckLayer.moveToEnd();
    app.endUndoGroup();

    $.global.LAST_BACKGROUND_SEAM_COUNT = totalSeams;
    if (!$.global.SUPPRESS_BUILD_ALERTS) {
        alert("Background deck built. Internal seams: " + totalSeams);
    }
})();

function findManifestEntry(manifest, slideId) {
    for (var i = 0; i < manifest.slides.length; i++) {
        if (manifest.slides[i].id === slideId) {
            return manifest.slides[i];
        }
    }
    return null;
}

