var PIXEL_COLOR_OFF = '#D3D3D3';
var PIXEL_COLOR_ON = '#FFFFCC';
var PIXEL_COLOR_SNAKE_HEAD = '#FFFF00';
var PIXEL_COLOR_PILL = '#0099ff';
var PIXEL_SIZE = 25;
var PIXEL_MARGIN = 1;

var MATRIX_COLOR = 'black';
var MATRIX_SIZE_X = 8;
var MATRIX_SIZE_Y = 8;

var KEY_SPACE=32;
var KEY_LEFT=37;
var KEY_RIGHT=39;
var KEY_UP=38;
var KEY_DOWN=40;
var KEY_S=83;
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

var matrixArray = [];

var snake = new Snake();
var pill = new Pill();

var fps = 30;

var accelerate = false;
var snakeLength = 3;
var snakeSpeed = 3;

var score = 0;
var hiScore = 0;
var jqMemory = {};
var gameLoop;
var tick = 0;
var isGameOver = false;
var frequencyStart = 130;
var frequencyLimit = 300;

var borders = false;

var tailMustGrow = function () {
    return snake.tail.length < snakeLength-1;
};
var snakeGrowTime = 0;
var growAmount = 2;

function Snake() {
    this.tail = [];
    this.posX = 0;
    this.posY = 0;
    this.direction = STOP;
    this.speed = 0;
};
Snake.prototype.coords = function () {
    console.log(this.posX, this.posY);
};
Snake.prototype.updatePosition = function () {

    if (!isTimeToMove()) {
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

    if (oldPosX != this.posX || oldPosY != this.posY) {
        fxMove(this.frequency);
        snake.updateTail(oldPosX, oldPosY);
    }

    if (tailMustGrow()) {
        snake.addTailPart();
    }

};
Snake.prototype.collision = function (x, y) {
    if (this.headCollision(x, y) || this.tailCollision(x, y)) {
        return true;
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
Snake.prototype.updateTail = function (posX, posY) {
    if (this.pillCollision(snake.posX, snake.posY)) {
        eatPill();
        snakeGrowTime = growAmount;
        this.tail.pop();
    } else if (snakeGrowTime > 0) {
        //the snake gets one part longer
        snakeGrowTime--;
    } else {
        this.tail.pop();
    }
    this.tail.unshift({'posX': posX, 'posY': posY});
};
Snake.prototype.init = function() {

    this.frequency = frequencyStart;

    this.speed = snakeSpeed;

    this.tail = [];

    this.posX = randomXPos();
    this.posY = randomYPos();

    while (!hasCollision(this.posX, this.posY)) {
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
            this.tail.push({'posX': randDir.posX, 'posY': randDir.posY});
            found = true;
        }
    }
};

function Pill() {};
Pill.prototype.randomPos = function () {
    this.posX = randomXPos();
    this.posY = randomYPos();

    while (snake.collision(this.posX, this.posY)) {
        console.log(this.posX, this.posY);
        this.posX = randomXPos();
        this.posY = randomYPos();
    }
};
Pill.prototype.collision = function (x, y) {
    return this.posX == x && this.posY == y;
};

var checkGameOver = function (x, y) {
    if (borderCollision(x, y) || snake.tailCollision(x, y)) {
        fxWallHit();
        gameOver();
    }
};

var hasCollision = function (posX, posY) {
    if (pill.collision(posX, posY)
        || snake.collision(posX, posY)
        || borderCollision(posX, posY)
    ) {
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
    snake.direction = STOP;
};

var isTimeToMove = function () {
    if (tick % (fps / snake.speed) < 1) {
        return true;
    }
    return false;
};

var eatPill = function () {
    pill.randomPos();
    score = Math.round(score + 1000 * snake.speed);
    if (hiScore < score) hiScore = score;
    accelerate = true;
    if (snake.frequency < frequencyLimit) snake.frequency++;
    fxPillEat();
};

var gameOver = function() {
    console.log("gameover");
    isGameOver = true;
    snakeStop();
    snake.tail = [];
    clearInterval(gameLoop);
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
    clearInterval(gameLoop);
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

//TODO: rendering must be more efficient on a real LED
var renderFrame = function() {

    // clear screen
    for (var x = 0; x < MATRIX_SIZE_X; x++) {
        for (var y = 0; y < MATRIX_SIZE_Y; y++) {
            setPixel(x, y, PIXEL_COLOR_OFF);
        }
    }

    // lit the leds

    //snake head
    setPixel(snake.posX, snake.posY, PIXEL_COLOR_SNAKE_HEAD);

    //snake tail
    for (var t = 0; t < snake.tail.length; t++) {
        setPixel(snake.tail[t].posX, snake.tail[t].posY, PIXEL_COLOR_ON);
    }

    //pill
    setPixel(pill.posX, pill.posY, PIXEL_COLOR_PILL)

    //update score board
    jqMemory['gameoverScore'].html("Your score is " + score);
    jqMemory['score'].html(score);
    jqMemory['hiScore'].html(hiScore);
    jqMemory['length'].html(snake.tail.length + 1);
    jqMemory['speed'].html(snake.speed);

    //snake.coords()
};

var main = function() {

    if (accelerate) {
        snake.speed *= 1.05;
        accelerate = false;
    }

    //update snake position
    snake.updatePosition();

    //check for game end
    checkGameOver(snake.posX, snake.posY);

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
    jqMemory['length'] = $('#length');
    jqMemory['speed'] = $('#speed');
    jqMemory['gameover'] = $('#gameover');
    jqMemory['gameoverScore'] = $('#gameover h3');
    jqMemory['restart-button'] = $('#restart-button');

    jqMemory['gameover'].css({'width': MATRIX_SIZE_X * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});
    jqMemory['gameover'].css({'height': MATRIX_SIZE_Y * (PIXEL_SIZE + 2 * PIXEL_MARGIN) + 'px'});

    var init = function() {

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

        //initial snake position and movement
        snake.init();

        //initial pill position
        pill.randomPos();

    }

    // Keyup listener
    //TODO: make me pretty...
    // ..and fix the no direction bug: when there is no direction and the player heads
    // into the snake tail direction it the game is immediately over.
    //
    body.keyup(function(e) {
        switch(e.keyCode) {
            case KEY_SPACE:
                if (isGameOver) jqMemory['restart-button'].trigger('click');
                break;
            case KEY_LEFT:
                if (snake.direction != RIGHT) {
                    snake.direction = LEFT;
                }
                break;
            case KEY_RIGHT:
                if (snake.direction != LEFT) {
                    snake.direction = RIGHT;
                }
                break;
            case KEY_UP:
                if (snake.direction != DOWN) {
                    snake.direction = UP;
                }
                break;
            case KEY_DOWN:
                if (snake.direction != UP) {
                    snake.direction = DOWN;
                }
                break;
            case KEY_1:
                fxMove(snake.frequency);
                break;
            case KEY_2:
                fxPillEat();
                break;
            case KEY_3:
                fxWallHit();
                break;
        }
    });

    jqMemory['restart-button'].on('click', function () {
        console.log("restart");
        jqMemory['gameover'].css('visibility', 'hidden');
        gameLoop = setInterval(main, 1000 / fps);
        score = 0;
        snake.init();
        pill.randomPos()
        isGameOver = false;
1    });

    //Init
    init();

    //Start of the program loop
    gameLoop = setInterval(main, 1000 / fps); // Setup interval. Delay controlls tickrate.

});