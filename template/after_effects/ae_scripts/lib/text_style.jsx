function addStyledTextGroup(comp, itemSpec, styleConfig) {
    var role = styleConfig.roles[itemSpec.role];
    if (!role) {
        throw new Error("Unknown text role: " + itemSpec.role);
    }

    var core = comp.layers.addText(normalizeTextValue(itemSpec.text));
    core.name = "TEXT_CORE__" + safeName(itemSpec.name);
    applyCoreTextStyle(core, itemSpec, role, styleConfig);

    var bloom = null;
    var halo = null;
    if (role.bloom && role.bloom.enabled) {
        bloom = addTextEffectDuplicate(core, "BLOOM", role.bloom);
    }
    if (role.halo && role.halo.enabled) {
        halo = addTextEffectDuplicate(core, "HALO", role.halo);
    }

    core.moveToBeginning();
    if (bloom !== null) {
        bloom.moveAfter(core);
    }
    if (halo !== null) {
        halo.moveAfter(bloom !== null ? bloom : core);
    }
    return core;
}

function applyCoreTextStyle(layer, itemSpec, role, styleConfig) {
    var prop = layer.property("Source Text");
    var doc = prop.value;
    doc.resetCharStyle();
    doc.resetParagraphStyle();
    doc.text = normalizeTextValue(itemSpec.text);
    doc.font = styleConfig.fonts[role.font] || role.font;
    doc.fontSize = valueOr(itemSpec, "fontSize", role.fontSize);
    doc.fillColor = hexToRgb01(valueOr(itemSpec, "color", role.coreColor));
    doc.applyFill = true;
    doc.applyStroke = false;
    doc.tracking = valueOr(itemSpec, "tracking", role.tracking);
    doc.leading = valueOr(itemSpec, "leading", role.leading);
    doc.autoLeading = false;
    doc.justification = resolveJustification(valueOr(itemSpec, "align", "left"));
    prop.setValue(doc);
    layer.property("ADBE Transform Group").property("ADBE Position").setValue([
        itemSpec.x,
        itemSpec.y
    ]);
    layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(
        valueOr(itemSpec, "opacity", role.coreOpacity)
    );
}

function addTextEffectDuplicate(core, suffix, effectSpec) {
    var duplicate = core.duplicate();
    duplicate.name = suffix + "__" + core.name.substring("TEXT_CORE__".length);
    duplicate.parent = core;
    var prop = duplicate.property("Source Text");
    var doc = prop.value;
    doc.fillColor = hexToRgb01(effectSpec.color);
    prop.setValue(doc);
    prop.expression = "thisComp.layer(\"" + core.name + "\").text.sourceText.toString()";
    duplicate.blendingMode = effectSpec.blendMode === "ADD" ? BlendingMode.ADD : BlendingMode.SCREEN;
    duplicate.property("ADBE Transform Group").property("ADBE Opacity").setValue(effectSpec.opacity);
    var blur = duplicate.property("ADBE Effect Parade").addProperty("ADBE Fast Blur");
    blur.property("Blurriness").setValue(effectSpec.blur);
    blur.property("Repeat Edge Pixels").setValue(true);
    return duplicate;
}

function addWatermark(comp, value, x, y, styleConfig) {
    return addStyledTextGroup(comp, {
        name: "watermark",
        text: value,
        role: "reference",
        x: x,
        y: y,
        align: "right",
        opacity: 88,
        fontSize: 36
    }, styleConfig);
}

function resolveJustification(value) {
    if (value === "center") {
        return ParagraphJustification.CENTER_JUSTIFY;
    }
    if (value === "right") {
        return ParagraphJustification.RIGHT_JUSTIFY;
    }
    return ParagraphJustification.LEFT_JUSTIFY;
}

