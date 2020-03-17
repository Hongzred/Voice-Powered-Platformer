import "phaser";

export default class TestObject extends Phaser.Physics.Arcade.Sprite {

    action;   //  Stores action properties and methods

    SPEED = 75;

    constructor(parentScene, x, y, texture) 
    {
        super(parentScene, x, y, texture);
        this.setupAction();
    }

    preUpdate()
    {
        //  Called before Scene.update() is called
    }

    setupAction()
    {
        let self = this;
        this.action = {
            go: {
                right(time, delta) {
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
            }

        }
    }

}