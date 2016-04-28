var PIXEL_COLOR_OFF = '#D3D3D3';
var PIXEL_COLOR_ON = '#FFFFCC';
var PIXEL_COLOR_SNAKE_HEAD = '#FFFF00';
var PIXEL_COLOR_PILL = '#0099ff';
var PIXEL_SIZE = 20;
var PIXEL_MARGIN = 1;

var MATRIX_COLOR = 'black';
var MATRIX_SIZE_X = 16;
var MATRIX_SIZE_Y = 16;

var KEY_SPACE=32;
var KEY_A=65;
var KEY_D=68;
var KEY_W=87;
var KEY_S=83;
var KEY_LEFT_1=37;
var KEY_RIGHT_1=39;
var KEY_UP_1=38;
var KEY_DOWN_1=40;
var KEY_LEFT_2=KEY_A;
var KEY_RIGHT_2=KEY_D;
var KEY_UP_2=KEY_W;
var KEY_DOWN_2=KEY_S;
var KEY_1=49;
var KEY_2=50;
var KEY_3=51;
var KEY_4=52;
var KEY_5=53;

var STOP=0;
var UP=1;
var RIGHT=2;
var DOWN=3;
var LEFT=4;

var matrixArray = [];
var snakes = [];
var pill = new Pill();

var fps = 30;

var snakeLength = 5;
var snakeSpeed = 4;

var hiScore = 0;
var jqMemory = {};
var gameLoopHolder;
var tick = 0;
var isGameOver = false;
var frequencyStart = 130;
var frequencyLimit = 300;
var level = 0;

var borders = false;
var growAmount = 2;

function fxPillEat() {
    //D
    soundEffect(587.33, 0, 0.2, "square", 0.1, 0, 0);
    //A
    soundEffect(880, 0, 0.2, "square", 0.1, 0, 0.1);
    //High D
    //soundEffect(1174.66, 0, 0.3, "square", 0.1, 0, 0.2);
}


function fxMove(f) {
    soundEffect(
        f,          //frequency
        0,           //attack
        0.15,           //decay
        "sine",  //waveform
        1,           //volume
        0,           //pan
        0,           //wait before playing
        0,           //pitch bend amount
        false,       //reverse
        0,           //random pitch range
        0,          //dissonance
        undefined,   //echo array: [delay, feedback, filter]
        undefined    //reverb array: [duration, decay, reverse?] [1,1,false]
    );
}

function fxWallHit() {
    soundEffect(
        16,          //frequency
        0,           //attack
        0.4,           //decay
        "sawtooth",  //waveform
        .8,           //volume
        0,           //pan
        0,           //wait before playing
        0,           //pitch bend amount
        false,       //reverse
        34,           //random pitch range
        20,          //dissonance
        undefined,   //echo array: [delay, feedback, filter]
        undefined    //reverb array: [duration, decay, reverse?]
    );
}

function Snake(i) {
    this.id = i;
    this.tail = [];
    this.posX = 0;
    this.posY = 0;
    this.direction = STOP;
    this.speed = 0;
    this.score = 0;
    this.accelerate = false;
    this.snakeGrowTime = snakeLength;
    this.alive = true;
};
Snake.prototype.updatePosition = function () {

    if (!this.isTimeToMove()) {
        return;
    }

    var oldPosX = this.posX;
    var oldPosY = this.posY;

    if (this.direction == LEFT) {
        this.posX --;
    } else if (this.direction == RIGHT) {
        this.posX ++;
    } else if (this.direction == UP) {
        this.posY --;
    } else if (this.direction == DOWN) {
        this.posY ++;
    }

    //border wrap
    if (!borders) borderWrap(this);

    //check collision
    if (checkCollisionWithAllSnakes(this.posX, this.posY)) {
        this.die();
    }

    if (oldPosX != this.posX || oldPosY != this.posY) {
        fxMove(this.frequency);
        this.updateTail(oldPosX, oldPosY);$

        if (this.accelerate) {
            this.speed *= 1.05;
            this.accelerate = false;
        }
    }

    //if (this.tailMustGrow()) {
    //    this.addTailPart();
    //}

};
Snake.prototype.isTimeToMove = function () {
    if (tick % (fps / this.speed) < 1) {
        return true;
    }
    return false;
};

