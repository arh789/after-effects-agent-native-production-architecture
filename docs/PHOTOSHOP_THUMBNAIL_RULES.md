# Photoshop Thumbnail Rules

Start with an approved background PSD or image. The script adds generated text
and any local contrast scrim. It does not redesign the background.

Each run must:

- suppress dialogs;
- rebuild only the named generated layer group;
- export the next numbered PNG without overwriting history;
- save a matching editable PSD;
- append the build log;
- write a coordinate report containing intended specs and actual layer bounds;
- close its working copy without prompting.

Thumbnail text is not slide text. It should be short, tension-driven, and legible
at small scale. Put emphasis colour on the concrete payload. Use a scrim only
where the text needs protection. Inspect every export before changing the next
iteration, and convert useful manual corrections back into script parameters.

