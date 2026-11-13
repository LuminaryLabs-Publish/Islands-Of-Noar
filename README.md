# Islands of Noar — The Ascension

Twenty floating islands, ten monumental tower variants, and one continuous journey through four sky biomes. Land on an island, follow its jumpable tower path to the summit, and use the skyway portal to continue to the next island. Flight is also available with `F`.

**Status:** HTML5 development preview (`0.3.0-preview.1`). This replaces the website root entry with the new preview. It does not claim final game art or independent GPU-rendering approval. The previous NexusEngine Studio scene and its standalone build are preserved for recovery.

## Run

Serve the repository root using a local static server (`npm run serve` or `python3 -m http.server 8080`). Open `http://localhost:8080/` in a WebGL2-capable browser. The HTML page loads `game/main.mjs`, which consumes the game-owned kits and loads one real GLB per island from `assets/floating-islands/`. No CDN, login, or install is required to play. It is not a server game.

**Controls:** WASD / arrows move; Space jumps; drag rotates camera; wheel zooms; F toggles free flight; Space rises and C descends in flight; E opens the skyway portal at a summit; R returns to a checkpoint; N begins again. Touch movement and controls are available.

## New game systems

| Source | Responsibility |
| --- | --- |
| `kits/tower-object-kit.mjs` | Renderer-neutral structural Tower object: architectural parts, guaranteed ascending ledges, checkpoint marks, summit, portal, geometry bounds and reachability rules |
| `kits/tower-prefab-kit.mjs` | Ten distinct data-driven tower presets, palettes, crowns and styles |
| `kits/island-scene-kit.mjs` | One ordered scene per real floating island GLB, with biome, tower and destination |
| `kits/island-progression-kit.mjs` | Authoritative landing, tower wall, summit detection, scene order, and save recovery rules |
| `game/webgl.mjs` | Browser WebGL2 presentation provider; reads actual glTF 2.0 binary geometry and material colors |
| `game/main.mjs` | Player controls, camera, fixed-step motion, UI, portal travel and persistence |

The 20 original GLBs were copied from the Luminary Assets **Floating Islands Vol. 1 / Staging / Attempt-003** set. Their original names and files are preserved. A simplified collision surface is currently used for each island's buildable top; physical mesh collision is not claimed.

## Packaging and validation

```bash
npm test
npm run build
```

`npm test` verifies prefab route invariants, all scene references, collider rules, progression and the existing 20 GLB headers. `npm run build` writes a standalone static package to `builds/noar/` with a SHA-256 file manifest. The build does not publish and does not edit GitHub Actions.

The browser's content/CPU gameplay path was tested using installed Chromium with an instrumented WebGL interface, including real GLB parsing, scene 1 → 2 transition, and final-scene completion. Actual GPU rendering could **not** be certified in the current sandbox because Chromium denied WebGL contexts. A real WebGL2 browser capture and independent visual approval remain outstanding.

## Studio/legacy boundary

The existing `project/drift-isles.nexus.json` remains the original NexusEngine Studio 0.7-era authored scene. `builds/web/index.html` remains the earlier NexusEngine rolling-platformer export. Those files have not been silently rewritten into the new scene format. **The new tower/island object kits are game-owned and are not yet registered as native NexusEngine Studio kits.** Studio import/export parity is a separate integration gate requiring the installed engine's supported authoring operations. The `legacy:build` script retains the previous pinned Engine build adapter; do not run it expecting the new Noar experience.

## Milestones before public product release

1. Validate real GPU rendering and visual quality in a WebGL2 browser.
2. Validate every model's ground height and surface collider in gameplay.
3. Add native NexusEngine Studio authoring/import parity and save/edit/export verification.
4. Perform sustained playthrough and hardware performance checks across all 20 scenes.
5. Obtain owner approval for release, licenses, visual art, and product claims.

See [`docs/TOWER-SYSTEM.md`](docs/TOWER-SYSTEM.md) for object and scene contracts.
