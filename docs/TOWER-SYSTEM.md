# Towers and island scene progression — implementation record

## Source and ownership

- Repository: `LuminaryLabs-Publish/Islands-Of-Noar`, main branch.
- Model source: Luminary Assets / Floating Islands Vol. 1 / Staging / Attempt-003. Original GLB filenames and binary files preserved.
- Original Studio source: `project/drift-isles.nexus.json`, retained unchanged.
- Scope: Game-owned Tower Object and Tower Prefab Kits. **Not** an engine-core kit registration or native Studio-authored representation.
- New scenes and traversal are independent game-specific composition; only the active island GLB is resident in the browser renderer.

## Tower object contract

`createTowerObject({id,name,center,stepCount,rise,radius,stepAngle,palette,style,ornament,roof})` returns a declarative descriptor containing ordered solid architectural parts, jump ledges, collision landing surfaces, periodic checkpoints, a summit floor, and a portal location. Every variant shares the same movement envelope (gravity=20, jumpSpeed=9.4, moveSpeed=8.5). The maximum rise is bounded below verified theoretical jump height; adjacent horizontal gaps are checked. Instances can be reconstructed deterministically from data.

## Tower prefabs

1. Harbor Watch — coastal citadel.
2. Windward Belfry — needle and high spire.
3. Mossbound Sanctum — forest fortress.
4. Sunward Obelisk — desert needle.
5. Ember Citadel — red fortress.
6. Azure Archive — blue lantern citadel.
7. Duskspire — violet needle.
8. Frostward Keep — white fortress.
9. Aurora Monolith — luminous needle.
10. The Crown of Noar — final landmark.

## Scene progression

`createIslandScene(index)` returns one model reference, biome, tower instance, starting position, summonable summit portal, and `nextSceneId`. Scene indices 0–19 form a directed path with the last scene ending the journey. Re-entering/reloading a saved scene restores its island entry point. Scene changes dispose the old model's GPU buffers and load the next GLB.

## State boundary and interaction

- Game owns the active scene, player motion mode, checkpoint, current step, and save progress.
- Collision kit chooses the highest downward-contact platform; stage camera, HUD and renderer consume game state.
- Jumping remains possible without using free flight. `F` flight allows alternative traversal and route previews, and a summit portal triggers a cinematic skyway transfer.
- Only the summit portal advances progression; movement to the next scene is idempotent during transition.
- `N` resets progress, `R` respawns at a saved local checkpoint, and progress persists in browser storage.

## Evidence and limitations

The Node test suite checks every scene, 20 binary GLB headers, ten tower definitions, surface contacts, tower walls, route metrics and save corruption cases. A mocked-graphics browser test parses real GLB geometry and exercises scene 1→2 and scene 20 completion. This test does **not** certify GPU pixels, shader compilation, perceived visual quality or real-device performance. The existing NexusEngine Studio asset project is not yet connected to the new game-owned runtime scene model; authoring parity is pending. The simplified circular island collision proxy must be reviewed against the actual terrain surfaces before release.

## Guide routing

Luminary Framework Master → Master Guide Tracker → Nexus Engine Art Authoring Guide → Nexus Engine Visual Quality Guide → Luminary Sandbox Rendering & Validation. Publishing/price approval is separate. Never modify GitHub Actions without explicit approval.
