import "phaser";
import GameScene from "./GameScene";
import config from "../config/config";

export default class MapNavScene extends Phaser.Scene {

    controls;
    map;
    player;
    barrels;
    coins;
    ground;
    exit;
    lock;
    speed = 75;
    coinsCollected = 0;

    COINS_TOTAL = 3;


    constructor() {
        super({key: 'MapNav'});
    }

    init(data)
    {
        this.annyang = data.annyang;
    }

    preload() 
    {
        console.log('preload')
        this.load.image('tiles', '/src/assets/VPP_level_1_tilemap.png',  { frameWidth: 32, frameHeight: 32 });
        this.load.image('coin', '/src/assets/coinGold.png', { frameWidth: 32, frameHeight: 32});
        this.load.image('lock', '/src/assets/lock_yellow.png', { frameWidth: 70, frameHeight: 70});
        this.load.image('player', '/src/assets/car.png');
        this.load.tilemapTiledJSON('map', '/src/assets/VPP Level 1 Demo 2.json')
    }

    create()
    {       
        //  Manual controls
        this.cursors = this.input.keyboard.createCursorKeys();

        //  create layout
        this.map = this.make.tilemap({key: 'map', tileWidth: 32, tileHeight: 32});
        
        this.ground = this.map.createStaticLayer(
            'Ground', 
            this.map.addTilesetImage('magecity', 'tiles', 32, 32), 
            0, 0);
    
        this.barrels = this.map.createStaticLayer(
            'Barrels', 
            this.map.addTilesetImage('magecity', 'tiles', 32, 32), 
            0, 0);
        this.map.setCollision([13], true, true, this.barrels);

        this.player = this.physics.add.sprite(16 + 8 * 32, 16 + 8 * 32, 'player');
        this.player.setAngle(270);
        
        this.coins = this.physics.add.group();
        this.coins
            .addMultiple(this.map.createFromObjects('Coins', 361, {key: 'coin'}));

        this.physics.add.overlap(
            this.player,
            this.coins,
            (player, coin) => {
                this.coins.remove(coin);
                coin.setActive(false).setVisible(false);
                this.coinsCollected++;
                if (this.coinsCollected === this.COINS_TOTAL) {
                    this.lock
                        .getChildren()
                        .forEach(lockSprite => {
                            this.lock.remove(lockSprite);
                            lockSprite.setActive(false).setVisible(false);
                        })
                }
            }
        )

        this.lock = this.physics.add.staticGroup();
        this.lock.addMultiple(this.map.createFromObjects('Lock', 362, {key: 'lock'}));

        this.physics.add.collider(this.barrels, this.player);
        this.physics.add.collider(this.coins, this.player);
        this.physics.add.collider(this.lock, this.player);

        //  Graphical debugger
        let debugGraphics = this.add.graphics();
        //  this.map.renderDebug(debugGraphics);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras
            .main
            .setBounds(0, 0, 800, 800);
        this.cameras.main.startFollow(this.player);

        //  Setup controls
        this.setupControls();
        
        //  Setup annyang
        this.setupVoice(this.annyang);
    }

    update(time, delta)
    {
        if (this.cursors.right.isDown) 
        {
            this.player.setVelocityX(this.speed);
            this.player.setVelocityY(0);
            this.player.setAngle(0);
        }

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-1 * this.speed);
            this.player.setVelocityY(0);
            this.player.setAngle(180);
        }

        if (this.cursors.down.isDown) 
        {
            this.player.setVelocityY(this.speed);
            this.player.setVelocityX(0);
            this.player.setAngle(90);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-1 * this.speed);
            this.player.setVelocityX(0);
            this.player.setAngle(270);
    }
    }

    setupVoice(annyang)
    {
        let commands = {
            'l*rest' : rest => {
                this.controls.goLeft();
            },
            'r*rest' : rest => {
                this.controls.goRight();
            },
            't*rest' : rest => {
                this.controls.goUp();
            },
            'd*rest' : rest => {
                this.controls.goDown();
            }

        }
        annyang.removeCommands();
        annyang.addCommands(commands);
        annyang.start();
    }

    setupControls()
    {
        this.controls = {
            goDown: () => {
                this.player.setVelocityY(this.speed);
                this.player.setVelocityX(0);
                this.player.setAngle(90);
            },
            goUp: () => {
                this.player.setVelocityY(-1 * this.speed);
                this.player.setVelocityX(0);
                this.player.setAngle(270);
            },
            goLeft: () => {
                this.player.setVelocityX(-1 * this.speed);
                this.player.setVelocityY(0);
                this.player.setAngle(180);
            },
            goRight: () => {
                this.player.setVelocityX(this.speed);
                this.player.setVelocityY(0);
                this.player.setAngle(0);
            },
        };
    }
}