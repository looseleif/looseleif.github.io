# Chase Anderson portfolio

Static personal website published at https://looseleif.github.io/ through GitHub Pages.

## Pages

- `index.html`: automatic project showcase and compact project directory.
- `projects.html`: individual project previews with cycling photos.
- `project-*.html`: project descriptions, recordings, and additional photographs.
- `about.html`: background, printable resume, volunteering, and leadership.
- `socials.html`: contact profiles.
- `socio/index.html`: Socio, its conversation software prototype, and IYKYD development documentation.

## Local preview

Run `python -m http.server 8765` from this directory and open http://127.0.0.1:8765/.
No build step or package installation is required.

## Media and motion

`media-data.js` holds project media and captions. `focused-photos.js` provides the curated image sequences. Project and photo updates use independent randomized 2-4 second intervals; `terminal-text.js` completes each text reveal in one second. The current showcase is highlighted in the project directory.

`clip-playlist.js` displays one recording at a time. `clip-player.js` supports playback, speed changes, scrubbing, and captions from `media-semantics.js`. Expanded media uses `gallery.js`. Hidden recordings pause, and gallery viewing suspends background media.

Original photos and GIFs are preserved. GIF-derived MP4 clips and extracted source frames are used for browser playback and image previews. Frame captions describe visible content and do not establish ownership of other exhibitors' work. Open Sauce and Maker Faire entries describe Chase's Sync Tank demonstrations and use Sync Tank project images, without attributing unverified event dates.

Only the About portrait is monochrome. Project images retain their color. Reduced-motion preferences remove sliding transitions while keeping explicitly requested timed image/text updates; videos respect reduced-motion preferences.

## Publishing

GitHub Pages publishes the root of `main`. `.nojekyll` marks this as a static site. Changes should be checked for local links, missing assets, mobile overflow, playback, and automatic rotation before pushing to `main`.

Electric Drives & Control combines the rover and electric drive builds in `project-electric-drives.html`. Old rover, mountain board, and remorse URLs redirect to the consolidated projects.
