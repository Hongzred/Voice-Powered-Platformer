import "@babel/polyfill";
import "phaser";
import TestObject from "../objects/characters/TestObject"
import Overlay from "../objects/Overlay"
import tiles from "../assets/VPP_level_1_tilemap.png";
import coin from "../assets/coinGold.png";
import lock from "../assets/lock_yellow.png";
import map from "../assets/VPP Level 1 Demo 2.json";
import GoLeft from "../assets/left.png";
import GoRight from "../assets/right.png";
import GoUp from "../assets/up.png";
import GoDown from "../assets/down.png"
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
        this.setupVoice();
    }

    preload() 
    {
        this.load.image('tiles', tiles,  { frameWidth: 32, frameHeight: 32 });
        this.load.image('coin', coin, { frameWidth: 32, frameHeight: 32});
        this.load.image('lock', lock, { frameWidth: 70, frameHeight: 70});
        this.load.tilemapTiledJSON('map', map)

        this.load.image(TestObject.Actions.GO_LEFT, GoLeft);
        this.load.image(TestObject.Actions.GO_RIGHT, GoRight);
        this.load.image(TestObject.Actions.GO_UP, GoUp);
        this.load.image(TestObject.Actions.GO_DOWN, GoDown);
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
        this.coins.getChildren().forEach((coin) => {
            console.log(coin.body)
        })

        //  Handle action when player overlaps with coins
        this.physics.add.overlap(
            this.player,
            this.coins,
            (player, coin) => {
                //  Handle logic
            }
        )

        this.physics.add.overlap(
            this.coins,
            this.barrels,
            (coin, barrel) => {
               if (barrel.index >= 0)
               {
                   coin.body.setVelocityX(0);
                   coin.body.setVelocityY(0);
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
        this.physics.add.collider(this.coins, this.barrels);

        //  Graphical debugger
        let debugGraphics = this.add.graphics();
        //  this.map.renderDebug(debugGraphics);

        //  Add manual controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras
            .main
            .setBounds(0, 0, 800, 800);
        this.cameras.main.startFollow(this.player);

    }

    update(time, delta)
    {
        //  console.log(this.player.body.velocity)
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
       
        this.input.emit('pointerup');
    }

    
}