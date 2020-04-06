import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import Level4Scene from "./Level4";
import tiles3 from "../assets/map3-tiles.png";
import map3 from "../assets/level3.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"
import ClearScene from "./ClearScene";

export default class Level3Scene extends Phaser.Scene {

    static DEPTH_COMMAND;
    static DEPTH_GROUND = 50;
    static DEPTH_WALLS = 100;

    recognizer;         //  TensorFlow recognizer
    controls;
    map;
    player;
    sandBags;
    ground;
    exit;
    speed = 100;
    exitReached;
    static SCENE_NAME = 'Level3Scene';

    constructor() {
        super({key: 'Level3Scene'});
    }

    init(data) {
        this.exitReached = false;
        this.setupVoice();
    }

    preload() {
        this.load.image('tiles3', tiles3, {frameWidth: 32, frameHeight: 32});
        this.load.tilemapTiledJSON('map3', map3);

        this.load.image(TestObject.Actions.GO_LEFT, GoLeft);
        this.load.image(TestObject.Actions.GO_RIGHT, GoRight);
        this.load.image(TestObject.Actions.GO_UP, GoUp);
        this.load.image(TestObject.Actions.GO_DOWN, GoDown);
    }

    create() {
        console.log('logg');
        // manual controls
        this.cursor = this.input.keyboard.createCursorKeys();

        //create layout
        this.map = this.make.tilemap({key: 'map3', tileWidth: 32, tileHeight: 32});

        //creat ground tiles
        this.ground = this.map.createStaticLayer(
            'bot',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles3', 32, 32),
            0, 0)

        //create sandbags tiles
        this.sandBags = this.map.createStaticLayer(
            'top',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles3', 32, 32),
            0, 0)
        
        //create exit tiles
        this.exit = this.map.createStaticLayer(
            'exit',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles3', 32, 32),
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
        this.player = this.add.existing(new TestObject(this, 16 + 7 * 32, 16 + 18 * 32, 'player'))
        this.physics.add.existing(this.player);
        this.player.setAngle(270);

        //  Add action queue sprite to scene
        this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, Level3Scene.DEPTH_COMMAND,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));
        
        //  Add Overlay to scene
        this.add
            .existing(new Overlay(this, 'Demo Level 3'));

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
        this.events.on('resume', this.exitScene.bind(this));

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
                const clearSceneData = {
                    parentSceneName: Level3Scene.SCENE_NAME
                };
                const clearScene = this.scene.get(ClearScene.SCENE_NAME);
                if (!clearScene)
                {
                    this.scene.add(ClearScene.SCENE_NAME, ClearScene, false, clearSceneData);
                    this.scene.launch(ClearScene.SCENE_NAME);
                    this.recognizer.stopListening();
                } else 
                {
                    clearScene.scene.bringToTop();
                    clearScene.scene.restart(clearSceneData);
                }

                // this.scene.start(Level4Scene.SCENE_NAME, {});

            }  
        }
    }

    exitScene()
    {
        this.scene.stop();
        
        const level4Scene = this.scene.get(Level4Scene.SCENE_NAME, Level4Scene);
        if (!level4Scene)
        {
            this.recognizer.stopListening();
            this.scene.add(Level4Scene.SCENE_NAME, Level4Scene, false, {});
            this.scene.launch(Level4Scene.SCENE_NAME);
        }
        else
        {
            level4Scene.scene.bringToTop();
            level4Scene.scene.restart({});
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