Snake.prototype.collision = function () {
    for (s in snakes) {
        if (snakes[s].id == this.id && this.tailCollision(snakes[s].posX, snakes[s].posY)) {
            console.log(snakes[s].id, " has collision with own tail");
            return true;
        } else if (snakes[s].id != this.id && this.headCollision(snakes[s].posX, snakes[s].posY)) {
            console.log(snakes[s].id, " has collision with head from ", this.id);
            return true;
        } else if (snakes[s].id != this.id && this.tailCollision(snakes[s].posX, snakes[s].posY)) {
            console.log(snakes[s].id, " has collision with tail from ", this.id);
            return true;
        }
    }
    return false;
};

Snake.prototype.headCollision = function (x, y) {
    if (this.posX == x && this.posY == y) {
        return true;
    }
    return false;
};
Snake.prototype.tailCollision = function (x, y) {
    if (this.tail) {
        for (var i = 0; i < this.tail.length; i++) {
            //console.log(this.id, x, y);
            //console.log(this.id, this.tail[i].posX, this.tail[i].posY);
            if (this.tail[i].posX == x && this.tail[i].posY == y) {
                return true;
            }
        }
    }
    return false;
};
Snake.prototype.pillCollision = function (x, y) {
    return pill.posX == x && pill.posY == y;
};
Snake.prototype.tailMustGrow = function () {
    return this.tail.length < snakeLength-1;
};
Snake.prototype.updateTail = function (posX, posY) {
    if (this.pillCollision(this.posX, this.posY)) {
        eatPill(this);
        this.snakeGrowTime = growAmount;
        this.tail.pop();
    } else if (this.snakeGrowTime > 0) {
        //the snake gets one part longer
        this.snakeGrowTime--;
    } else {
        this.tail.pop();
    }
    this.tail.unshift({'posX': posX, 'posY': posY});
};
Snake.prototype.init = function(speed) {

    this.score = 0;
    this.frequency = frequencyStart;
    this.speed = speed;
    this.tail = [];

    this.posX = randomXPos();
    this.posY = randomYPos();

    while (hasCollision(this.posX, this.posY)) {
        this.posX = randomXPos();
        this.posY = randomYPos();
    }

};
Snake.prototype.addTailPart = function () {
    var found = false;
    var x = this.posX;
    var y = this.posY;
    var randDir;

    var randomDirections = shuffle([1,2,3,4]);

    while (!found) {

        //if we have no way to escape we delete the tail and start over in the next render cycle
        if (randomDirections.length == 0) {
            found = true;
        }

        //if we have no tail we take the head pos..
        if (this.tail.length == 0) {
            randDir = directionUpdate(x,y, randomDirections.pop());
            //..else the last part of the tail
        } else {
            randDir = directionUpdate(
                this.tail[this.tail.length-1].posX,
                this.tail[this.tail.length-1].posY,
                randomDirections.pop()
            );
        }

        if (!hasCollision(randDir.posX, randDir.posY)) {
            console.log(this.id, " add tail at ", randDir.posX, randDir.posY);
            this.tail.push({'posX': randDir.posX, 'posY': randDir.posY});
            found = true;
        }
    }
};
Snake.prototype.die = function () {
    fxWallHit();
    this.alive = false;
    //for (s in snakes) {
    //    if (snakes[s].id == this.id) {
    //        snakes.splice(s, 1);
    //    }
    //}
    console.log("snake died", this);
};

function Pill() {};
Pill.prototype.randomPos = function () {
    this.posX = randomXPos();
    this.posY = randomYPos();

    while (checkCollisionWithAllSnakes(this.posX, this.posY)) {
        console.log("pill placement collision: ", this.posX, this.posY);
        this.posX = randomXPos();
        this.posY = randomYPos();
    }
};
Pill.prototype.collision = function (x, y) {
    return this.posX == x && this.posY == y;
};

var getSnake = function (id) {
    for (i in snakes) {
        if (snakes[i].id == id) {
            return snakes[i];
        }
    }
    console.log("didn't find a snake with id " + id);
    return null;
};

var checkCollisionWithAllSnakes = function(x, y) {
    for (s in snakes) {
        if (snakes[s].collision(x, y)) {
            return true;
        }
    }
    return false;
};

var checkGameOver = function () {
    for (s in snakes) {
        if (!snakes[s].alive) {
            snakes.splice(s, 1);
        }
        if (snakes.length > 0) {
            return false;
        }
    }
    console.log("no snake left");
    gameOver();
};

