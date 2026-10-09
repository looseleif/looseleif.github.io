# Chase Anderson portfolio

Static personal website published at https://looseleif.github.io/ through GitHub Pages.

## Pages

- `index.html`: automatic three-image feature, project directory, and links to community stories and other pages.
- `projects.html`: project previews with curated three-view compositions and continuous demonstrations.
- `project-*.html`: project descriptions, recordings, and additional photographs.
- `volunteering.html`: illustrated stories from Maker Faire, Open Sauce, and IEEE, with a brief entry for new Fixit Clinic volunteering.
- `about.html`: background, printable resume, education, and volunteering.
- `socials.html`: contact profiles.
- `socio/index.html`: remorse, the Socio product, shown through real IYKYD field recordings.

## Local preview

Run `python -m http.server 8765` from this directory and open http://127.0.0.1:8765/.
No build step or package installation is required.

## Media and motion

`media-data.js` holds project media and captions. `focused-photos.js` provides curated source images; `focused-media.js` selects three complementary views for each visual showcase. Robot, simulation, search-environment, and biology-device demonstrations play as muted inline MP4s in their respective tiles without a click, including in the expanded view. There are no play buttons, timelines, speed selectors, or native player controls. GIFs that contain photo sequences are presented as complementary stills, with the original sequences retained on project pages.

The index feature rotates every 7.5 seconds, with previous/next and pause/resume controls. Its three images use their native proportions without cropping, with a compact row on desktop and one lead image above two supporting views on mobile. The text types in as each slide appears. The feature pauses when a project link has keyboard focus, the feature is offscreen, or the page is hidden. A thin progress line shows time until the next project. Volunteering stories pair photographs with the relevant narrative; image links open the shared gallery.

`clip-playlist.js` advances automatically through recordings. `clip-player.js` handles automatic playback and scene captions from `media-semantics.js`. Expanded media uses `gallery.js` without player controls. Hidden recordings pause, and closing the gallery resumes background media. `motion-settings.js` centralizes playback speed: `speed` is currently 1.25 (25% faster than the prior rates) and scales all clips, and `overrides` sets individual source rates. Adjust these in response to chat feedback. A rejected or unsupported video automatically falls back to its original animated GIF at the source GIF timing.

Original photos and GIFs are preserved. GIF-derived MP4 clips and extracted source frames are used for browser playback and image previews. Frame captions describe visible content and do not establish ownership of other exhibitors' work. Open Sauce and Maker Faire entries describe Chase's Sync Tank demonstrations and use Sync Tank project images, without attributing unverified event dates.

Only the About portrait is monochrome. Project images retain their color. Reduced-motion preferences remove sliding transitions. Project demonstrations retain the explicitly requested automatic playback.

`project-background.js` places each case study's main recording behind its content with a dark readability layer. These backgrounds use the shared playback speed and pause while a gallery is open or the document is hidden. Projects without footage use their own photographs.

The remorse showcase uses four short, silent excerpts from Chase's IYKYD recordings. `socio/field-notes.json` records source videos and exact excerpt offsets; `socio/source-notes.md` documents transcript evidence. The excerpts play at their recorded pace (base rate 0.8 times the global 1.25 speed). Full recordings remain linked on YouTube.

## Publishing

GitHub Pages publishes the root of `main`. `.nojekyll` marks this as a static site. Changes should be checked for local links, missing assets, mobile overflow, playback, and automatic rotation before pushing to `main`.

Electric Drives & Control combines the rover and electric drive builds in `project-electric-drives.html`. Old rover, mountain board, and remorse URLs redirect to the consolidated projects.
