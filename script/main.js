

function Hero(game, x, y) {
  //call constructor
  Phaser.Sprite.call(this, game, x, y, 'hero');
  this.anchor.set(0.5, 0.5);
  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
  this.animations.add('stop', [0]);
  this.animations.add('run', [1, 2], 8, true);
  this.animations.add('jump', [3]);
  this.animations.add('die', [4, 5, 6, 7, 8, 9, 10], 12); // 12fps no loop


}

Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
  const SPEED = 150;
  this.body.velocity.x = direction * SPEED;

  if (this.body.velocity.x < 0) {
    this.scale.x = -1;
  }
  else if (this.body.velocity.x > 0) {
    this.scale.x = 1;
  }
}

Hero.prototype.jump = function () {
  const JUMP_SPEED = 500;

  let canJump = this.body.touching.down;
  if (canJump) {
    this.body.velocity.y = -JUMP_SPEED;
  }
  return canJump;
};

Hero.prototype.die = function () {
  this.alive = false;
  this.body.enable = false;


  this.animations.play('die').onComplete.addOnce(function () {

    this.kill();

  }, this);
};

Hero.prototype._getAnimationName = function () {
  let name = 'stop'; //def
  //jump

  if (this.body.velocity.y < 0) {
    name = 'jump';
  }
  else if (!this.alive) {
    name = 'die';
  }
  else if (this.body.velocity.x != 0 && this.body.touching.down) {
    name = 'run';
  }
  return name;
};

Hero.prototype.update = function () {
  let animationName = this._getAnimationName();
  if (this.animations.name !== animationName) {
    this.animations.play(animationName);
  }
};
const LEVEL_COUNT = 3;


//-----------------
//PHASER PLAY STATE
//-----------------

PlayState = {};

PlayState.init = function (data) {
  this.game.renderer.renderSession.roundPixels = true;
  this.keys = this.game.input.keyboard.addKeys({
    left: Phaser.KeyCode.LEFT,
    right: Phaser.KeyCode.RIGHT,
    up: Phaser.KeyCode.UP
  });
  this.foodPickupCount = 0;

  this.keys.up.onDown.add(function () {
    let didJump = this.hero.jump();
    if (didJump) {
      this.sfx.jump.play();
    }
  }, this);

  this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.preload = function () {
  this.game.load.json('level:2', 'data/level02.json');
  this.game.load.json('level:1', 'data/level01.json');
  this.game.load.json('level:0', 'data/level00.json');

  this.game.load.image('background', 'images/worm.png');

  this.game.load.image('blackground', 'images/blackground.png');
  this.game.load.image('block:1x1', 'images/block_1x1.png');
  this.game.load.image('block:2x1', 'images/block_2x1.png');
  this.game.load.image('block:4x1', 'images/block_4x1.png');
  // this.game.load.image('spike', 'images/newspike.png');

  this.game.load.image('win', 'images/win.png');
  this.game.load.image('redwin', 'images/redwin.png', true);

  this.game.load.image('redground', 'images/redground.png', true);

  this.game.load.spritesheet('spike', 'images/newspikes.png', 32, 32);

  this.game.load.audio('sfx:jump', 'audio/jump.wav');
  this.game.load.audio('sfx:food', 'audio/food.wav');
  this.game.load.audio('sfx:death', 'audio/death.wav');

  this.game.load.spritesheet('food', 'images/food_animated.png', 32, 32);


  this.game.load.spritesheet('hero', 'images/character.png', 26, 42);
  this.game.load.image('icon:food', 'images/food.png');
  this.game.load.image('icon:bfood', 'images/blackfood.png',true);

  this.game.load.image('font:numbers', 'images/numbers.png');
};

//CREATE GAME ENTITIES
PlayState.create = function () {
   this.game.add.image(0, 0, 'background');
  //this._loadLevel(this.game.cache.getJSON('level:2'));
 this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
  this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    food: this.game.add.audio('sfx:food'),
    death: this.game.add.audio('sfx:death')
  };
  this._createHud();
};



//LOAD LEVEL ELEMENTS
PlayState._loadLevel = function (data) {

  this.bgDecoration = this.game.add.group();
  this.platforms = this.game.add.group();
  this.foods = this.game.add.group();
  this.tspike = this.game.add.group();


  //spawn platforms
  data.platforms.forEach(this._spawnPlatform, this);


  this._spawnCharacters({ hero: data.hero });
  const GRAVITY = 1200;
  this.game.physics.arcade.gravity.y = GRAVITY;

  //spawn food
  data.foods.forEach(this._spawnFood, this);
  //this._spawnFood(data.food.x,data.food.y);

  this._spawnWin(data.win.x, data.win.y);

  //spawn spike
  data.tspike.forEach(this._spawntspike, this);
};

