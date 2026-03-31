class CameraFollow extends pc.Script {
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
CameraFollow.attributes.add('target', { type: 'entity', title: 'Target' });
CameraFollow.attributes.add('lerpSpeed', { type: 'number', default: 5, title: 'Speed' });
CameraFollow.attributes.add('offset', { type: 'vec3', default: [0, 2, 10], title: 'Offset' });
