#target aftereffects

#include "./lib/ae_helpers.jsx"
#include "./lib/timing_helpers.jsx"
#include "./lib/text_style.jsx"

(function () {
    var scriptFile = new File($.fileName);
    var scriptDir = scriptFile.parent;
    var projectDir = scriptDir.parent.parent;
    var config = loadJsonFile(projectDir.fsName + "/project.json");
    var timeline = loadJsonFile(scriptDir.fsName + "/01_timeline.json");
    var style = loadJsonFile(projectDir.fsName + "/" + config.paths.styleConfig);
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
    var mainComp = getOrCreateComp(
        names.main,
        format.width,
        format.height,
        format.pixelAspect,
        mainDuration,
        format.frameRate
    );
    mainComp.parentFolder = mainFolder;

    app.beginUndoGroup("Build Text Deck");
    removeLayerBySourceName(mainComp, names.textDeck);
    removeLayerBySourceName(mainComp, names.watermark);
    removeCompIfExists(names.textDeck);
    removeCompIfExists(names.watermark);
    removeCompsByPrefix("SLIDE_TEXT_");

    var deck = app.project.items.addComp(
        names.textDeck,
        format.width,
        format.height,
        format.pixelAspect,
        totalDuration,
        format.frameRate
    );
    deck.parentFolder = mainFolder;

    for (var i = 0; i < timeline.slides.length; i++) {
        var timing = timeline.slides[i];
        var number = parseInt(String(timing.id).replace(/[^0-9]/g, ""), 10);
        var content = loadJsonFile(
            scriptDir.fsName + "/slide_content/slide_" + pad2(number) + ".json"
        );
        var duration = roundUpSecondsToFrame(
            timing.durationSec,
            format.frameRate
        );
        var slideComp = app.project.items.addComp(
            "SLIDE_TEXT_" + pad2(number) + "__" + safeName(content.compSuffix),
            format.width,
            format.height,
            format.pixelAspect,
            duration,
            format.frameRate
        );
        slideComp.parentFolder = slidesFolder;
        for (var itemIndex = 0; itemIndex < content.items.length; itemIndex++) {
            addStyledTextGroup(slideComp, content.items[itemIndex], style);
        }

        var layer = deck.layers.add(slideComp);
        layer.name = slideComp.name;
        layer.startTime = timing.startSec;
        layer.inPoint = timing.startSec;
        layer.outPoint = timing.endSec;
    }

    var deckLayer = mainComp.layers.add(deck);
    deckLayer.name = names.textDeck;
    deckLayer.startTime = 0;
    deckLayer.inPoint = 0;
    deckLayer.outPoint = Math.min(totalDuration, mainDuration);

    if (config.watermark.enabled) {
        var watermarkComp = app.project.items.addComp(
            names.watermark,
            format.width,
            format.height,
            format.pixelAspect,
            mainDuration,
            format.frameRate
        );
        watermarkComp.parentFolder = mainFolder;
        addWatermark(
            watermarkComp,
            config.watermark.text,
            config.watermark.x,
            config.watermark.y,
            style
        );
        var watermarkLayer = mainComp.layers.add(watermarkComp);
        watermarkLayer.name = names.watermark;
        watermarkLayer.startTime = 0;
        watermarkLayer.inPoint = 0;
        watermarkLayer.outPoint = mainDuration;
    }
    app.endUndoGroup();

    if (!$.global.SUPPRESS_BUILD_ALERTS) {
        alert("Text deck built: " + timeline.slides.length + " slides");
    }
})();

