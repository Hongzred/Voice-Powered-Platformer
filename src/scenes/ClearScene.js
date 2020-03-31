import "phaser";


export default class ClearScene extends Phaser.Scene 
{
    static SCENE_NAME = 'Clear Scene';
    static MESSAGE = 'CLEARED!';
    static DEPTH = 1000;
    static FONT_SIZE = 96;
    static FONT_COLOR = 'white';
    static FONT_STYLE = 'italic bold';
    static ALIGN = 'center';
    static SCENE_DURATION_MS = 3000;

    constructor()
    {
        super({key: ClearScene.SCENE_NAME});
    }

    init(data)
    {
        this.parentSceneName = data.parentSceneName;
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
        this.scene.resume(this.parentSceneName);
    }
}