var hasCollision = function (posX, posY) {
    var pc = pill.collision(posX, posY);
    var sc = checkCollisionWithAllSnakes(posX, posY);
    var bc = borderCollision(posX, posY);
    //console.log(pc, sc, bc);
    if (pc || sc || bc) {
        return true;
    } else {
        return false;
    }
};

var borderWrap = function (gameObject) {
    if (gameObject.posX > (MATRIX_SIZE_X - 1)) {
        gameObject.posX = 0;
    } else if (gameObject.posX < 0) {
        gameObject.posX = MATRIX_SIZE_X - 1;
    } else if (gameObject.posY > (MATRIX_SIZE_Y - 1)) {
        gameObject.posY = 0;
    } else if (gameObject.posY < 0) {
        gameObject.posY = MATRIX_SIZE_Y - 1;
    }
};

var borderCollision = function (x, y) {
    return (this.borderXCollision(x) || this.borderYCollision(y));
};
var borderXCollision = function (x) {
    return x > (MATRIX_SIZE_X - 1) || x < 0;
};
var borderYCollision = function (y) {
    return y > (MATRIX_SIZE_Y - 1) || y < 0;
};

var snakeStop = function () {
    for (s in snakes) {
        snakes[s].direction = STOP;
    }
};

var eatPill = function (s) {
    pill.randomPos();
    s.score = Math.round(s.score + 1000 * s.speed);
    if (hiScore < s.score) hiScore = s.score;
    s.accelerate = true;
    if (s.frequency < frequencyLimit) s.frequency++;
    fxPillEat();
    level++;
};


//TODO: update all snakes
var gameOver = function() {
    console.log("gameover");
    isGameOver = true;
    snakeStop();
    for (s in snakes) {
        snakes[s].tail = [];
    }
    stopGame();
    jqMemory['gameover'].css('visibility', 'visible');
};

var randomXPos = function() {
    return Math.floor(Math.random() * MATRIX_SIZE_X);
};

var randomYPos = function() {
    return Math.floor(Math.random() * MATRIX_SIZE_Y);
};

var directionUpdate = function(x, y, dir) {
    if (dir == 1) {
        x++;
    } else if (dir == 2) {
        x--;
    } else if (dir == 3) {
        y++;
    } else if (dir == 4) {
        y--;
    }
    return {'posX': x, 'posY': y};
};

var debugFreeze = function () {
    stopGame();
};

var shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

var createPixel = function(pixelId) {
    var pixelDiv = $(document.createElement('div'));
    pixelDiv.attr('id', 'pixel-' + pixelId);
    pixelDiv.attr('class', 'pixel');
    pixelDiv.css({'width': PIXEL_SIZE});
    pixelDiv.css({'height': PIXEL_SIZE});
    pixelDiv.css({'float': 'left'});
    pixelDiv.css({'margin': PIXEL_MARGIN});
    pixelDiv.css({'background': PIXEL_COLOR_OFF});
    return pixelDiv;
};

var setPixel = function(posX, posY, color) {
    matrixArray[posY][posX].css({'background': color});
};

var updatePosition = function() {
    for (s in snakes) {
        snakes[s].updatePosition();
    }
};

var startGame = function(noOfPlayer, initialSpeed) {

    snakes = [];
    for (i = 0; i < noOfPlayer; i++) {
        snakes.push(new Snake(i+1));
    }

    //initial snake position and movement
    for (s in snakes) {
        snakes[s].init(initialSpeed);
    }

    //initial pill position
    pill.randomPos();

    gameLoopHolder = setInterval(gameLoop, 1000 / fps); // Setup interval. Delay controlls tickrate.
};

var stopGame = function () {
    clearInterval(gameLoopHolder);
};

//TODO: rendering must be more efficient on a real LED
var renderFrame = function() {

    // clear screen
    for (var x = 0; x < MATRIX_SIZE_X; x++) {
        for (var y = 0; y < MATRIX_SIZE_Y; y++) {
            setPixel(x, y, PIXEL_COLOR_OFF);
        }
    }

    // lit the leds

    //snakes
    for (s in snakes) {
        //snake head
        setPixel(snakes[s].posX, snakes[s].posY, PIXEL_COLOR_SNAKE_HEAD);

        //snake tail
        for (var t = 0; t < snakes[s].tail.length; t++) {
            setPixel(snakes[s].tail[t].posX, snakes[s].tail[t].posY, PIXEL_COLOR_ON);
        }
    }

    //pill
    setPixel(pill.posX, pill.posY, PIXEL_COLOR_PILL)

    //update score board
    jqMemory['gameoverScore'].html("Your score is " + -1);
    jqMemory['score'].html("not impl.");
    jqMemory['hiScore'].html(hiScore);
    jqMemory['level'].html(level);

};

