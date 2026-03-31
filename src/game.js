class AttackHitbox extends pc.Script {
    initialize() {
        this.timer = 0;
        this.hitEnemies = []; 
    }

    update(dt) {
        this.hitEnemies = this.hitEnemies || [];
        this.timer += dt;
        if (this.timer > this.lifetime) {
            this.entity.destroy();
            return;
        }
        
        // Simple custom AABB vs AABB intersection for enemies
        var myPos = this.entity.getPosition();
        var enemies = this.app.root.findByName('enemy');
        
        // Hitbox half extents: 1.0, 0.75
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (this.hitEnemies.includes(enemy.getGuid())) continue;
            
            var ePos = enemy.getPosition();
            // Enemy half extents: 0.25 (since size is 0.5)
            
            var dx = Math.abs(myPos.x - ePos.x);
            var dy = Math.abs(myPos.y - ePos.y);
            
            if (dx < (1.0 + 0.25) && dy < (0.75 + 0.25)) {
                // Hit
                this.hitEnemies.push(enemy.getGuid());
                if (enemy.script && enemy.script.enemyController) {
                    enemy.script.enemyController.takeDamage(1, this.direction);
                }
                
                // Push player back slightly
                var player = this.app.root.findByGuid(this.ownerId);
                if (player && player.script && player.script.playerController) {
                    // simple recoil hack
                    player.script.playerController.dashTimer = 0.1;
                    player.script.playerController.direction = -this.direction;
                }
            }
        }
    }
}
pc.registerScript(AttackHitbox, 'attackHitbox');
AttackHitbox.attributes.add('lifetime', { type: 'number', default: 0.2 });
AttackHitbox.attributes.add('direction', { type: 'number', default: 1 });
AttackHitbox.attributes.add('ownerId', { type: 'string' });

// --- GAME INITIALIZATION --- //

function initializeGame() {
    const app = pc.app;
    if (!app) return;

    app.start();

    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    window.addEventListener('resize', () => app.resizeCanvas());

    initializeScene(app);

    function initializeScene(app) {
        // Atmospheric lighting
        const light = new pc.Entity('light');
        light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.8, 0.8, 1.0),
            castShadows: false, // Drop shadows for simplicity in raw webgl
            intensity: 0.6
        });
        light.setEulerAngles(45, 10, 0);
        app.root.addChild(light);
        
        const ambientLight = new pc.Entity('ambient');
        ambientLight.addComponent('light', {
            type: 'ambient',
            color: new pc.Color(0.2, 0.2, 0.3)
        });
        app.root.addChild(ambientLight);

        // Camera
        const camera = new pc.Entity('camera');
        camera.addComponent('camera', {
            clearColor: new pc.Color(0.05, 0.05, 0.08),
            projection: pc.PROJECTION_PERSPECTIVE
        });
        camera.addComponent('script');
        camera.script.create('cameraFollow', {
            attributes: {
                offset: new pc.Vec3(0, 3, 14),
                lerpSpeed: 6
            }
        });
        app.root.addChild(camera);

        // Materials setup
        const playerMat = new pc.StandardMaterial();
        playerMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        playerMat.emissive = new pc.Color(0.8, 0.8, 1.0); 
        playerMat.update();

        const groundMat = new pc.StandardMaterial();
        groundMat.diffuse = new pc.Color(0.1, 0.1, 0.15);
        groundMat.update();
        
        const platMat = new pc.StandardMaterial();
        platMat.diffuse = new pc.Color(0.2, 0.2, 0.25);
        platMat.update();

        const enemyMat = new pc.StandardMaterial();
        enemyMat.diffuse = new pc.Color(0.8, 0.4, 0.0);
        enemyMat.emissive = new pc.Color(0.2, 0.0, 0.0);
        enemyMat.update();

        function createBox(name, x, y, hw, hh, hz, mat, isSolid = true) {
            const ent = new pc.Entity(name);
            ent.addComponent('model', { type: 'box' });
            ent.model.material = mat;
            ent.setLocalScale(hw * 2, hh * 2, hz * 2);
            ent.setPosition(x, y, 0);
            if (isSolid) {
                ent.tags.add('solid');
                // Store properties manually for our custom physics logic
                ent.customBounds = { x: x, y: y, hw: hw, hh: hh };
            }
            return ent;
        }

        // Build simple floor 
        app.root.addChild(createBox('ground', 0, -2, 40, 2, 2, groundMat));
        
        // Left wall
        let wallL = createBox('wallLeft', -18, 5, 2, 10, 2, groundMat);
        app.root.addChild(wallL);
        
        // Right wall
        let wallR = createBox('wallRight', 18, 5, 2, 10, 2, groundMat);
        app.root.addChild(wallR);

        // Platforms
        app.root.addChild(createBox('plat1', 5, 1, 3, 0.5, 2, platMat));
        app.root.addChild(createBox('plat2', -4, 3, 4, 0.5, 2, platMat));
        app.root.addChild(createBox('plat3', 8, 4, 3, 0.5, 2, platMat));

        // Player Setup
        const player = new pc.Entity('player');
        player.addComponent('model', { type: 'capsule' });
        player.model.material = playerMat;
        player.setLocalScale(0.8, 0.8, 0.8);
        
        player.addComponent('script');
        player.script.create('playerController');
        player.setPosition(-10, 0.8, 0); // Start left
        app.root.addChild(player);
        
        camera.script.cameraFollow.target = player;

        // Enemies
        function createEnemyInstance(x, y) {
            const enemy = createBox('enemy', x, y, 0.5, 0.5, 0.5, enemyMat, false);
            enemy.addComponent('script');
            enemy.script.create('enemyController', {
                attributes: {
                    speed: 3
                }
            });
            app.root.addChild(enemy);
        }

        createEnemyInstance(-4, 0.25);
        createEnemyInstance(5, 5.25);
        createEnemyInstance(12, 0.25);
        
        for (let i = 0; i < 5; i++) {
            let column = new pc.Entity('bgColumn');
            column.addComponent('model', { type: 'box' });
            let colMat = new pc.StandardMaterial();
            colMat.diffuse = new pc.Color(0.05, 0.05, 0.08);
            colMat.update();
            column.model.material = colMat;
            column.setLocalScale(2, 20, 2);
            column.setPosition(-15 + (i * 8), 5, -8); 
            app.root.addChild(column);
        }
        
        createControlsHint();
    }
}

function createControlsHint() {
    let div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '10px';
    div.style.left = '10px';
    div.style.zIndex = '999';
    div.style.color = 'white';
    div.style.fontFamily = 'monospace';
    div.style.pointerEvents = 'none'; 
    div.innerHTML = `
        <h3>Hollow Knight Clone Demo</h3>
        <p>A/D or Left/Right: Move</p>
        <p>W or Up or Space: Jump</p>
        <p>Z or X: Attack</p>
        <p>C or Shift: Dash</p>
    `;
    document.body.appendChild(div);
}

window.onload = function() {
    initializeGame();
};
