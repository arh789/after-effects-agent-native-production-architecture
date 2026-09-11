// Shared After Effects helpers. Keep this file project-neutral.

function getOrCreateFolder(folderName) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FolderItem && item.name === folderName) {
            return item;
        }
    }
    return app.project.items.addFolder(folderName);
}

function findCompByName(compName) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
            return item;
        }
    }
    return null;
}

function getOrCreateComp(name, width, height, pixelAspect, duration, fps) {
    var comp = findCompByName(name);
    if (comp !== null) {
        comp.width = width;
        comp.height = height;
        comp.pixelAspect = pixelAspect;
        comp.duration = duration;
        comp.frameRate = fps;
        return comp;
    }
    return app.project.items.addComp(
        name,
        width,
        height,
        pixelAspect,
        duration,
        fps
    );
}

function removeCompIfExists(compName) {
    for (var i = app.project.numItems; i >= 1; i--) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
            item.remove();
        }
    }
}

function removeCompsByPrefix(prefix) {
    for (var i = app.project.numItems; i >= 1; i--) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name.indexOf(prefix) === 0) {
            item.remove();
        }
    }
}

function removeLayerByName(comp, layerName) {
    for (var i = comp.numLayers; i >= 1; i--) {
        if (comp.layer(i).name === layerName) {
            comp.layer(i).remove();
        }
    }
}

function removeLayerBySourceName(comp, sourceName) {
    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        if (layer.source !== null && layer.source.name === sourceName) {
            layer.remove();
        }
    }
}

function loadJsonFile(pathString) {
    var file = new File(pathString);
    if (!file.exists) {
        throw new Error("JSON file not found: " + pathString);
    }
    file.encoding = "UTF-8";
    if (!file.open("r")) {
        throw new Error("Unable to open JSON file: " + pathString);
    }
    var source = file.read();
    file.close();
    if (typeof JSON !== "undefined" && JSON.parse) {
        return JSON.parse(source);
    }
    return eval("(" + source + ")");
}

function writeTextFile(fileObj, value) {
    fileObj.encoding = "UTF-8";
    if (!fileObj.open("w")) {
        throw new Error("Unable to write file: " + fileObj.fsName);
    }
    fileObj.write(value);
    fileObj.close();
}

function ensureFolder(folder) {
    if (!folder.exists && !folder.create()) {
        throw new Error("Unable to create folder: " + folder.fsName);
    }
    return folder;
}

function importFootageIfNeeded(fileObj) {
    if (!fileObj.exists) {
        throw new Error("Media file not found: " + fileObj.fsName);
    }
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (
            item instanceof FootageItem &&
            item.file !== null &&
            item.file.fsName === fileObj.fsName
        ) {
            return item;
        }
    }
    return app.project.importFile(new ImportOptions(fileObj));
}

function refreshFootageItem(item, fileObj) {
    if (item !== null && item instanceof FootageItem && item.file !== null) {
        if (item.file.fsName === fileObj.fsName) {
            item.replace(fileObj);
        }
    }
}

function safeName(value) {
    var output = String(value).toUpperCase();
    output = output.replace(/[^A-Z0-9]+/g, "_");
    return output.replace(/^_+|_+$/g, "");
}

function normalizeTextValue(value) {
    return String(value).replace(/\\n/g, "\r");
}

function hexToRgb01(hex) {
    var clean = String(hex).replace("#", "");
    return [
        parseInt(clean.substring(0, 2), 16) / 255,
        parseInt(clean.substring(2, 4), 16) / 255,
        parseInt(clean.substring(4, 6), 16) / 255
    ];
}

function pad2(number) {
    return number < 10 ? "0" + number : String(number);
}

function valueOr(object, key, fallback) {
    if (object !== null && object !== undefined && object[key] !== undefined) {
        return object[key];
    }
    return fallback;
}

function projectConfigNames(config) {
    var id = safeName(valueOr(config, "projectId", "PROJECT"));
    return {
        main: "MAIN__" + id,
        textDeck: "TEXT_DECK__" + id,
        backgroundDeck: "BACKGROUND_DECK__" + id,
        watermark: "WATERMARK__" + id
    };
}

