import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import ClearScene from "./ClearScene"
import Level2Scene from "./Level2Scene";
import tileset_1 from "../assets/level_intro_set1.png";
import introLevel from "../assets/VPP-level-intro.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"

export default class LevelIntro extends Phaser.Scene {
    static DEPTH_WATER = 0;
    static DEPTH_GROUND = 50;
    static DEPTH_WALLS = 100;
    static DEPTH_PLAYER = 150;
    static DEPTH_GATE = 200;
    static DEPTH_COMMANDS = 250;
    static DEPTH_DIALOGUE = 1000;
    static LEVEL_NAME = 'INTRODUCTION';
    static START_X = 600;
    static START_Y = 275;
    static MOVEABLE_INDEX = 3;
    static DIALOGUE = [
        'Welcome to VPP!\n\n(Click or say "next" to continue)',
        'This is you.',
        'You can move by using the arrow keys.',
        'You can also move by using voice commands:\n\ntop, down\nleft, right',
        'Give it a try!\n\n(Click or say "next" to continue)',
        'Your commands can be queued up if they are inputted quickly. \n\nTry the sequence "left. right. left. right"',
        'The objective of each level is to get to the exit.',
        'Try getting to the wooden bridge to advance to the next level!'
    ];
    
    annyang;            //  annyang
    cursors;            //  Manual control
    map;                //  Holds the tiled map
    dialogueText;       //  Holds dialogue text object
    dialogueIndex = 0;  //  Progress of current dialogue
    commandQueue;       //  Holds TestObject.ActionQueue
    runningTween;
    gateLayer;
    gateCollider;
    exitReached;

    constructor()
    {
        super({key: LevelIntro.LEVEL_NAME});
    }

    init(data)
    {
        //  Get annyang from previous scene
        this.annyang = data.annyang;
    }

    preload()
    {
        //  Load map sprite
        this.load.image('tile_set_1', tileset_1);

        //  Load map exported from Tiled
        this.load.tilemapTiledJSON('introLevel', introLevel);

        //  Command sprites
        this.load.image(TestObject.Actions.GO_LEFT, GoLeft);
        this.load.image(TestObject.Actions.GO_RIGHT, GoRight);
        this.load.image(TestObject.Actions.GO_UP, GoUp);
        this.load.image(TestObject.Actions.GO_DOWN, GoDown);

    }

