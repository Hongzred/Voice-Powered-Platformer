import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";

export default class Level2Scene extends Phaser.Scene {

    static DEPTH_COMMAND;
    static DEPTH_GROUND = 50;
    static DEPTH_WALLS = 100;

    controls;
    map;
    player;
    sandBags;
    ground;
    exit;
    speed = 100;
    static LEVEL_NAME = 'LEVEL2';

    constructor() {
        super({key: 'Level2Scene'});
    }

    init(data) {
        this.annyang = data.annyang;
    }

    preload() {
        this.load.image('tiles', '/src/assets/lpc_farming.png', {frameWidth: 32, frameHeight: 32});
        this.load.tilemapTiledJSON('map', '/src/assets/demo-level2.json');

        this.load.image(TestObject.Actions.GO_LEFT, './src/assets/left.png');
        this.load.image(TestObject.Actions.GO_RIGHT, './src/assets/right.png');
        this.load.image(TestObject.Actions.GO_UP, './src/assets/up.png');
        this.load.image(TestObject.Actions.GO_DOWN, './src/assets/down.png');
    }

    create() {

        // manual controls
        this.cursor = this.input.keyboard.createCursorKeys();

        //create layout
        this.map = this.make.tilemap({key: 'map', tileWidth: 32, tileHeight: 32});

        //creat ground tiles
        this.ground = this.map.createStaticLayer(
            'bot',
            this.map.addTilesetImage('lpc_farming', 'tiles', 32, 32),
            0, 0).setDepth(LevelIntro.DEPTH_GROUND);

        //create sandbags tiles
        this.sandBags = this.map.createStaticLayer(
            'top',
            this.map.addTilesetImage('lpc_farming', 'tiles', 32, 32),
            0, 0).setDepth(LevelIntro.DEPTH_WALLS);
        
            
        this.map.setCollision([200], true, true, this.sandBags);

        //create player
        this.player = this.add.existing(new TestObject(this, 16 + 8 * 32, 16 + 8 * 32, 'player'))
        this.physics.add.existing(this.player);
        this.player.setAngle(270);

        //  Add action queue sprite to scene
        this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, Level2Scene.DEPTH_COMMAND,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));
        
        //  Add Overlay to scene
        this.add
            .existing(new Overlay(this, 'Demo Level 2'));

        //create collider
        this.physics.add.collider(this.sandBags, this.player);

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
        if (this.cursors.right.isDown) 
        {
            this.player.action.enqueue(TestObject.Actions.GO_RIGHT);
        }

        if (this.cursors.left.isDown)
        {
            this.player.action.enqueue(TestObject.Actions.GO_LEFT);
        }

        if (this.cursors.down.isDown) 
        {
            this.player.action.enqueue(TestObject.Actions.GO_DOWN);
        }

        if (this.cursors.up.isDown)
        {
            this.player.action.enqueue(TestObject.Actions.GO_UP);
        }
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