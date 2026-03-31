class PlayerController extends pc.ScriptType {
    initialize() {
        if (this.speed === undefined) this.speed = 8;
        if (this.jumpForce === undefined) this.jumpForce = 15;
        if (this.dashForce === undefined) this.dashForce = 20;
        if (this.attackDuration === undefined) this.attackDuration = 0.2;

        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
        
        this.health = 6;
        this.app.fire('player:health:update', this.health);
        this.invincibleTimer = 0;
        this.knockX = 0;
        this.isGrounded = false;
        this.direction = 1; // 1 for right, -1 for left
        this.isAttacking = false;
        this.attackTimer = 0;
        this.dashTimer = 0;
        this.velocityY = 0;
        
        // Save original material for flickering
        if (this.entity.model) {
            this.playerMat = this.entity.model.material;
        } else if (this.entity.render) {
            this.playerMat = this.entity.render.material;
        }
        
        var solidsFound = this.app.root.findByTag('solid');
        console.log("Player initialized. Collision solids found: " + solidsFound.length);
        
        // Create attack visual indicator material
        this.attackMat = new pc.StandardMaterial();
        this.attackMat.diffuse = new pc.Color(1, 1, 1);
        this.attackMat.emissive = new pc.Color(0.8, 0.8, 1.0);
        this.attackMat.opacity = 0.5;
        this.attackMat.blendType = pc.BLEND_NORMAL;
        this.attackMat.update();
    }

    update(dt) {
        var app = this.app;
        var pos = this.entity.getPosition();
        var forceX = 0;

        // Invincibility flicker
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            var isVisible = (Math.floor(this.invincibleTimer * 10) % 2 === 0);
            if (this.entity.model) this.entity.model.enabled = isVisible;
            if (this.entity.render) this.entity.render.enabled = isVisible;
            
            if (this.invincibleTimer <= 0) {
                if (this.entity.model) this.entity.model.enabled = true;
                if (this.entity.render) this.entity.render.enabled = true;
            }
        }

        // Knockback recovery
        if (Math.abs(this.knockX) > 0.1) {
            this.knockX -= Math.sign(this.knockX) * dt * 30;
        } else {
            this.knockX = 0;
        }

        // Movement
        if (this.dashTimer <= 0 && Math.abs(this.knockX) < 1) {
            if (app.keyboard.isPressed(pc.KEY_LEFT) || app.keyboard.isPressed(pc.KEY_A)) {
                forceX = -this.speed;
                this.direction = -1;
                this.entity.setLocalEulerAngles(0, -90, 0); 
            } else if (app.keyboard.isPressed(pc.KEY_RIGHT) || app.keyboard.isPressed(pc.KEY_D)) {
                forceX = this.speed;
                this.direction = 1;
                this.entity.setLocalEulerAngles(0, 90, 0);
            } else {
                this.entity.setLocalEulerAngles(0, this.direction === 1 ? 90 : -90, 0);
            }
        } else {
            if (this.dashTimer > 0) {
                forceX = this.direction * this.dashForce;
                this.dashTimer -= dt;
            } else {
                forceX = this.knockX;
            }
        }
        
        // Custom gravity
        this.velocityY -= 40 * dt;
        var moveX = forceX * dt;
        var moveY = this.velocityY * dt;
        
        var solids = this.app.root.findByTag('solid');
        var pHW = 0.4; // Player half width
        var pHH = 0.8; // Player half height
        
        // 1. Move X and resolve
        pos.x += moveX;
        for (var i = 0; i < solids.length; i++) {
            var ent = solids[i];
            var bounds = ent.customBounds;
            if (!bounds) {
                var s = ent.getLocalScale();
                var p = ent.getPosition();
                bounds = { x: p.x, y: p.y, hw: s.x / 2, hh: s.y / 2 };
            }
            
            if (Math.abs(pos.x - bounds.x) < (pHW + bounds.hw) && 
                Math.abs(pos.y - bounds.y) < (pHH + bounds.hh - 0.1)) {
                // Push back horizontally
                if (pos.x < bounds.x) pos.x = bounds.x - bounds.hw - pHW;
                else pos.x = bounds.x + bounds.hw + pHW;
            }
        }
        
        this.isGrounded = false;
        
        // 2. Move Y and resolve
        pos.y += moveY;
        for (var i = 0; i < solids.length; i++) {
            var ent = solids[i];
            var bounds = ent.customBounds;
            if (!bounds) {
                var s = ent.getLocalScale();
                var p = ent.getPosition();
                bounds = { x: p.x, y: p.y, hw: s.x / 2, hh: s.y / 2 };
            }
            
            if (Math.abs(pos.x - bounds.x) < (pHW + bounds.hw - 0.1) && 
                Math.abs(pos.y - bounds.y) < (pHH + bounds.hh)) {
                
                // Push back vertically
                if (pos.y > bounds.y) {
                    pos.y = bounds.y + bounds.hh + pHH;
                    this.velocityY = 0;
                    this.isGrounded = true;
                } else {
                    pos.y = bounds.y - bounds.hh - pHH;
                    this.velocityY = 0;
                }
            }
        }

        // Apply position
        this.entity.setPosition(pos);

        // Enemy Collision (Damage)
        if (this.invincibleTimer <= 0) {
            // Find all potential enemies
            var enemiesByName = this.app.root.findByName('enemy');
            var enemiesByTag = this.app.root.findByTag('enemy');
            
            // Combine and unique
            var enemies = [];
            if (enemiesByName instanceof Array) enemies = enemies.concat(enemiesByName);
            else if (enemiesByName) enemies.push(enemiesByName);
            enemies = enemies.concat(enemiesByTag);
            
            // Filter unique
            enemies = enemies.filter((v, i, a) => a.indexOf(v) === i);

            for (var i = 0; i < enemies.length; i++) {
                var enemy = enemies[i];
                if (enemy === this.entity) continue;
                
                var ePos = enemy.getPosition();
                var dx = Math.abs(pos.x - ePos.x);
                var dy = Math.abs(pos.y - ePos.y);
                
                // Debug log if very close
                if (dx < 2 && dy < 2) {
                    // console.log("Near enemy: dx=" + dx.toFixed(2) + " dy=" + dy.toFixed(2));
                }

                if (dx < (pHW + 0.5) && dy < (pHH + 0.5)) {
                    console.log("!!! HIT ENEMY !!! at " + ePos.x.toFixed(2) + ", " + ePos.y.toFixed(2));
                    this.takeDamage(1, pos.x < ePos.x ? -1 : 1);
                    break;
                }
            }
        }

        // State timers
        if (this.isAttacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        if (app.keyboard.wasPressed(pc.KEY_Z) || app.keyboard.wasPressed(pc.KEY_X)) {
            this.attack();
        }
        
        if (app.keyboard.wasPressed(pc.KEY_C) || app.keyboard.wasPressed(pc.KEY_SHIFT)) {
            this.dash();
        }
    }

    takeDamage(amount, knockDirection) {
        this.health -= amount; // amount is 1 = half heart
        this.app.fire('player:health:update', this.health);
        this.invincibleTimer = 1.0; // 1 second invincibility
        this.knockX = knockDirection * 15;
        this.velocityY = 10; // small pop upwards
        
        console.log("Player hit! Health remaining: " + this.health);
        
        if (this.health <= 0) {
            // Relocate for demo instead of full death logic
            this.health = 6;
            this.app.fire('player:health:update', this.health);
            this.entity.setPosition(-10, 5, 0);
        }
    }

    onKeyDown(event) {
        if ((event.key === pc.KEY_UP || event.key === pc.KEY_W || event.key === pc.KEY_SPACE) && this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
        }
    }

    dash() {
        if (this.dashTimer > 0) return;
        this.dashTimer = 0.2; 
        this.velocityY = 0;
    }

    attack() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        
        var app = this.app;
        var pPos = this.entity.getPosition();
        var hitCenter = new pc.Vec3(pPos.x + (this.direction * 1.5), pPos.y, pPos.z);
        
        var attackHitbox = new pc.Entity('attackHitbox');
        attackHitbox.addComponent('model', { type: 'box' });
        attackHitbox.model.material = this.attackMat;
        attackHitbox.setLocalScale(2.0, 1.5, 0.2);
        attackHitbox.setPosition(hitCenter);
        
        attackHitbox.addComponent('script');
        let hitboxScript = attackHitbox.script.create('attackHitbox');
        hitboxScript.lifetime = this.attackDuration;
        hitboxScript.direction = this.direction;
        hitboxScript.ownerId = this.entity.getGuid();

        app.root.addChild(attackHitbox);
    }
}
pc.registerScript(PlayerController, 'playerController');

// Editor Attributes for Migration
PlayerController.attributes.add('speed', { type: 'number', default: 8, title: 'Speed' });
PlayerController.attributes.add('jumpForce', { type: 'number', default: 15, title: 'Jump Force' });
PlayerController.attributes.add('dashForce', { type: 'number', default: 20, title: 'Dash Force' });
PlayerController.attributes.add('attackDuration', { type: 'number', default: 0.2, title: 'Slash Timer' });
