class CameraFollow extends pc.Script {
    initialize() {
        if (this.target === undefined) this.target = null;
        if (this.lerpSpeed === undefined) this.lerpSpeed = 5;
        if (this.offset === undefined) this.offset = new pc.Vec3(0, 2, 10);
    }

    update(dt) {
        if (!this.target) return;
        
        var targetPos = this.target.getPosition();
        var currentPos = this.entity.getPosition();
        
        var desiredPos = new pc.Vec3(
            targetPos.x + this.offset.x,
            targetPos.y + this.offset.y,
            this.offset.z
        );
        
        var newPos = new pc.Vec3().lerp(currentPos, desiredPos, this.lerpSpeed * dt);
        
        this.entity.setPosition(newPos);
    }
}
pc.registerScript(CameraFollow, 'cameraFollow');
