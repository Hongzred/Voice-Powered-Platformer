import "phaser";

import ClearScene from "./ClearScene";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import Level6Scene from "./Level6";
import level5TileSet from "../assets/level5.png";
import MapJSON from "../assets/VPP-level5.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"

export default class Level5 extends Phaser.Scene
{
    static SCENE_NAME = 'LEVEL 5';
    static TILE_SET_KEY = 'LEVEL_5_TILEMAP';
    static TILE_SET_SPRITE = 'Level5 Tile Set';
    static TILE_SET_NAME = 'level5';
    static PLAYER_IMAGE_KEY = 'player';                  //  Defined in an earlier scene
    static START_X = 944;
    static START_Y = 1032;
    static MAP_WIDTH = 1600;
    static MAP_HEIGHT = 1280;
    static DEPTH = {
        Abyss: 0,
        Ground: 50,
        Exit: 50,
        Walls: 50,
        CommandsQueue: 500,
        Player: 1000
    };
    static LAYER_NAMES = {
        Abyss: 'Abyss',
        Ground: 'Ground',
        Exit: 'Exit',
        Walls: 'Walls'
    };

    recognizer;         //  TensorFlow recognizer
    cursors;            //  Manual controls
    exitLayer;          //  Reference to exit layer
    commandQueue;       //  Command queue sprite
    exitReached;        //  True if player arrives at exit

    constructor()
    {
        super({key: Level5.SCENE_NAME});
        console.log('Level5:    constructor()');
    }

    init(data)
    {
        //  Handle data pass from previous scene\
        console.log('Level5:    init()');
        this.exitReached = false;
        this.setupVoice();
    }
    
    preload()
    {
        console.log('Level5:    preload()');

        //  Map sprites
        this.load.image(Level5.TILE_SET_SPRITE, level5TileSet);

        //  Map from Tiled
        this.load.tilemapTiledJSON(Level5.TILE_SET_KEY, MapJSON);

        //  Command sprites
        this.load.image(TestObject.Actions.GO_LEFT, GoLeft);
        this.load.image(TestObject.Actions.GO_RIGHT, GoRight);
        this.load.image(TestObject.Actions.GO_UP, GoUp);
        this.load.image(TestObject.Actions.GO_DOWN, GoDown);
    }

    create()
    {
        console.log('Level5:    create()');
        
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Add level overlay
        this.add
            .existing(new Overlay(this, Level5.SCENE_NAME));

        //  Create layout
        this.map = this.make.tilemap({
            key: Level5.TILE_SET_KEY,
            tileWidth: 32,
            tileHeight: 32
        });

        //  Create abyss
        this.map.createStaticLayer(
            Level5.LAYER_NAMES.Abyss,
            this.map.addTilesetImage(Level5.TILE_SET_NAME, Level5.TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level5.DEPTH.Abyss);
            
        //  Create ground
        this.map.createStaticLayer(
            Level5.LAYER_NAMES.Ground,
            this.map.addTilesetImage(Level5.TILE_SET_NAME, Level5.TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level5.DEPTH.Ground);

        //  Create walls
        const wallsLayer  = this.map.createStaticLayer(
            Level5.LAYER_NAMES.Walls,
            this.map.addTilesetImage(Level5.TILE_SET_NAME, Level5.TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level5.DEPTH.Walls);
        const wallsCollisionIndices = new Phaser.Structs.Set();
        for (const row of wallsLayer.layer.data)
        {
            for (const tile of row)
            {
                if (tile.index >= 0) wallsCollisionIndices.set(tile.index);
            }
        }
        this.map.setCollision(wallsCollisionIndices.getArray(), true, true, wallsLayer);

        //  Create exit layer
        const exitLayer = this.map.createStaticLayer(
            Level5.LAYER_NAMES.Exit,
            this.map.addTilesetImage(Level5.TILE_SET_NAME, Level5.TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level5.DEPTH.Exit);

        //  Create player
        this.player = this.add.existing(new TestObject(
            this,
            Level5.START_X,
            Level5.START_Y,
            Level5.PLAYER_IMAGE_KEY));
        this.physics.add.existing(this.player);
        this.player
            .setAngle(270)
            .setDepth(Level5.DEPTH.Player);
        this.physics.add.collider([wallsLayer], this.player);

        //  Handle overlap with exit tiles
        this.physics.add.overlap(
            this.player, 
            exitLayer,
            this.handleReachingExit.bind(this));

        //  Add action queue sprite to scene
        this.commandQueue = this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, Level5.DEPTH.CommandsQueue,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));

        //  Setup camera
        this.cameras
            .main
            .setBounds(0, 0, Level5.MAP_WIDTH, Level5.MAP_HEIGHT)
            .startFollow(this.player);

        //  Exit Scene handler
        this.events.on('resume', this.exitScene.bind(this));
    }

    setupVoice()
    {
        const self = this;
        let recognizer;

        function predictWord() 
        {
            // Array of words that the recognizer is trained to recognize.
            self.recognizer = recognizer;
            const words = recognizer.wordLabels();
            recognizer.listen(({scores}) => {
                // Turn scores into a list of (score,word) pairs.
                scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
                // Find the most probable word.
                scores.sort((s1, s2) => s2.score - s1.score);
                self.handleVoice(scores[0].word);
            }, {
                probabilityThreshold: 0.85,
                overlapFactor: 0.30
            });
        }

        async function listen() 
        {
            recognizer = speechCommands.create('BROWSER_FFT', 'directional4w');
            await recognizer.ensureModelLoaded();
            predictWord();
        }
           
        listen();
    }

    handleReachingExit(player, tile)
    {
        if (tile.index >= 0)
        {
            if (!this.exitReached)
            {
                this.exitReached = true;
                this.scene.pause();
                const clearSceneData = {
                    parentSceneName: Level5.SCENE_NAME
                };
                const clearScene = this.scene.get(ClearScene.SCENE_NAME);
                if (!clearScene)
                {
                    this.scene.add(ClearScene.SCENE_NAME, ClearScene, false, clearSceneData);
                    this.scene.launch(ClearScene.SCENE_NAME);
                } 
                else
                {
                    clearScene.scene.bringToTop();
                    clearScene.scene.restart(clearSceneData);
                }                
            }  
        }
    }

    exitScene()
    {
        this.scene.stop();
        
        const level6Scene = this.scene.get(Level6Scene.SCENE_NAME, Level6Scene);
        if (!level6Scene)
        {
            this.recognizer.stopListening();
            this.scene.add(Level6Scene.SCENE_NAME, Level6Scene, false, {});
            this.scene.launch(Level6Scene.SCENE_NAME);
        }
        else
        {
            level6Scene.scene.bringToTop();
            level6Scene.scene.restart({});
        }
    }

    update(time, delta)
    {
        console.log('Level5:    update()');
        function handleKeyUp(e) 
        {
            switch (e.code) 
            {
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

    handleVoice(voiceCommand)
    {
        if (voiceCommand === 'left')
        {
            this.player.action.enqueue(TestObject.Actions.GO_LEFT);
        }
        else if (voiceCommand === 'right')
        {
            this.player.action.enqueue(TestObject.Actions.GO_RIGHT);
        }
        else if (voiceCommand === 'up')
        {
            this.player.action.enqueue(TestObject.Actions.GO_UP);
        }
        else if (voiceCommand === 'down')
        {
            this.player.action.enqueue(TestObject.Actions.GO_DOWN);
        }
    }
}