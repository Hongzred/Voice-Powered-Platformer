import "phaser";
import logoImg from "../assets/logo.png";
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("logo", logoImg);
  }

  create() {
    const logo = this.add.image(400, 150, "logo");
    const text = this.add.text(0, 0, "text");
    this.tweens.add(
      {
        targets: logo,
        y: 450,
        duration: 2000,
        ease: "Power2",
        yoyo: true,
        loop: -1
      },
      {
        targets: text,
      }
    );
  }
}
