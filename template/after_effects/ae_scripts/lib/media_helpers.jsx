function addBaseSolid(comp, color) {
    var layer = comp.layers.addSolid(
        color,
        "BASE__SOLID",
        comp.width,
        comp.height,
        comp.pixelAspect,
        comp.duration
    );
    layer.startTime = 0;
    layer.inPoint = 0;
    layer.outPoint = comp.duration;
    return layer;
}

function applyCoverLayout(layer, footage, comp, entry) {
    var widthScale = comp.width / footage.width;
    var heightScale = comp.height / footage.height;
    var zoom = valueOr(entry, "zoom", 1);
    var scale = Math.max(widthScale, heightScale) * zoom * 100;
    var transform = layer.property("ADBE Transform Group");
    transform.property("ADBE Position").setValue([
        comp.width / 2 + valueOr(entry, "x", 0),
        comp.height / 2 + valueOr(entry, "y", 0)
    ]);
    transform.property("ADBE Scale").setValue([scale, scale]);
    transform.property("ADBE Opacity").setValue(valueOr(entry, "opacity", 100));
}

function addMediaToBackgroundComp(comp, footage, fileObj, entry, enableTwitch, twitchConfig) {
    if (footage.mainSource.isStill || valueOr(entry, "loop", true) === false) {
        var stillLayer = comp.layers.add(footage);
        stillLayer.name = "MEDIA__" + fileObj.name;
        stillLayer.startTime = 0;
        stillLayer.inPoint = 0;
        stillLayer.outPoint = comp.duration;
        applyCoverLayout(stillLayer, footage, comp, entry);
        return 0;
    }

    var seams = [];
    var cursor = 0;
    var number = 1;
    var frameDuration = 1 / comp.frameRate;
    while (cursor < comp.duration - frameDuration / 2) {
        var layer = comp.layers.add(footage);
        layer.name = "VIDEO_LOOP_" + pad2(number) + "__" + fileObj.name;
        layer.startTime = cursor;
        layer.inPoint = cursor;
        layer.outPoint = Math.min(cursor + footage.duration, comp.duration);
        applyCoverLayout(layer, footage, comp, entry);
        if (number > 1) {
            seams.push(cursor);
        }
        cursor += footage.duration;
        number++;
    }

    if (enableTwitch && valueOr(entry, "twitchSeams", false)) {
        addTwitchSeams(comp, seams, twitchConfig);
    }
    return seams.length;
}

function addTwitchSeams(comp, seams, config) {
    var before = valueOr(config, "glitchFramesBefore", 3);
    var after = valueOr(config, "glitchFramesAfter", 3);
    var frameDuration = 1 / comp.frameRate;
    for (var i = 0; i < seams.length; i++) {
        var start = Math.max(0, seams[i] - before * frameDuration);
        var end = Math.min(comp.duration, seams[i] + after * frameDuration);
        var layer = comp.layers.addSolid(
            [0, 0, 0],
            "GLITCH__SEAM_" + pad2(i + 1),
            comp.width,
            comp.height,
            comp.pixelAspect,
            end - start
        );
        layer.adjustmentLayer = true;
        layer.startTime = start;
        layer.inPoint = start;
        layer.outPoint = end;
        var effect = addTwitchEffect(layer);
        applyTwitchProfile(effect, i);
        layer.moveToBeginning();
    }
}

function addTwitchEffect(layer) {
    var effects = layer.property("ADBE Effect Parade");
    var effect = null;
    try {
        effect = effects.addProperty("Videocopilot TwitchMIB8LFea");
    } catch (matchNameError) {
        try {
            effect = effects.addProperty("Twitch");
        } catch (displayNameError) {
            effect = null;
        }
    }
    if (effect === null) {
        throw new Error("Twitch seams are enabled, but Video Copilot Twitch is unavailable.");
    }
    return effect;
}

function applyTwitchProfile(effect, seamIndex) {
    setTwitchValue(effect, ["Amount"], 100);
    setTwitchValue(effect, ["speed", "Speed"], 5);
    setTwitchValue(effect, ["Blur"], 1);
    setTwitchValue(effect, ["Color"], 0);
    setTwitchValue(effect, ["Light"], 1);
    setTwitchValue(effect, ["Scale"], 0);
    setTwitchValue(effect, ["Slide"], 1);
    setTwitchValue(effect, ["Time"], 1);
    setTwitchValue(effect, ["Ease In"], 1);
    setTwitchValue(effect, ["Ease Out"], 1);
    setTwitchValue(effect, ["Border"], 1);
    setTwitchValue(effect, ["Show Twitch Only"], 0);
    setTwitchValue(effect, ["Seed"], 5 + seamIndex);
    setTwitchValue(effect, ["Randomize Minimum"], 0);
    setTwitchValue(effect, ["Blur Amount"], 50);
    setTwitchValue(effect, ["Blur Twitches [sec]"], 1);
    setTwitchValue(effect, ["Blur Tint"], [1, 1, 1]);
    setTwitchValue(effect, ["Blur Holdout"], 0);
    setTwitchValue(effect, ["Blur Holdout Sharpness", "Blur Holdout Sharpen"], 1);
    setTwitchValue(effect, ["Blur Boost"], 100);
    setTwitchValue(effect, ["Blur Opacity"], 100);
    setTwitchValue(effect, ["Blur Transfer Mode"], 2);
    setTwitchValue(effect, ["Blur Aspect"], 0);
    setTwitchValue(effect, ["Use Lens Blur"], 0);
    setTwitchValue(effect, ["Unique Blur Seed"], 0);
    setTwitchValue(effect, ["Light Amount"], 100);
    setTwitchValue(effect, ["Light Twitches [sec]"], 4);
    setTwitchValue(effect, ["Light Behaviour"], 1);
    setTwitchValue(effect, ["Unique Light Seed"], 0);
    setTwitchValue(effect, ["Slide Amount"], 10);
    setTwitchValue(effect, ["Slide Twitches [sec]"], 4);
    setTwitchValue(effect, ["Slide Direction"], 0);
    setTwitchValue(effect, ["Slide Spread", "Slide Speed"], 1);
    setTwitchValue(effect, ["Slide Tendency"], 0);
    setTwitchValue(effect, ["Slide RGB Split"], 0);
    setTwitchValue(effect, ["Slide Motion Blur"], 100);
    setTwitchValue(effect, ["Unique Slide Seed"], 0);
    setTwitchValue(effect, ["Time Amount"], 50);
    setTwitchValue(effect, ["Time Twitches [sec]"], 12);
    setTwitchValue(effect, ["Time Direction"], 1);
    setTwitchValue(effect, ["Unique Time Seed"], 0);
}

function setTwitchValue(root, names, value) {
    var property = findWritableProperty(root, names);
    if (property === null) {
        throw new Error("Twitch property not found: " + names.join(" / "));
    }
    property.setValue(value);
}

function findWritableProperty(root, names) {
    for (var i = 1; i <= root.numProperties; i++) {
        var property = root.property(i);
        if (property.propertyType === PropertyType.PROPERTY) {
            for (var n = 0; n < names.length; n++) {
                if (property.name.toLowerCase() === names[n].toLowerCase()) {
                    try {
                        if (property.propertyValueType !== PropertyValueType.NO_VALUE) {
                            return property;
                        }
                    } catch (ignored) {
                        return property;
                    }
                }
            }
        } else {
            var nested = findWritableProperty(property, names);
            if (nested !== null) {
                return nested;
            }
        }
    }
    return null;
}

