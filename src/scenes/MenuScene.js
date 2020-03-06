import "phaser";
import GameScene from "./GameScene";
import config from "../config/config";

export default class MenuScene extends Phaser.Scene {
    constructor () {
        super({key: 'Menu', active: false});
    }

    create() {
        
        let x = config.centerX;
        let y = config.centerY;
        const title = this.add.text(x, y - 50, 'V.P.P');
        const text = this.add.text(x, y + 50, "Start");
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
        this.scene.start('Game');
    }
}