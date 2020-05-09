import "phaser";
import Overlay from "../objects/Overlay";
import TestObject from "../objects/characters/TestObject";
import tiles7 from "../assets/map3-tiles.png";
import map7 from "../assets/level7.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"
import ClearScene from "./ClearScene";
import LevelIntro from "./LevelIntro";


export default class Level7Scene extends Phaser.Scene {

    static DEPTH_COMMAND;
    static DEPTH_GROUND = 50;
    static DEPTH_WALLS = 100;
    static MAP_WIDTH = 40*32 + 16;
    static MAP_HEIGHT = 40*32 + 16;
    static SCENE_NAME = 'Level7Scene';
    
    recognizer;         //  TensorFlow recognizer
    controls;
    map;
    player;
    sandBags;
    ground;
    exit;
    speed = 100;
    exitReached;


    constructor() {
        super({key: 'Level7Scene'});
    }

    init(data) {
        this.exitReached = false;
        this.setupVoice();
    }

    preload() {
        this.load.image('tiles7', tiles7, {frameWidth: 32, frameHeight: 32});
        this.load.tilemapTiledJSON('map7', map7);

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
        this.map = this.make.tilemap({key: 'map7', tileWidth: 40, tileHeight: 40});

        //creat ground tiles
        this.ground = this.map.createStaticLayer(
            'bot',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles7', 32, 32),
            0, 0)

        //create sandbags tiles
        this.sandBags = this.map.createStaticLayer(
            'top',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles7', 32, 32),
            0, 0)
        
        //create exit tiles
        this.exit = this.map.createStaticLayer(
            'exit',
            this.map.addTilesetImage('32x32_map_tile v3.1 [MARGINLESS]', 'tiles7', 32, 32),
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
        this.player = this.add.existing(new TestObject(this, 16 + 16 * 32, 16 + 36 * 33, 'player'))
        this.physics.add.existing(this.player);
        this.player.setAngle(270);

        //  Add action queue sprite to scene
        this.add
            .existing(new TestObject.ActionQueue(
                this.physics.world, this, this.player, Level7Scene.DEPTH_COMMAND,
                TestObject.Actions.GO_LEFT, 
                TestObject.Actions.GO_RIGHT, 
                TestObject.Actions.GO_DOWN, 
                TestObject.Actions.GO_UP));
        
        //  Add Overlay to scene
        this.add
            .existing(new Overlay(this, 'Level 7'));

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
                //  Setup camera
                this.cameras
                .main
                .setBounds(0, 0, Level7Scene.MAP_WIDTH, Level7Scene.MAP_HEIGHT)
                .startFollow(this.player);

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
                    parentSceneName: Level7Scene.SCENE_NAME
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

            }  
        }
    }

    exitScene()
    {
        this.scene.stop();
        //  Launch the next scene
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