export default {
  type: Phaser.AUTO,
  parent: "phaser-example",
  pixelArt: true,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2d',
  centerX: Math.round(0.5 * 800) - 30,
  centerY: Math.round(0.5 * 600) - 30,
  physics: {
    default: "arcade",
    // arcade: {
    //   gravity: { y: 300 },
    //   debug: false
    // }
  }
};
