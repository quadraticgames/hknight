# PlayCanvas Editor Migration Guide

Moving this standalone project into the PlayCanvas Editor is a straightforward process since we used modern ES6 script classes. Follow these steps to get your Hollow Knight prototype running in the PlayCanvas cloud.

## 1. Upload Scripts
1. Log in to [PlayCanvas.com](https://playcanvas.com) and create a new project.
2. Open the **Assets** panel.
3. Drag and drop all files from your local `src/` folder into the Assets panel.
4. Select each script in the Assets panel and ensure the engine recognizes them by clicking the **Parse** button in the Inspector (if not done automatically).

## 2. Set Up the Scene
Recreate the hierarchy from `game.js` visually in the Editor:

### The Camera
1. Create a new **Camera** entity.
2. Add a **Script** component.
3. Add the `cameraFollow` script.
4. **How to assign Target:** In the Inspector panel for the Camera entity, you will see a field named **Target**. Simply **drag the Player entity** from the Hierarchy pane directly into that empty slot. It will then automatically track the player in-game.


### The Player
1. Create a **Capsule** entity.
2. Add a **Script** component.
3. Add the `playerController` script.
4. (Optional) Set the **Speed**, **Jump Force**, and **Dash Force** values in the script attributes panel.

### The World (Solid Objects)
1. Create **Box** entities for your ground and platforms.
2. **CRITICAL:** Add the tag `solid` to all these entities in the **Tags** field at the top of the Inspector.
3. Our manual physics system uses these tags to calculate collisions!

### Enemies
1. Create **Box** entities for your enemies.
2. Add the tag `enemy` to these entities.
3. Add a **Script** component and attach the `enemyController`.

## 3. The HUD and Logic
Since `game.js` was our manual "entry point," you can migrate its specific logic:
1. **Lighting:** Create a Directional Light and an Ambient Light in the editor, matching the colors from `game.js`.
2. **HUD:** Create a new script called `uiManager.js` and move the `createHUD()` function from `game.js` into its `initialize()` method. Attach this script to a root-level entity.

## 4. Physics Check
In the Editor version, you have the option to use the built-in **Ammo.js (Physics)** component instead of our manual AABB system. 
- **If you stay manual:** Keep using the `solid` tag.
- **If you switch to Ammo.js:** You will need to replace the collision resolution logic in `PlayerController.update` with `entity.collision.on('contact', ...)` events.

## 5. Metadata (AABB Bounds)
In the editor, we don't need `customBounds` because PlayCanvas can read the entity's scale directly. You can update the `solids` loop to read:
```javascript
var scale = solids[i].getLocalScale();
var bounds = { hw: scale.x / 2, hh: scale.y / 2 };
```
instead of relying on the manual `customBounds` object we injected in `game.js`.
