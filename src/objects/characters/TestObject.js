import "phaser";

class ActionQueue extends Phaser.Physics.Arcade.Group {

    scene;
    testObject;
    actionQueue;
    texture;
    depth;

    constructor(
        world, 
        scene,
        testObject,
        depth,
        leftTexture, rightTexture, downTexture, upTexture)
    {
        super(world, scene);
        this.scene = scene;
        this.testObject = testObject;
        this.actionQueue = new Phaser.Structs.List(scene);
        this.texture = {leftTexture, rightTexture, downTexture, upTexture};
        this.depth = depth;

        testObject.addListener(TestObject.Events.ACTION_ENQUEUED, this.handleActionEnqueuedEvent, this);
        testObject.addListener(TestObject.Events.ACTION_DEQUEUED, this.handleActionDequeuedEvent, this);
        testObject.addListener(TestObject.Events.STATE_IDLE, this.handleStateIdleEvent, this);
    }

    handleActionEnqueuedEvent(enqueuedAction)
    {
        let textureKey = undefined;
        switch(enqueuedAction)
        {
            case TestObject.Actions.GO_LEFT:
                textureKey = this.texture.leftTexture; break;
            case TestObject.Actions.GO_RIGHT:
                textureKey = this.texture.rightTexture; break;
            case TestObject.Actions.GO_UP:
                textureKey = this.texture.upTexture; break;
            case TestObject.Actions.GO_DOWN:
                textureKey = this.texture.downTexture; break;
        }
        let arrowSprite = new Phaser.Physics.Arcade.Sprite(
            this.scene,
            50 + this.children.size * 50,
            50,
            textureKey);
        arrowSprite
            .setScrollFactor(0, 0)
            .setAlpha(0.6)
            .setDepth(this.depth)
        this.actionQueue.add(arrowSprite);
        this.add(arrowSprite, true);      
    }

    handleActionDequeuedEvent(dequeuedAction)
    {
        this.actionQueue.each((action, actionQueue) => {
            if (actionQueue.length > 1)
            {
                action.setX(action.x - 50);
            }
        }, null, this.actionQueue);

        if (this.actionQueue.length > 1) 
        {
            this.remove(this.actionQueue.removeAt(0), true, true);
        }

        this.actionQueue
            .first
            .setTintFill(0x00ff000)
            .setAlpha(1);
        this.scene.add.tween({
            targets: this.actionQueue.first,
            alpha: 0,
            duration: 250,
            repeat: -1,
            yoyo: true
        })
    }

    handleStateIdleEvent()
    {
        if (this.actionQueue.length === 1)
        {
            this.remove(this.actionQueue.removeAt(0), true, true);
        }
    }

}

export default class TestObject extends Phaser.Physics.Arcade.Sprite {

    static ActionQueue =  ActionQueue;
    static Actions = {
        GO_LEFT: 'GO_LEFT',
        GO_RIGHT: 'GO_RIGHT',
        GO_UP: 'GO_UP',
        GO_DOWN: 'GO_DOWN',
    };
    static Events = {
        ACTION_ENQUEUED: 'ACTION_ENQUEUED',
        ACTION_DEQUEUED: 'ACTION_DEQUEUED',
        STATE_IDLE: 'STATE_IDLE'
    };

    action;   //  Stores action properties and methods
    scene;

    SPEED = 75;

    constructor(scene, x, y, texture) 
    {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setupAction();
    }

    preUpdate()
    {
        //  Called before Scene.update() is called
        this.action.executeNext();
    }

    setupAction()
    {
        let self = this;
        this.action = {
            queue: [],
            go: {
                right() {
                    self.setVelocityX(self.SPEED);
                    self.setVelocityY(0);
                    self.setAngle(0);
                },
                left() {
                    self.setVelocityX(-1 * self.SPEED);
                    self.setVelocityY(0);
                    self.setAngle(180);
                },
                down() {
                    self.setVelocityY(self.SPEED);
                    self.setVelocityX(0);
                    self.setAngle(90);
                },
                up() {
                    self.setVelocityY(-1 * self.SPEED);
                    self.setVelocityX(0);
                    self.setAngle(270);
                }
            },
            enqueue(action) {
                //  Assumes action is one of TestObject.Actions
                if (this.queue.length === 0 
                    ||  this.queue[this.queue.length - 1] !== action) {
                        this.queue.push(action);
                        self.emit(TestObject.Events.ACTION_ENQUEUED, action);
                    } 
            },
            executeNext() {
                if (this.queue.length > 0 
                    && self.body.velocity.x === 0
                    && self.body.velocity.y === 0)
                {
                    let nextAction = this.queue.shift();
                    switch(nextAction)
                    {
                        case TestObject.Actions.GO_LEFT:
                            this.go.left();
                            break;
                        case TestObject.Actions.GO_RIGHT:
                            this.go.right();
                            break;
                        case TestObject.Actions.GO_UP:
                            this.go.up();
                            break;
                        case TestObject.Actions.GO_DOWN:
                            this.go.down();
                            break;
                    }
                    self.emit(TestObject.Events.ACTION_DEQUEUED, nextAction);
                }
                
                if (this.queue.length === 0 
                    && self.body.velocity.x === 0
                    && self.body.velocity.y === 0)
                {
                    self.emit(TestObject.Events.STATE_IDLE);
                }
            },
            getActionQueue() {
                return [...this.queue];
            }
        }
    }

};

