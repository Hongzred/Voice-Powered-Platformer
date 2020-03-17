import "phaser";


export default class Overlay extends Phaser.GameObjects.Group{

    DEPTH = 1000;

    constructor(scene, levelName)
    {
        super(scene);

        this.add(
            new Phaser.GameObjects.Text(
                scene,
                scene.cameras.main.width,
                0, 
                levelName)
                .setStyle({
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: 'rgb(255, 255, 255)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                })
                .setOrigin(1, 0)   //  sets origin to upper right corner of text
                .setPadding(20, 10, 20, 10)
                .setScrollFactor(0, 0)
                .setDepth(this.DEPTH),
            true);
    }

}