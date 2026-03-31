class MovingPlatform extends pc.ScriptType {
    initialize() {
        // These will show up in the PlayCanvas Editor Inspector
        if (this.speed === undefined) this.speed = 2;
        if (this.distance === undefined) this.distance = 5;
        if (this.isHorizontal === undefined) this.isHorizontal = false;

        this.startPos = this.entity.getPosition().clone();
        this.timer = 0;
    }

    update(dt) {
        this.timer += dt;
        
        let pos = this.entity.getPosition();
        let offset = Math.sin(this.timer * this.speed) * this.distance;

        if (this.isHorizontal) {
            this.entity.setPosition(this.startPos.x + offset, this.startPos.y, this.startPos.z);
        } else {
            this.entity.setPosition(this.startPos.x, this.startPos.y + offset, this.startPos.z);
        }
    }
}

pc.registerScript(MovingPlatform, 'movingPlatform');

// Inspector Attributes
MovingPlatform.attributes.add('speed', { 
    type: 'number', 
    default: 2, 
    title: 'Movement Speed',
    description: 'How fast the platform oscillates'
});

MovingPlatform.attributes.add('distance', { 
    type: 'number', 
    default: 5, 
    title: 'Travel Distance',
    description: 'How far the platform travel from its center'
});

MovingPlatform.attributes.add('isHorizontal', { 
    type: 'boolean', 
    default: false, 
    title: 'Horizontal Move',
    description: 'If checked, moves left/right instead of up/down'
});
