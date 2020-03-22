import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import MapNavScene from "./MapNavScene";

//  Subscene that displays a clear message for a short duration
class ClearScene extends Phaser.Scene {

    static SCENE_NAME = 'LEVEL_INTRO_CLEAR_SCENE';
    static MESSAGE = 'CLEARED!';
    static DEPTH = 1000;
    static FONT_SIZE = 96;
    static FONT_COLOR = 'white';
    static FONT_STYLE = 'italic bold';
    static ALIGN = 'center';
    static SCENE_DURATION_MS = 3000;

    constructor()
    {
        super({key : ClearScene.SCENE_NAME})
    }

    create()
    {

        this.add
            .text()
            .setText(ClearScene.MESSAGE)
            .setFontSize(ClearScene.FONT_SIZE)
            .setColor(ClearScene.FONT_COLOR)
            .setFontStyle(ClearScene.FONT_STYLE)
            .setOrigin(0.5, 0.5)
            .setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2)
            .setDepth(ClearScene.DEPTH)
            .setAlign(ClearScene.ALIGN)
            .setScrollFactor(0, 0);

        this.time.addEvent({
            delay: ClearScene.SCENE_DURATION_MS,
            callback: this.exitScene.bind(this)
        });

    }

    exitScene()
    {
        this.scene.stop();
        this.scene.resume(LevelIntro.LEVEL_NAME);
    }

}

export default class LevelIntro extends Phaser.Scene {
    
    static ClearScene = ClearScene;

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
        this.load.image('tile_set_1', '/src/assets/level_intro_set1.png');

        //  Load map exported from Tiled
        this.load.tilemapTiledJSON('introLevel', '/src/assets/VPP-level-intro.json');

        //  Command sprites
        this.load.image(TestObject.Actions.GO_LEFT, './src/assets/left.png');
        this.load.image(TestObject.Actions.GO_RIGHT, './src/assets/right.png');
        this.load.image(TestObject.Actions.GO_UP, './src/assets/up.png');
        this.load.image(TestObject.Actions.GO_DOWN, './src/assets/down.png');

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
        if (this.dialogueIndex >= LevelIntro.MOVEABLE_INDEX) 
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
                this.scene.add(LevelIntro.ClearScene.SCENE_NAME, LevelIntro.ClearScene)
                this.scene.launch(LevelIntro.ClearScene.SCENE_NAME)
            }  
        }
    }

    exitScene()
    {
        this.scene.stop();
        this.scene.add('MapNav', MapNavScene);
        this.scene.start('MapNav', {
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

