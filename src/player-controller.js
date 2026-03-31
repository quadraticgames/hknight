class PlayerController extends pc.Script {
    initialize() {
        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
        
        this.isGrounded = false;
        this.direction = 1; // 1 for right, -1 for left
        this.isAttacking = false;
        this.attackTimer = 0;
        this.dashTimer = 0;
        this.velocityY = 0;
        
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

        // Movement
        if (this.dashTimer <= 0) {
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
            forceX = this.direction * this.dashForce;
            this.dashTimer -= dt;
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
            var bounds = solids[i].customBounds;
            if (!bounds) continue;
            
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
            var bounds = solids[i].customBounds;
            if (!bounds) continue;
            
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

        // Apply exact position
        this.entity.setPosition(pos);

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
        attackHitbox.script.create('attackHitbox', {
            attributes: {
                lifetime: this.attackDuration,
                direction: this.direction,
                ownerId: this.entity.getGuid()
            }
        });

        app.root.addChild(attackHitbox);
    }
}
pc.registerScript(PlayerController, 'playerController');
PlayerController.attributes.add('speed', { type: 'number', default: 8 });
PlayerController.attributes.add('jumpForce', { type: 'number', default: 15 });
PlayerController.attributes.add('dashForce', { type: 'number', default: 20 });
PlayerController.attributes.add('attackDuration', { type: 'number', default: 0.2 });
