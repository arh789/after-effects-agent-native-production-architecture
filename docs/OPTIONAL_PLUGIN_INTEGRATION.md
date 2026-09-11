# Optional Plugin Integration

Third-party After Effects plugins must be optional, locally installed, and
disabled by default. The repository may include adapter code and configuration,
but never plugin binaries, licence data, or proprietary presets.

The Twitch seam implementation in
`template/after_effects/ae_scripts/lib/media_helpers.jsx` is the reference
adapter. It demonstrates the reusable pattern:

1. Gate the integration with a project-level feature flag.
2. Gate individual uses with an asset-level flag.
3. Apply the effect only to a narrowly scoped adjustment layer.
4. Try the installed effect's match name before its display name.
5. Map controls by the actual property names exposed by that AE installation.
6. Fail with an actionable error when the effect or a required control is absent.
7. Keep source timing and non-target comps unchanged.

Twitch is disabled by `backgrounds.enableTwitchSeams` in `project.json`. A slide
must also set `twitchSeams` in `assets/asset_manifest.json`. When both flags are
true, the adapter creates short seam adjustment layers above looped background
footage. It does not affect the text deck or watermark.

Plugin versions may expose different match names or property trees. Before
shipping a new adapter, inspect and log the installed effect hierarchy in a
small diagnostic comp, confirm every mapped control, and only then enable it
across the project. Do not silently ignore an unknown property: a visibly wrong
effect is harder to diagnose than a stopped build.

Use this adapter boundary for other plugins instead of putting plugin-specific
logic into the project entry point.
