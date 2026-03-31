var EnemyController = pc.createScript('enemyController');
EnemyController.attributes.add('speed', { type: 'number', default: 2 });
EnemyController.attributes.add('health', { type: 'number', default: 3 });
EnemyController.attributes.add('knockbackForce', { type: 'number', default: 5 });

EnemyController.prototype.initialize = function() {
    this.entity.tags.add('enemy');
    this.direction = -1; // -1 left, 1 right
    this.timer = 0;
    this.colorMat = this.entity.model.material;
    this.hurtTimer = 0;
    this.knockX = 0;
};

EnemyController.prototype.update = function(dt) {
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

    // Recover from knockback
    if (Math.abs(this.knockX) > 0.1) {
        this.knockX *= 0.8;
    } else {
        this.knockX = 0;
    }

    pos.x += ((this.direction * this.speed) + this.knockX) * dt;

    // Floor boundary roughly
    if (pos.y < 0.25) pos.y = 0.25;

    this.entity.setPosition(pos);
};

EnemyController.prototype.takeDamage = function(amount, attackerDirection) {
    this.health -= amount;
    this.colorMat.emissive = new pc.Color(1, 0, 0);
    this.colorMat.update();
    this.hurtTimer = 0.2;
    
    // Knockback
    this.knockX = attackerDirection * this.knockbackForce;
    
    if (this.health <= 0) {
        this.entity.destroy();
    }
};