//-------------------
//SPAWN GAME ELEMENTS
//-------------------

//SPAWNS WIN CONDITION
PlayState._spawnWin = function (x, y) {
  this.win = this.bgDecoration.create(x, y, 'win');
  this.win.anchor.setTo(0.5, 1);
  this.game.physics.enable(this.win);
  this.win.body.allowGravity = false;

  this.win.y += 3;
  this.game.add.tween(this.win).to({ y: this.win.y + 6 }, 1200, Phaser.Easing.Sinusoidal.InOut).yoyo(true).loop().start();
};

//SPAWN SPIKES
PlayState._spawntspike = function (spike) {
  let sprite = this.tspike.create(spike.x, spike.y, 'spike');
  sprite.anchor.set(0.5, 0.5);
  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
}

//SPAWN FOODS 

PlayState._spawnFood = function (food) {
  let sprite = this.foods.create(food.x, food.y, 'food');
  sprite.anchor.set(0.5, 0.5);
  sprite.animations.add('jump', [0, 1], 3, true);
  sprite.animations.play('jump');
  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
}


//SPAWN FOODS
/*
PlayState._spawnFood = function (x,y) {
  this.food = this.foods.create(x, y, 'food');
  this.food.anchor.set(0.5, 0.5);
  this.food.animations.add('jump', [0, 1], 3, true);
  this.food.animations.play('jump');
  this.game.physics.enable(sprite);
  this.food.body.allowGravity = false;
}*/

//SPAWN GAME CHARACTERS
PlayState._spawnCharacters = function (data) {
  //spawn hero
  this.hero = new Hero(this.game, data.hero.x, data.hero.y);
  this.game.add.existing(this.hero);
};


//SPAWN PLATFORMS
PlayState._spawnPlatform = function (platform) {
  let sprite = this.platforms.create
    (platform.x, platform.y, platform.image);

  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
  sprite.body.immovable = true;
};



//HUD
PlayState._createHud = function () {
  const NUMBERS_STR = '0123456789X';
  this.foodFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

  let foodIcon = this.game.make.image(0, 0, 'icon:food');

  let foodScoreImg = this.game.make.image(foodIcon.x + foodIcon.width, foodIcon.height / 2, this.foodFont);
  foodScoreImg.anchor.set(0, 0.5);

  this.hud = this.game.add.group();
  this.hud.add(foodIcon);
  this.hud.position.set(400, 10);
  this.hud.add(foodScoreImg);
}


//-----
//INPUT
//-----
PlayState._handleInput = function () {
  if (this.keys.left.isDown) {
    this.hero.move(-1);
    //this.tset1.loadTexture('redground');
  } else if (this.keys.right.isDown) {
    this.hero.move(1);
  }
  else {
    this.hero.move(0);
  }
};



//UPDATES THE GAME
PlayState.update = function () {
  this._handleInput();
  this._handleCollisions();
  this.foodFont.text = `x${this.foodPickupCount}`;
  //spike.frame = this.alive ? 0 : 1;
  //spike.frame = 1;

};

//----------------------------------------------
//HANDLING COLLISIONS BETWEEN OBJECTS AND PLAYER
//----------------------------------------------

PlayState._handleCollisions = function () {
  this.game.physics.arcade.collide(this.hero, this.platforms);
  this.game.physics.arcade.overlap(this.hero, this.tspike, this._onHeroVsSpike, null, this);
  this.game.physics.arcade.overlap(this.hero, this.foods, this._onHeroVsFood, null, this);
  this.game.physics.arcade.overlap(this.hero, this.win, this._onHeroVsWin, null, this);

};

PlayState._onHeroVsSpike = function (hero, spike) {
  this.sfx.death.play();
  hero.die();
  hero.events.onKilled.addOnce(function () {
   this.game.state.restart(true, false, {level: this.level});
  }, this);
  //spike.frame = this.alive ? 0 : 1;
  //spike.frame = 1;
  //this.food.loadTexture('newspike',1);
  this.win.loadTexture('redwin');
  

  //this.platform.children.iterate((child) =>{
    //child.loadTexture('reground');
  //} )

  //this.platform.loadTexture('redground');
  //this.foodIcon.loadTexture('bfood');
  //win works but not the other ones examine it

};

PlayState._onHeroVsFood = function (hero, food) {
  this.sfx.food.play();
  food.kill();
  this.foodPickupCount++;

};

PlayState._onHeroVsWin = function (hero, win) {
  this.game.state.restart(true, false, { level: this.level + 1 });
};



//LOAD
window.onload = function () {
  let game = new Phaser.Game(480, 480, Phaser.AUTO, 'game');
  game.state.add('play', PlayState);
  //game.state.start('play');
  game.state.start('play', true, false, { level: 0 });
};

