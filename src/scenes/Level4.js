import "phaser";

import ClearScene from "./ClearScene";
import LevelIntro from "./LevelIntro";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";

import introTileSet from "../assets/level_intro_set1.png";
import demoTileSet from "../assets/VPP_level_1_tilemap.png";
import MapJSON from "../assets/VPP-level4.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"

export default class Level4 extends Phaser.Scene 
{

    static SCENE_NAME = 'LEVEL_4';
    static TILE_SET_KEY = 'LEVEL_4_TILEMAP';
    static INTRO_TILE_SET_SPRITE = 'Intro Tile Set';
    static DEMO_TILE_SET_SPRITE = 'Demo Tile Set';
    static INTRO_TILE_SET_NAME = 'level_intro_set1';
    static DEMO_TILE_SET_NAME = 'VPP_level_1_tilemap';
    static PLAYER_IMAGE_KEY = 'player';                     //  Defined in an earlier scene
    static START_X = 825;
    static START_Y = 496;
    static MAP_WIDTH = 1720;
    static MAP_HEIGHT = 1200;
    static DEPTH = {
        Water: 0,
        Ground: 50,
        Exit: 100,
        Bounds: 150,
        Walls_Bottom: 200,
        Walls_Top: 250,
        CommandsQueue: 500,
        Player: 1000
    };
    static LAYER_NAMES = {
        Water: 'Water',
        Bounds: 'Bounds',
        Exit: 'Exit',
        Ground: 'Ground',
        Walls_Top: 'Walls_Top',
        Walls_Bottom: 'Walls_Bottom'
    };

    recognizer;         //  TensorFlow recognizer
    cursors;
    exitLayer;
    commandQueue;
    exitReached;

    constructor()
    {
        super({key: Level4.SCENE_NAME});
        console.log('Level4:    constructor()');
    }

    init(data)
    {
        //  Handle data pass from previous scene\
        console.log('Level4:    init()');
        this.exitReached = false;
        this.setupVoice()
    }  

    preload()
    {
        console.log('Level4:    preload()');

        //  Map sprites
        this.load.image(Level4.INTRO_TILE_SET_SPRITE, introTileSet);
        this.load.image(Level4.DEMO_TILE_SET_SPRITE, demoTileSet);

        //  Map from Tiled
        this.load.tilemapTiledJSON(Level4.TILE_SET_KEY, MapJSON);

        //  Command sprites
        this.load.image(TestObject.Actions.GO_LEFT, GoLeft);
        this.load.image(TestObject.Actions.GO_RIGHT, GoRight);
        this.load.image(TestObject.Actions.GO_UP, GoUp);
        this.load.image(TestObject.Actions.GO_DOWN, GoDown);
    }

    create()
    {
        console.log('Level4:    create()');
        
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Add level overlay
        this.add
            .existing(new Overlay(this, Level4.SCENE_NAME));

        //  Create layout
        this.map = this.make.tilemap({
            key: Level4.TILE_SET_KEY,
            tileWidth: 32,
            tileHeight: 32
        });

        //  Create water
        this.map.createStaticLayer(
            Level4.LAYER_NAMES.Water,
            this.map.addTilesetImage(Level4.INTRO_TILE_SET_NAME, Level4.INTRO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Water);

        //  Create ground
        this.map.createStaticLayer(
            Level4.LAYER_NAMES.Ground,
            this.map.addTilesetImage(Level4.INTRO_TILE_SET_NAME, Level4.INTRO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Ground);

         //  Create bottom wall layer
        const bottomWallLayer = this.map.createStaticLayer(
            Level4.LAYER_NAMES.Walls_Bottom,
            this.map.addTilesetImage(Level4.DEMO_TILE_SET_NAME, Level4.DEMO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Walls_Bottom);
        const bottomWallCollisionIndices = new Phaser.Structs.Set();
        
        for (const row of bottomWallLayer.layer.data)
        {
            for (const tile of row)
            {
                if (tile.index >= 0) bottomWallCollisionIndices.set(tile.index);
            }
        }
        this.map.setCollision(bottomWallCollisionIndices.getArray(), true, true, bottomWallLayer);
            
        //  Create top wall layer
        const topWallLayer  = this.map.createStaticLayer(
            Level4.LAYER_NAMES.Walls_Top,
            this.map.addTilesetImage(Level4.DEMO_TILE_SET_NAME, Level4.DEMO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Walls_Top);
            
        const topWallCollisionIndices = new Phaser.Structs.Set();
        for (const row of topWallLayer.layer.data)
        {
            for (const tile of row)
            {
                if (tile.index >= 0) topWallCollisionIndices.set(tile.index);
            }
        }
        this.map.setCollision(topWallCollisionIndices.getArray(), true, true, topWallLayer);
     
        //  Create bounds
        const boundsLayer  = this.map.createStaticLayer(
            Level4.LAYER_NAMES.Bounds,
            this.map.addTilesetImage(Level4.INTRO_TILE_SET_NAME, Level4.INTRO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Bounds);
            
        const boundsCollisionIndices = new Phaser.Structs.Set();
        for (const row of boundsLayer.layer.data)
        {
            for (const tile of row)
            {
                if (tile.index >= 0) boundsCollisionIndices.set(tile.index);
            }
        }
        this.map.setCollision(boundsCollisionIndices.getArray(), true, true, boundsLayer);

        //  Create exit layer
        const exitLayer = this.map.createStaticLayer(
            Level4.LAYER_NAMES.Exit,
            this.map.addTilesetImage(Level4.INTRO_TILE_SET_NAME, Level4.INTRO_TILE_SET_SPRITE, 8, 8),
            0, 0)
            .setDepth(Level4.DEPTH.Exit);

        //  Create player
        this.player = this.add.existing(new TestObject(
            this,
            Level4.START_X,
            Level4.START_Y,
            Level4.PLAYER_IMAGE_KEY));
        this.physics.add.existing(this.player);
        this.player
            .setAngle(180)
            .setDepth(Level4.DEPTH.Player);
        this.physics.add.collider([bottomWallLayer, topWallLayer, boundsLayer], this.player);

        //  Handle overlap with exit tiles
        this.physics.add.overlap(
            this.player, 
            exitLayer,
            this.handleReachingExit.bind(this));

        //  Add action queue sprite to scene
        this.commandQueue = this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, Level4.DEPTH.CommandsQueue,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));

        //  Setup camera
        this.cameras
            .main
            .setBounds(0, 0, Level4.MAP_WIDTH, Level4.MAP_HEIGHT)
            .startFollow(this.player);

        //  Exit Scene handler
        this.events.on('resume', this.exitScene.bind(this));
    }

    update(time, delta)
    {
        // console.log('Level4:    update()');
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

    handleReachingExit(player, tile)
    {
        if (tile.index >= 0)
        {
            if (!this.exitReached)
            {
                this.exitReached = true;
                this.scene.pause();
                const clearSceneData = {
                    parentSceneName: Level4.SCENE_NAME
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
        const introScene = this.scene.get(LevelIntro.LEVEL_NAME);
        if (!introScene)
        {
            this.recognizer.stopListening();
            this.scene.add(LevelIntro.LEVEL_NAME, LevelIntro, false, {});
            this.scene.launch(LevelIntro.LEVEL_NAME);
        }
        else
        {
            introScene.scene.bringToTop();
            introScene.scene.restart({});
        }

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