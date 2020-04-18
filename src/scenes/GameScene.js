import "phaser";
import logoImg from "../assets/logo.png";
import skyImg from "../assets/sky.png";
import groundImg from "../assets/platform.png";
import starImg from "../assets/star.png";
import bombImg from "../assets/bomb.png";
import dudeImg from "../assets/dude.png";
export default class GameScene extends Phaser.Scene {
  player;
  stars;
  bombs;
  platforms;
  cursors;
  score = 0;
  gameOver = false;
  scoreText;
  keyboard = {
    left: { isDown: false, isUp: true },
    right: { isDown: false, isUp: true },
    up: { isDown: false, isUp: true }
  };

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("logo", logoImg);
    this.load.image("sky", skyImg);
    this.load.image("ground", groundImg);
    this.load.image("star", starImg);
    this.load.image("bomb", bombImg);
    this.load.spritesheet("dude", dudeImg, {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {
    // const logo = this.add.image(400, 150, "logo");
    // const text = this.add.text(0, 0, "text");
    // this.tweens.add(
    //   {
    //     targets: logo,
    //     y: 450,
    //     duration: 2000,
    //     ease: "Power2",
    //     yoyo: true,
    //     loop: -1
    //   },
    //   {
    //     targets: text,
    //   }
    // );
    //  A simple background for our game

    navigator.permissions.query({ name: "microphone" }).then(result => {
      // console.log(result);
      if (annyang) {
        // console.log("READY");
      }

      let commands = {
        "*command": command => {
          // console.log(`Command: ${command}`);
          // let div = document.createElement('div');
          //     div.appendChild(document.createTextNode(`${command}`));
          //     document
          //       .getElementById('display')
          //       .appendChild(div);
          switch (command.charAt(0)) {
            case "l":
            case "b":
              this.handleLeft();
              break;
            case "r":
            case "g":
              this.handleRight();
              break;
            case "j":
            case "u":
              this.handleJump();
              break;
          }
        }
      };

      annyang.addCommands(commands);

      annyang.start();
    });
    
    this.add.image(400, 300, "sky");

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms
      .create(400, 568, "ground")
      .setScale(2)
      .refreshBody();

    //  Now let's create some ledges
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // The player and its settings
    this.player = this.physics.add.sprite(100, 450, "dude");

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    this.stars.children.iterate(function(child) {
      //  Give each star a slightly different bounce
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000"
    });

    this.backText = this.add.text(300, 16, "Back", {
      fontSize: "32px",
      fill: "#000"
    });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );
  }

  update() {
    

    if (this.gameOver) {
      return;
    }
    // console.log(
    //   `left: ${this.keyboard.left.isDown} right: ${this.keyboard.right.isDown}`
    // );

    if (this.keyboard.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.keyboard.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else if (this.keyboard.up.isDown) {
      this.player.setVelocity(-330);
      setTimeout(() => {
        this.keyboard.up.isDown = false;
      }, 0);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    //reset when keyboard pressed
    if (
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.left.isDown ||
      this.cursors.right.isDown
    ) {
      this.keyboard = {
        left: { isDown: false, isUp: true },
        right: { isDown: false, isUp: true },
        up: { isDown: false, isUp: true }
      };
    }

    if (
      this.cursors.up.isDown &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-330);
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    }

    if (
      this.cursors.up.isDown &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-330);
    }
  }

  handleLeft() {
    this.keyboard.right.isDown = false;
    this.keyboard.right.isUp = true;
    this.keyboard.left.isDown = true;
    this.keyboard.left.isUp = false;
  }

  handleRight() {
    this.keyboard.left.isDown = false;
    this.keyboard.left.isUp = true;
    this.keyboard.right.isDown = true;
    this.keyboard.right.isUp = false;
  }

  handleJump() {
    if (this.player.body.touching.down) {
      this.keyboard.up.isDown = true;
      this.keyboard.up.isUp = false;
    }
  }

  collectStar(player, star) {
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function(child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      var x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("turn");

    this.gameOver = true;
  }
}
