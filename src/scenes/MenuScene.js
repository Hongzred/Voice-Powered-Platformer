import "phaser";
import GameScene from "./GameScene";
import config from "../config/config";
import MapNavScene from "./MapNavScene";

export default class MenuScene extends Phaser.Scene {
    constructor () {
        super({key: 'Menu', active: false});
    }

    create() {

        let x = config.centerX;
        let y = config.centerY;
        const title = this.add.text(x, y - 50, 'V.P.P', {
            fontSize: "32px",
          });
        const text = this.add.text(x, y + 50, "Start", {
            fontSize: "32px",
          });
        this.createMouseInput();
        this.createKeyboardInput();
    }

    createMouseInput() {
        this.input.on('pointerup', this.goPlay, this);
    }

    createKeyboardInput() {
        function handleKeyUp(e) {
            switch (e.code) {
                case 'Enter':
                    this.goPlay();
                    break;
            }
        }

        this.input.keyboard.on('keyup', handleKeyUp, this);
    }

    goPlay() {
        this.scene.add('Game', GameScene);
        this.scene.add('MapNav', MapNavScene);
        // this.scene.start('Game');
        this.scene.start('MapNav');
    } 
}