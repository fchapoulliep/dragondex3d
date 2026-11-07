# DragonDex 3D

A 3D character encyclopedia for the Dragon Ball universe, built with React, TypeScript and Three.js. Browse the characters as cards, then open any of them to explore an animated 3D model.

Live: https://fchapoulliep.github.io/dragondex3d/

## Features

- 106 characters, forms and outfits in a horizontal card carousel, with navigation arrows and keyboard control
- Search by name, case and accent insensitive
- Filter by series: Dragon Ball, Dragon Ball Z, Dragon Ball GT, Dragon Ball Super
- Tilt cards with a glare effect, styled after the character's series, with a Hero or Evil badge
- A page per character with its name, description, badge and a background matching its series
- Interactive 3D viewer: drag to orbit, scroll to zoom, auto-rotation, model scaled to fit the view, idle animation played on load
- Previous and next arrows to step through the characters
- A guide on the first visit: the page darkens around the centred card, then around the model on the first character page, and a dialogue box says to click the card, then to drag and zoom (remembered by the browser, once per dex)
- Dragon Radar loading animation and a navigation bar with a live clock on the character page

## Tech Stack

- React 18
- TypeScript 5.6
- Vite 6
- Three.js 0.171
- React Three Fiber 8 and Drei 9
- Swiper 11
- React Router 7 (`BrowserRouter`)
- react-parallax-tilt
- ESLint 9
- gh-pages

## Getting Started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Vite prints the local URL. The app is served under the `/dragondex3d/` base path, set in `vite.config.ts`.

Other scripts:

```bash
npm run build     # type-check with tsc, then build to dist/
npm run preview   # serve the production build locally
npm run lint      # run ESLint
```

### Deploy to GitHub Pages

```bash
npm run build
npm run deploy
```

`deploy` publishes the existing `dist/` folder to the `gh-pages` branch. It does not build first, so run `build` before it.

## Project Structure

```
public/
  models/<Name>/<Name>.glb     3D models, one folder per character
  sprites/<Name>.png           card images
  type_icons/                  Hero and Evil badge icons
  backgrounds/                 character page backgrounds, one per series
src/
  components/                  dex page, cards, character page and 3D viewer
  css/                         stylesheets
  data/dragoncharacters.json   character list (id, name, series, hero or evil, description)
  assets/                      logo, font, card art
```

## Notes

- A character's `name` in `src/data/dragoncharacters.json` is also the file name of its model and sprite. Adding a character means adding the JSON entry, `public/models/<Name>/<Name>.glb` and `public/sprites/<Name>.png`.
- The models are glTF binary files exported from Blender, loaded with Drei's `useGLTF`. They ship with the repository (about 56 MB).
- Characters live at real paths (`/dragondex3d/12`). GitHub Pages has no fallback for a single-page app, so the build (a small plugin in `vite.config.ts`) writes one HTML file per character, with its own title, description, share image and canonical URL, plus a `404.html` that loads the app on any other path and a `sitemap.xml` generated from the character data. Old `#/12` links are redirected.
- Fan project, not affiliated with or endorsed by the owners of Dragon Ball. Characters and related assets belong to their respective owners.
