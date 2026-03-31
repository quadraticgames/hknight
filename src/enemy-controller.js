class EnemyController extends pc.ScriptType {
    initialize() {
        if (this.speed === undefined) this.speed = 2;
        if (this.health === undefined) this.health = 3;
        if (this.knockbackForce === undefined) this.knockbackForce = 5;
        this.entity.tags.add('enemy');
        this.direction = -1; // -1 left, 1 right
        this.timer = 0;
        this.colorMat = this.entity.model.material;
        this.hurtTimer = 0;
        this.knockX = 0;
        this.velocityY = 0;
    }

    update(dt) {
        if (this.hurtTimer > 0) {
            this.hurtTimer -= dt;
            if (this.hurtTimer <= 0) {
                this.colorMat.emissive = new pc.Color(0.2, 0.0, 0.0);
                this.colorMat.update();
            }
        }
        
        this.timer += dt;
        if (this.timer > 2) {
            this.direction *= -1; 
            this.timer = 0;
        }
        
        var pos = this.entity.getPosition();

        if (Math.abs(this.knockX) > 0.1) {
            this.knockX -= Math.sign(this.knockX) * dt * 20;
            if (Math.abs(this.knockX) < 1) this.knockX = 0;
        }

        var moveX = ((this.direction * this.speed) + this.knockX) * dt;
        this.velocityY -= 40 * dt;
        var moveY = this.velocityY * dt;
        
        var solids = this.app.root.findByTag('solid');
        var eHW = 0.5; // Enemy half width (from scale 1.0)
        var eHH = 0.5; // Enemy half height (from scale 1.0)
        
        // Resolve X
        pos.x += moveX;
        for (var i = 0; i < solids.length; i++) {
            var ent = solids[i];
            var bounds = ent.customBounds;
            if (!bounds) {
                var s = ent.getLocalScale();
                var p = ent.getPosition();
                bounds = { x: p.x, y: p.y, hw: s.x / 2, hh: s.y / 2 };
            }
            if (Math.abs(pos.x - bounds.x) < (eHW + bounds.hw) && 
                Math.abs(pos.y - bounds.y) < (eHH + bounds.hh - 0.1)) {
                // Turn around instantly if we hit a wall
                this.direction *= -1;
                if (pos.x < bounds.x) pos.x = bounds.x - bounds.hw - eHW;
                else pos.x = bounds.x + bounds.hw + eHW;
            }
        }
        
        // Resolve Y
        pos.y += moveY;
        for (var i = 0; i < solids.length; i++) {
            var ent = solids[i];
            var bounds = ent.customBounds;
            if (!bounds) {
                var s = ent.getLocalScale();
                var p = ent.getPosition();
                bounds = { x: p.x, y: p.y, hw: s.x / 2, hh: s.y / 2 };
            }
            if (Math.abs(pos.x - bounds.x) < (eHW + bounds.hw - 0.1) && 
                Math.abs(pos.y - bounds.y) < (eHH + bounds.hh)) {
                if (pos.y > bounds.y) {
                    pos.y = bounds.y + bounds.hh + eHH;
                    this.velocityY = 0;
                } else {
                    pos.y = bounds.y - bounds.hh - eHH;
                    this.velocityY = 0;
                }
            }
        }

        this.entity.setPosition(pos);
    }

    takeDamage(amount, attackerDirection) {
        this.health -= amount;
        this.colorMat.emissive = new pc.Color(1, 0, 0);
        this.colorMat.update();
        this.hurtTimer = 0.2;
        
        // Knockback
        this.knockX = attackerDirection * this.knockbackForce;
        
        if (this.health <= 0) {
            this.entity.destroy();
        }
    }
}
pc.registerScript(EnemyController, 'enemyController');

// Editor Attributes for Migration (Safe for standalone)
if (EnemyController.attributes) {
    EnemyController.attributes.add('speed', { type: 'number', default: 2, title: 'Patrol Speed' });
    EnemyController.attributes.add('health', { type: 'number', default: 3, title: 'Enemy HP' });
    EnemyController.attributes.add('knockbackForce', { type: 'number', default: 5, title: 'Hurt Force' });
}
