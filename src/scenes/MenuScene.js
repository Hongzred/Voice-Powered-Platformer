import "phaser";
import GameScene from "./GameScene";
import config from "../config/config";
import LevelIntro from "./LevelIntro";
import skyImg from "../assets/sky.png";
import player from "../assets/car.png";
import menuMusic from "../assets/menu_music.mp3";
import vpp_logo from "../assets/vpp-logo.png";
export default class MenuScene extends Phaser.Scene {
    constructor () {
        super({key: 'Menu', active: false});
    }

    preload() {
        this.load.image("sky", skyImg);
        let vpp = this.load.image("vpp_logo", vpp_logo);
        this.load.image('player', player);
        let loadingBar = this.add.graphics({
            fillStyle: {
                color: 0xffffff //white
            }
        })
        this.load.on("progress", (percent) => {
            loadingBar.fillRect(0, this.game.renderer.height/2, this.game.renderer.width*percent, 50);
            // console.log(percent);
        })
        this.load.audio("menu_music", menuMusic);
        
    }
    create() {
        this.add.image(400, 300, 'sky');
        this.add.image(400, 200, 'vpp_logo').setDisplaySize(200,200);
        this.lights.enable();

        this.lights.addLight(300, 300, 300, 0xff0000, 1);
        this.lights.addLight(400, 300, 300, 0x00ff00, 1);
        this.lights.addLight(600, 500, 300, 0x0000ff, 1);
        this.sound.pauseOnBlur = false;
        this.sound.play("menu_music", {
            loop: true
        })
        let x = config.centerX;
        let y = config.centerY;
        const title = this.add.text(x - 15, y + 50, 'V.P.P', {
            fontSize: "32px",
          });
        const text = this.add.text(x - 15, y + 150, "Start", {
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
        this.scene.add(LevelIntro.LEVEL_NAME, LevelIntro)

        this.scene.stop();
        this.scene.start(LevelIntro.LEVEL_NAME, {});
    } 
}