#target photoshop

(function () {
    var originalDialogs = app.displayDialogs;
    var originalUnits = app.preferences.rulerUnits;
    app.displayDialogs = DialogModes.NO;
    app.preferences.rulerUnits = Units.PIXELS;

    var scriptDir = new File($.fileName).parent;
    var thumbnailDir = scriptDir.parent;
    var sourceDir = new Folder(thumbnailDir.fsName + "/source");
    var exportDir = ensureFolder(new Folder(thumbnailDir.fsName + "/trial_exports"));
    var config = loadJson(new File(thumbnailDir.fsName + "/thumbnail_config.json"));
    var sourcePsd = new File(sourceDir.fsName + "/thumbnail.psd");
    var sourcePng = new File(sourceDir.fsName + "/thumbnail.png");
    var sourceFile = sourcePsd.exists ? sourcePsd : sourcePng;
    var sourceWasOpen = false;
    var sourceDoc = null;
    var workingDoc = null;

    try {
        if (!sourceFile.exists) {
            throw new Error("Expected source/thumbnail.psd or source/thumbnail.png");
        }
        var opened = openSource(sourceFile);
        sourceDoc = opened.doc;
        sourceWasOpen = opened.wasOpen;
        workingDoc = sourceDoc.duplicate("thumbnail_build_working_copy", false);
        app.activeDocument = workingDoc;
        workingDoc.resizeImage(
            UnitValue(config.canvas.width, "px"),
            UnitValue(config.canvas.height, "px"),
            null,
            ResampleMethod.BICUBIC
        );

        removeNamedGroup(workingDoc, config.generatedGroup);
        var group = workingDoc.layerSets.add();
        group.name = config.generatedGroup;
        var specs = [];

        if (config.scrim.enabled) {
            addScrim(workingDoc, group, config.scrim, specs);
        }
        for (var i = 0; i < config.textItems.length; i++) {
            addTextStack(workingDoc, group, config.textItems[i], specs);
        }

        var png = nextVersionedFile(exportDir, config.exportPrefix, ".png");
        var versionPsd = new File(png.fsName.replace(/\.png$/i, ".psd"));
        var coordinateFile = new File(
            png.fsName.replace(/\.png$/i, "_layer_coordinates.txt")
        );
        var finalPsd = new File(thumbnailDir.fsName + "/thumbnail_final.psd");

        savePsd(workingDoc, finalPsd);
        exportPng(workingDoc, png);
        savePsd(workingDoc, versionPsd);
        writeCoordinates(coordinateFile, png, versionPsd, workingDoc, specs);
        appendBuildLog(
            new File(thumbnailDir.fsName + "/thumbnail_build_log.md"),
            png,
            versionPsd,
            specs
        );
    } catch (error) {
        throw error;
    } finally {
        if (workingDoc !== null) {
            closeWithoutSaving(workingDoc);
        }
        if (sourceDoc !== null && !sourceWasOpen) {
            closeWithoutSaving(sourceDoc);
        }
        app.displayDialogs = originalDialogs;
        app.preferences.rulerUnits = originalUnits;
    }

    function loadJson(file) {
        file.encoding = "UTF-8";
        if (!file.exists || !file.open("r")) {
            throw new Error("Unable to read config: " + file.fsName);
        }
        var source = file.read();
        file.close();
        if (typeof JSON !== "undefined" && JSON.parse) {
            return JSON.parse(source);
        }
        return eval("(" + source + ")");
    }

    function ensureFolder(folder) {
        if (!folder.exists && !folder.create()) {
            throw new Error("Unable to create folder: " + folder.fsName);
        }
        return folder;
    }

    function openSource(file) {
        for (var i = 0; i < app.documents.length; i++) {
            try {
                if (app.documents[i].fullName.fsName === file.fsName) {
                    return {doc: app.documents[i], wasOpen: true};
                }
            } catch (ignored) {}
        }
        return {doc: app.open(file), wasOpen: false};
    }

    function removeNamedGroup(parent, name) {
        for (var i = parent.layerSets.length - 1; i >= 0; i--) {
            if (parent.layerSets[i].name === name) {
                try {
                    parent.layerSets[i].remove();
                } catch (error) {
                    parent.layerSets[i].visible = false;
                    parent.layerSets[i].name = name + "__PREVIOUS";
                }
            }
        }
    }

    function addScrim(doc, group, spec, rows) {
        addRectangle(doc, group, "TEXT_SCRIM_SOLID", 0, spec.solidRight, spec.opacity, spec.color, rows);
        var width = spec.fadeRight - spec.solidRight;
        for (var i = 0; i < spec.steps; i++) {
            var x1 = Math.round(spec.solidRight + width * i / spec.steps);
            var x2 = Math.round(spec.solidRight + width * (i + 1) / spec.steps);
            var opacity = spec.opacity * (1 - (i + 1) / (spec.steps + 1));
            addRectangle(doc, group, "TEXT_SCRIM_FADE_" + pad2(i + 1), x1, x2, opacity, spec.color, rows);
        }
    }

    function addRectangle(doc, group, name, x1, x2, opacity, color, rows) {
        var layer = doc.artLayers.add();
        layer.name = name;
        layer.move(group, ElementPlacement.INSIDE);
        doc.selection.select([[x1, 0], [x2, 0], [x2, doc.height.as("px")], [x1, doc.height.as("px")]]);
        doc.selection.fill(toColor(color), ColorBlendMode.NORMAL, 100, false);
        doc.selection.deselect();
        layer.opacity = opacity;
        rows.push([name, "rect", x1, 0, x2 - x1, doc.height.as("px"), "", "", "", opacity, color, ""]);
    }

    function addTextStack(doc, group, spec, rows) {
        var core = group.artLayers.add();
        core.kind = LayerKind.TEXT;
        core.name = spec.name + "__CORE";
        var text = core.textItem;
        text.contents = spec.text.replace(/\\n/g, "\r");
        text.kind = TextType.PARAGRAPHTEXT;
        text.position = [spec.x, spec.y];
        text.width = UnitValue(spec.width, "px");
        text.height = UnitValue(spec.height, "px");
        text.font = spec.font;
        text.size = UnitValue(pxToPoints(spec.sizePx, doc.resolution), "pt");
        text.leading = UnitValue(pxToPoints(spec.leadingPx, doc.resolution), "pt");
        text.tracking = spec.tracking;
        text.color = toColor(spec.color);
        rows.push([core.name, "text_core", spec.x, spec.y, spec.width, spec.height, spec.sizePx, spec.leadingPx, spec.tracking, 100, spec.color, spec.text]);

        if (spec.glow && spec.glow !== "none") {
            var red = spec.glow === "red";
            addGlowDuplicate(doc, core, spec.name + "__HALO", red ? "8C0414" : "3722B8", red ? 34 : 24, red ? 36 : 42, rows, spec);
            addGlowDuplicate(doc, core, spec.name + "__BLOOM", red ? "FF2D3E" : "5C4CFF", red ? 50 : 46, red ? 15 : 18, rows, spec);
        }
    }

    function addGlowDuplicate(doc, core, name, color, opacity, blur, rows, spec) {
        var layer = core.duplicate();
        layer.name = name;
        layer.move(core, ElementPlacement.PLACEAFTER);
        layer.textItem.color = toColor(color);
        layer.opacity = opacity;
        layer.rasterize(RasterizeType.TEXTCONTENTS);
        doc.activeLayer = layer;
        var descriptor = new ActionDescriptor();
        descriptor.putUnitDouble(charIDToTypeID("Rds "), charIDToTypeID("#Pxl"), blur);
        executeAction(charIDToTypeID("GsnB"), descriptor, DialogModes.NO);
        rows.push([name, "text_glow", spec.x, spec.y, spec.width, spec.height, spec.sizePx, spec.leadingPx, spec.tracking, opacity, color, "blur=" + blur]);
    }

    function nextVersionedFile(folder, prefix, suffix) {
        for (var i = 1; i < 1000; i++) {
            var file = new File(folder.fsName + "/" + prefix + pad3(i) + suffix);
            if (!file.exists) {
                return file;
            }
        }
        throw new Error("No available versioned thumbnail filename.");
    }

    function savePsd(doc, file) {
        var options = new PhotoshopSaveOptions();
        options.layers = true;
        options.alphaChannels = true;
        options.embedColorProfile = true;
        doc.saveAs(file, options, true, Extension.LOWERCASE);
    }

    function exportPng(doc, file) {
        var options = new ExportOptionsSaveForWeb();
        options.format = SaveDocumentType.PNG;
        options.PNG8 = false;
        options.transparency = false;
        options.interlaced = false;
        doc.exportDocument(file, ExportType.SAVEFORWEB, options);
    }

    function writeCoordinates(file, png, psd, doc, specs) {
        var lines = [
            "Thumbnail coordinate report",
            "Export: " + png.fsName,
            "Editable PSD: " + psd.fsName,
            "Document: " + doc.width.as("px") + " x " + doc.height.as("px"),
            "Built: " + new Date().toString(),
            "",
            "Layer\tType\tX\tY\tW\tH\tSizePx\tLeadingPx\tTracking\tOpacity\tColor\tTextOrEffect"
        ];
        for (var i = 0; i < specs.length; i++) {
            lines.push(specs[i].join("\t"));
        }
        file.encoding = "UTF-8";
        file.open("w");
        file.write(lines.join("\n") + "\n");
        file.close();
    }

    function appendBuildLog(file, png, psd, specs) {
        var lines = [
            "## " + png.name,
            "",
            "- Built: " + new Date().toString(),
            "- Export: `" + png.fsName + "`",
            "- Editable PSD: `" + psd.fsName + "`",
            "- Generated layers: " + specs.length,
            ""
        ];
        file.encoding = "UTF-8";
        file.open(file.exists ? "a" : "w");
        file.write(lines.join("\n") + "\n");
        file.close();
    }

    function closeWithoutSaving(doc) {
        try {
            app.activeDocument = doc;
            doc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (ignored) {}
    }

    function toColor(hex) {
        var color = new SolidColor();
        var clean = String(hex).replace("#", "");
        color.rgb.red = parseInt(clean.substring(0, 2), 16);
        color.rgb.green = parseInt(clean.substring(2, 4), 16);
        color.rgb.blue = parseInt(clean.substring(4, 6), 16);
        return color;
    }

    function pxToPoints(px, resolution) {
        return Math.round((px * 72 / resolution) * 1000) / 1000;
    }

    function pad2(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function pad3(value) {
        if (value < 10) return "00" + value;
        if (value < 100) return "0" + value;
        return String(value);
    }
})();