var gameLoop = function() {

    //update snake position
    updatePosition();

    //check for game end
    checkGameOver();

    //render frame
    renderFrame();

    //update environment
    tick++;
}

$().ready(function() {

    var body = $('body');
    var matrix = $('#matrix');
    jqMemory['score'] = $('#score');
    jqMemory['hiScore'] = $('#hi-score');
    jqMemory['level'] = $('#level');
    jqMemory['gameover'] = $('#gameover');
    jqMemory['gameoverScore'] = $('#gameover h3');
    jqMemory['restart-button'] = $('#restart-button');

    jqMemory['gameover'].css({'width': MATRIX_SIZE_X * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});
    jqMemory['gameover'].css({'height': MATRIX_SIZE_Y * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});

    // Keyup listener

    //TODO: make me pretty...
    // ..and fix the no direction bugs:
    // 1 when there is no direction and the player heads
    //   into the snake tail direction it the game is immediately over.
    // 2 when the player does a u turn before the next move tick he dies.
    //
    body.keyup(function(e) {
        switch(e.keyCode) {
            case KEY_SPACE:
                if (isGameOver) jqMemory['restart-button'].trigger('click');
                break;
            case KEY_LEFT_1:
                if (getSnake(1) != null && getSnake(1).direction != RIGHT) {
                    getSnake(1).direction = LEFT;
                }
                break;
            case KEY_RIGHT_1:
                if (getSnake(1) != null && getSnake(1).direction != LEFT) {
                    getSnake(1).direction = RIGHT;
                }
                break;
            case KEY_UP_1:
                if (getSnake(1) != null && getSnake(1).direction != DOWN) {
                    getSnake(1).direction = UP;
                }
                break;
            case KEY_DOWN_1:
                if (getSnake(1) != null && getSnake(1).direction != UP) {
                    getSnake(1).direction = DOWN;
                }
                break;
            case KEY_LEFT_2:
                if (getSnake(2) != null && getSnake(2).direction != RIGHT) {
                    getSnake(2).direction = LEFT;
                }
                break;
            case KEY_RIGHT_2:
                if (getSnake(2) != null && getSnake(2).direction != LEFT) {
                    getSnake(2).direction = RIGHT;
                }
                break;
            case KEY_UP_2:
                if (getSnake(2) != null && getSnake(2).direction != DOWN) {
                    getSnake(2).direction = UP;
                }
                break;
            case KEY_DOWN_2:
                if (getSnake(2) != null && getSnake(2).direction != UP) {
                    getSnake(2).direction = DOWN;
                }
                break;
            case KEY_1:
                startGame(1, snakeSpeed);
                break;
            case KEY_2:
                startGame(2, snakeSpeed);
                break;
            case KEY_3:
                fxMove(getSnake(1).frequency);
                break;
            case KEY_4:
                fxPillEat();
                break;
            case KEY_5:
                fxWallHit();
                break;
        }
    });

    jqMemory['restart-button'].on('click', function () {
        console.log("restart");
        jqMemory['gameover'].css('visibility', 'hidden');
        startGame(1, snakeSpeed);
        pill.randomPos()
        level = 0;
        isGameOver = false;
1    });

    //Init
    tick = 0;

    //set matrix size and color
    matrix.css({'width': MATRIX_SIZE_X * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});
    matrix.css({'height': MATRIX_SIZE_Y * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});
    matrix.css({'background': MATRIX_COLOR});

    //fill matrix with pixels
    var pixelNo = 1;
    for (var y = 0; y < MATRIX_SIZE_Y; y++) {
        for (var x = 0; x < MATRIX_SIZE_X; x++) {
            var pixelDiv = createPixel(pixelNo);
            if (!matrixArray[y]) matrixArray[y] = []
            matrixArray[y][x] = pixelDiv;
            matrix.append(pixelDiv);
            pixelNo++;
        }
    }

    //Start of the program loop
    startGame(1, snakeSpeed);

});