    create()
    {
        console.log('LevelIntro: Creating...')
        //  Manual controls
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Add level overlay
        this.add
            .existing(new Overlay(this, LevelIntro.LEVEL_NAME));

        //  Manual controls
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Create layout
        this.map = this.make.tilemap({
            key: 'introLevel',
            tileWidth: 32,
            tileHeight: 32
        });

        //  Create ground layer
        this.map.createStaticLayer(
            'Ground',
            this.map.addTilesetImage('level_intro_set1_small', 'tile_set_1', 8, 8),
            0, 0)
            .setDepth(LevelIntro.DEPTH_GROUND);

        //  Create water layer
        this.map.createStaticLayer(
            'Water',
            this.map.addTilesetImage('level_intro_set1_small', 'tile_set_1', 8, 8),
            0, 0)
            .setDepth(LevelIntro.DEPTH_WATER);
        
        //  Create wall layer
        const wallLayer = this.map.createStaticLayer(
            'Walls',
            this.map.addTilesetImage('level_intro_set1_small', 'tile_set_1', 8, 8),
            0, 0)
            .setDepth(LevelIntro.DEPTH_WALLS);

        const wallCollisionIndices = new Phaser.Structs.Set();
        for (let row of  wallLayer.layer.data) 
        {
            for (let tile of row) 
            {
                if (tile.index >= 0) wallCollisionIndices.set(tile.index);
            }
        }
        this.map
            .setCollision(
                wallCollisionIndices.getArray(),
                true,
                true,
                wallLayer);

        //  Create gate layer
        this.gateLayer = this.map.createStaticLayer(
            'Gate',
            this.map.addTilesetImage('level_intro_set1_small', 'tile_set_1', 8, 8),
            0, 0)
            .setDepth(LevelIntro.DEPTH_GATE);
        
        const gateCollisionIndices = new Phaser.Structs.Set();
        for (let row of this.gateLayer.layer.data)
        {
            for (let tile of row)
            {
                if (tile.index >= 0) gateCollisionIndices.set(tile.index);
            }
        }
        this.map
            .setCollision(
                gateCollisionIndices.getArray(),
                true,
                true,
                this.gateLayer);
        
        //  Create exit layer
        this.exitLayer = this.map.createStaticLayer(
            'Exit',
            this.map.addTilesetImage('level_intro_set1_small', 'tile_set_1', 8, 8),
            0, 0)
            .setDepth(LevelIntro.DEPTH_GROUND);
        
        //  Create player
        this.player = this.add
                        .existing(new TestObject(
                            this, 
                            LevelIntro.START_X, LevelIntro.START_Y, 
                            'player'));
        this.physics.add.existing(this.player);
        this.player
            .setAngle(180)
            .setDepth(LevelIntro.DEPTH_PLAYER);
        this.physics.add.collider(wallLayer, this.player);
        this.gateCollider = this.physics.add.collider(this.gateLayer, this.player);

        //  Handle overlap with exit tiles
        this.physics.add.overlap(
            this.player,
            this.exitLayer,
            this.handleReachingExit.bind(this));
                
        //  Add action queue sprite to scene
        this.commandQueue = this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, LevelIntro.DEPTH_COMMANDS,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));

        //  Setup camera
        this.cameras
            .main
            .setBounds(0, 0, 1200, 800)
            .startFollow(this.player);

        this.setupDialogue();
        this.setupVoice(this.annyang);
        this.events.on('resume', this.exitScene.bind(this));

    }

    update(time, delta)
    {
        //  console.log('LevelIntro: Updating...');
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

    setupDialogue()
    {
        this.dialogueText = this.add
                                .text()
                                .setText(LevelIntro.DIALOGUE[this.dialogueIndex++])
                                .setFontSize(24)
                                .setColor('white')
                                .setFontStyle('italic')
                                .setOrigin(0.5, 1)
                                .setPosition(
                                    this.cameras.main.width / 2, 
                                    this.cameras.main.height)
                                .setDepth(LevelIntro.DEPTH_DIALOGUE)
                                .setFixedSize(this.cameras.main.width, this.cameras.main.height / 3)
                                .setBackgroundColor('rgba(0,0,0,0.5)')
                                .setLineSpacing(5)
                                .setPadding(10, 10, 10, 10)
                                .setWordWrapWidth(this.cameras.main.width)
                                .setScrollFactor(0, 0);
        
        this.input.on('pointerup', () => {
            const self = this;

            if (this.dialogueIndex === 8)
            {
                this.dialogueText.destroy();
                return;
            }
            else if (this.dialogueIndex === 7)
            {
                this.gateCollider.destroy();
                this.gateLayer.destroy();
            }
            else if (this.dialogueIndex === 2)
            {
                this.runningTween
                    .complete()
                    .stop();
            }
            else if (this.dialogueIndex === 1)
            {
                this.runningTween = this.add.tween({
                    targets: self.player,
                    alpha: 0,
                    duration: 100,
                    repeat: -1,
                    yoyo: true,
                    onComplete: () => {
                        self.player.setAlpha(1)
                    }
                })
            }
            this.dialogueText.setText(LevelIntro.DIALOGUE[this.dialogueIndex++]) 
        }, this);
    }

    handleReachingExit(player, tile)
    {
        if (tile.index >= 0)
        {
            if (!this.exitReached)
            {
                this.exitReached = true;
                this.scene.pause();
                if (!this.scene.get(ClearScene.SCENE_NAME))
                {
                    this.scene.add(ClearScene.SCENE_NAME, ClearScene, false, {
                        parentSceneName: LevelIntro.LEVEL_NAME
                    });
                }
                this.scene.launch(ClearScene.SCENE_NAME)
            }  
        }
    }

    exitScene()
    {
        this.scene.stop();
        this.scene.add('Level2Scene', Level2Scene);
        this.scene.start('Level2Scene', {
            annyang: this.annyang
        });
    }

    setupVoice(annyang)
    {
        let self = this;
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
            },
            'n*rest' : rest => {
                this.input.emit('pointerup');
            }

        }
        annyang.removeCommands();
        annyang.addCommands(commands);
        annyang.start();
    }

}

