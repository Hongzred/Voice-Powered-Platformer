import "phaser";
import TestObject from "../objects/characters/TestObject"
import Overlay from "../objects/Overlay"

export default class MapNavScene extends Phaser.Scene {

    static DEPTH_COMMAND;

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
        this.load.image('tiles', '/src/assets/VPP_level_1_tilemap.png',  { frameWidth: 32, frameHeight: 32 });
        this.load.image('coin', '/src/assets/coinGold.png', { frameWidth: 32, frameHeight: 32});
        this.load.image('lock', '/src/assets/lock_yellow.png', { frameWidth: 70, frameHeight: 70});
        this.load.tilemapTiledJSON('map', '/src/assets/VPP Level 1 Demo 2.json')

        this.load.image(TestObject.Actions.GO_LEFT, './src/assets/left.png');
        this.load.image(TestObject.Actions.GO_RIGHT, './src/assets/right.png');
        this.load.image(TestObject.Actions.GO_UP, './src/assets/up.png');
        this.load.image(TestObject.Actions.GO_DOWN, './src/assets/down.png');
    }

    create()
    {       


        //  Manual controls
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Create layout
        this.map = this.make.tilemap({key: 'map', tileWidth: 32, tileHeight: 32});
        
        //  Create ground tiles
        this.ground = this.map.createStaticLayer(
            'Ground', 
            this.map.addTilesetImage('magecity', 'tiles', 32, 32), 
            0, 0);
            
        //  Create barrel tiles
        this.barrels = this.map.createStaticLayer(
            'Barrels', 
            this.map.addTilesetImage('magecity', 'tiles', 32, 32), 
            0, 0);
        this.map.setCollision([13], true, true, this.barrels);

        //  Create player
        this.player = this.add.existing(new TestObject(this, 16 + 8 * 32, 16 + 8 * 32, 'player'))
        this.physics.add.existing(this.player);
        this.player.setAngle(270);
     
        //  Add action queue sprite to scene
        this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, MapNavScene.DEPTH_COMMAND,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));
        
        //  Add Overlay to scene
        this.add
            .existing(new Overlay(this, 'Demo Level'));
        
        //  Create Coins
        this.coins = this.physics.add.group();
        this.coins
            .addMultiple(this.map.createFromObjects('Coins', 361, {key: 'coin'}));

        //  Handle action when player overlaps with coins
        this.physics.add.overlap(
            this.player,
            this.coins,
            (player, coin) => {
                console.log('overlap')
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

        //  Create lock object
        this.lock = this.physics.add.staticGroup();
        this.lock.addMultiple(this.map.createFromObjects('Lock', 362, {key: 'lock'}));

        //  Check collission between player and objects
        this.physics.add.collider(this.barrels, this.player);
        this.physics.add.collider(this.coins, this.player);
        this.physics.add.collider(this.lock, this.player);

        //  Graphical debugger
        let debugGraphics = this.add.graphics();
        //  this.map.renderDebug(debugGraphics);

        //  Add manual controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras
            .main
            .setBounds(0, 0, 800, 800);
        this.cameras.main.startFollow(this.player);
        
        //  Setup annyang
        this.setupVoice(this.annyang);


    }

    update(time, delta)
    {
        function handleKeyUp(e) {
            switch (e.code) {
                case 'ArrowRight':
                    this.player.action.enqueue(TestObject.Actions.GO_RIGHT);
                    break;
                case 'ArrowLeft':
                    this.player.action.enqueue(TestObject.Actions.GO_LEFT);
                    break;
                case 'ArrowUp':
                    this.player.action.enqueue(TestObject.Actions.GO_UP);
                    break;
                case 'ArrowDown':
                    this.player.action.enqueue(TestObject.Actions.GO_DOWN);
                    break;
            }
        }
        
        if (this.dialogueIndex >= LevelIntro.MOVEABLE_INDEX) 
            this.input.keyboard.on('keyup', handleKeyUp, this);
    }

    setupVoice(annyang)
    {
        let commands = {
            'l*rest' : rest => {
                this.player.action.enqueue(TestObject.Actions.GO_LEFT);
            },
            'r*rest' : rest => {
                this.player.action.enqueue(TestObject.Actions.GO_RIGHT);
            },
            't*rest' : rest => {
                this.player.action.enqueue(TestObject.Actions.GO_UP);
            },
            'd*rest' : rest => {
                this.player.action.enqueue(TestObject.Actions.GO_DOWN);
            }

        }
        annyang.removeCommands();
        annyang.addCommands(commands);
        annyang.start();
    }
    
}