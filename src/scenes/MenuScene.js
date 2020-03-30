import "phaser";
import GameScene from "./GameScene";
import config from "../config/config";
import LevelIntro from "./LevelIntro";
import skyImg from "../assets/sky.png";
import player from "../assets/car.png";

export default class MenuScene extends Phaser.Scene {
    constructor () {
        super({key: 'Menu', active: false});
    }

    preload() {
        this.load.image("sky", skyImg);
        this.load.image('player', player);
    }
    create() {
        this.add.image(400, 300, 'sky');
        this.lights.enable();

        this.lights.addLight(300, 300, 300, 0xff0000, 1);
        this.lights.addLight(400, 300, 300, 0x00ff00, 1);
        this.lights.addLight(600, 500, 300, 0x0000ff, 1);

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
        
        annyang.start();
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
        this.scene.add(LevelIntro.LEVEL_NAME, LevelIntro)

        annyang.pause();

        this.scene.stop();
        this.scene.start(LevelIntro.LEVEL_NAME, {
            annyang: annyang
        });
    } 
}