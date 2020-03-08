import Phaser from "phaser";
import config from "./config/config";
import GameScene from "./scenes/GameScene";
import MenuScene from "./scenes/MenuScene";
import MapNavScene from "./scenes/MapNavScene";

class Game extends Phaser.Game {
  constructor() {
    super(config);
    // this.scene.add("Game", GameScene);
    this.scene.add("Menu", MenuScene);

    this.scene.start("Menu");
    this.handleClick();
  }

  handleClick() {
    const startButton = document.getElementById("start__button");
    startButton.addEventListener("click", this.startButton);
  }

  startButton(event) {
    // event.preventDefault();
    console.log(`event added`);
    navigator.permissions.query({ name: "microphone" }).then(result => {
      console.log(result);
      if (annyang) {
        console.log("READY");
      }

      let commands = {
        "run *dir": dir => {
          let div = document.createElement("div");
          div.appendChild(document.createTextNode(`RUNNING ${dir}`));
          document.getElementById("display").appendChild(div);
        },
        "jump *dir": dir => {
          let div = document.createElement("div");
          div.appendChild(document.createTextNode(`JUMPING ${dir}`));
          document.getElementById("display").appendChild(div);
        },
        jump: () => {
          let div = document.createElement("div");
          div.appendChild(document.createTextNode(`JUMPED`));
          document.getElementById("display").appendChild(div);
        }
      };
      annyang.addCommands(commands);

      annyang.start();
    });
  }
}

window.onload = function() {
  window.game = new Game();
};
