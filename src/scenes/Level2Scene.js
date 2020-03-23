import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import MapNavScene from "./MapNavScene";


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
    exitReached;
    static LEVEL_NAME = 'LEVEL2';

    constructor() {
        super({key: 'Level2Scene'});
    }

    init(data) {
        this.annyang = data.annyang;
    }

    preload() {
        this.load.image('tiles2', '/src/assets/lpc_farming.png', {frameWidth: 32, frameHeight: 32});
        this.load.tilemapTiledJSON('map2', '/src/assets/demo-level2.json');

        this.load.image(TestObject.Actions.GO_LEFT, './src/assets/left.png');
        this.load.image(TestObject.Actions.GO_RIGHT, './src/assets/right.png');
        this.load.image(TestObject.Actions.GO_UP, './src/assets/up.png');
        this.load.image(TestObject.Actions.GO_DOWN, './src/assets/down.png');
    }

    create() {
        console.log('logg');
        // manual controls
        this.cursor = this.input.keyboard.createCursorKeys();

        //create layout
        this.map = this.make.tilemap({key: 'map2', tileWidth: 32, tileHeight: 32});

        //creat ground tiles
        this.ground = this.map.createStaticLayer(
            'bot',
            this.map.addTilesetImage('lpc_farming', 'tiles2', 32, 32),
            0, 0)

        //create sandbags tiles
        this.sandBags = this.map.createStaticLayer(
            'top',
            this.map.addTilesetImage('lpc_farming', 'tiles2', 32, 32),
            0, 0)
        
        //create exit tiles
        this.exit = this.map.createStaticLayer(
            'exit',
            this.map.addTilesetImage('lpc_farming', 'tiles2', 32, 32),
            0, 0)
        
        //add collider   
        const wallCollisionsIndices = new Phaser.Structs.Set();
        for (let row of this.sandBags.layer.data) {
            for (let tile of row) {
                if (tile.index >= 0) wallCollisionsIndices.set(tile.index);
            }
        }
        this.map.setCollision(
            wallCollisionsIndices.getArray(),
            true,
            true,
            this.sandBags
        )

        //create player
        this.player = this.add.existing(new TestObject(this, 16 + 10 * 32, 16 + 3 * 32, 'player'))
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
        
        //handle overlap with exit layer
        this.physics.add.overlap(
            this.player,
            this.exit,
            this.handleReachingExit.bind(this));

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

    handleReachingExit(player, tile)
    {
        
        if (tile.index >= 0)
        {
            if (!this.exitReached)
            {
                console.log('reached')
                this.exitReached = true;
                this.scene.pause();
                this.scene.add('MapNav', MapNavScene);
                annyang.pause();

                this.scene.start('MapNav', {
                    annyang: this.annyang
                });

            }  
        }
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