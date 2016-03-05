var pixelColorOff = '#D3D3D3';
var pixelColorOn = '#FFFFCC';
var pixelColorSnakeHead = '#FFFF00';
var pixelColorPill = '#0099ff';
var pixelSize = 25;
var pixelMargin = 1;

var MATRIX_COLOR = 'black';
var MATRIX_SIZE_X = 16;
var MATRIX_SIZE_Y = 16;

var matrixArray = [];

var KEY_SPACE=32;
var KEY_LEFT=37;
var KEY_RIGHT=39;
var KEY_UP=38;
var KEY_DOWN=40;

var snake = new Snake();
var pill = new Pill();

var fps = 30;

var dir = { up:false, down:false, left:false, right:false };
var speed = 8;
var accelerate = false;
var snakeLength = 16;

var score = 0;
var jqMemory = {};
var gameLoop;
var tick = 0;

var isGameOver = false;
var tailMustGrow = function () {
    return snake.tail.length < snakeLength-1;
};

function Snake() {};
Snake.prototype.coords = function () {
    console.log(this.posX, this.posY);
};
Snake.prototype.updatePosition = function () {

    if (!isTimeToMove()) {
        return;
    }

    var oldPosX = this.posX;
    var oldPosY = this.posY;

    if (dir.left) {
        this.posX --;
    } else if (dir.right) {
        this.posX ++;
    } else if (dir.up) {
        this.posY --;
    } else if (dir.down) {
        this.posY ++;
    }

    //border wrap
    borderWrap(this);

    if (oldPosX != this.posX || oldPosY != this.posY) {
        snake.updateTail(oldPosX, oldPosY);
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
    } else {
        this.tail.pop();
    }
    this.tail.unshift({'posX': posX, 'posY': posY});
};
Snake.prototype.init = function() {
    snakeStop();
    this.tail = [];

    this.posX = randomXPos();
    this.posY = randomYPos();

    while (!hasCollision(this.posX, this.posY)) {
        this.posX = randomXPos();
        this.posY = randomYPos();
    }

    //while (this.tail.length < snakeLength-1) {
    //    this.addTailPart();
    //}
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
            this.tail = [];
            found = true;
        }

        //if we have no tail we take the head pos..
        if (!this.tail || this.tail.length == 0) {
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
            if (!this.tail) this.tail = [];
            this.tail.push({'posX': randDir.posX, 'posY': randDir.posY});
            found = true;
        }
    }
};

function Pill() {};
Pill.prototype.randomPos = function () {
    this.posX = randomXPos();
    this.posY = randomYPos();

    while (snake.collision(this.posX, this.posY )) {
        this.posX = randomXPos();
        this.posY = randomYPos();
    }
};
Pill.prototype.collision = function (x, y) {
    return this.posX == x && this.posY == y;
};

var checkGameOver = function (x, y) {
    if (borderCollision(x, y)) {
        gameOver();
    } else if (snake.tailCollision(x, y)) {
        gameOver();
    }
};

var hasCollision = function (posX, posY) {
    console.log("check collision",posX, posY);
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
    dir.left=false; dir.right=false; dir.up=false; dir.down=false;
};

var isTimeToMove = function () {
    if (tick % (fps / speed) < 1) {
        console.log("t2m: tick: ", tick, "(fps:" + fps + "/speed:" + speed + ")");
        return true;
    }
    return false;
};

var eatPill = function () {
    pill.randomPos();
    score = Math.round(score + 1000 * speed);
    accelerate = true;
};

var gameOver = function() {
    isGameOver = true;
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
    pixelDiv.css({'width': pixelSize});
    pixelDiv.css({'height': pixelSize});
    pixelDiv.css({'float': 'left'});
    pixelDiv.css({'margin': pixelMargin});
    pixelDiv.css({'background': pixelColorOff});
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
            setPixel(x, y, pixelColorOff);
        }
    }

    // lit the leds

    //snake head
    setPixel(snake.posX, snake.posY, pixelColorSnakeHead);

    //snake tail
    for (var t = 0; t < snake.tail.length; t++) {
        setPixel(snake.tail[t].posX, snake.tail[t].posY, pixelColorOn);
    }

    //pill
    setPixel(pill.posX, pill.posY, pixelColorPill)

    //update score board
    jqMemory['gameoverScore'].html("Your score is " + score);
    jqMemory['score'].html(score);
    jqMemory['length'].html(snake.tail.length + 1);

    //snake.coords()
};

var main = function() {

    if (accelerate) {
        speed *= 1.1;
        accelerate = false;
    }

    //update snake position
    snake.updatePosition();
    if (tailMustGrow()) {
        snake.addTailPart();
    }

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
    jqMemory['length'] = $('#length');
    jqMemory['gameover'] = $('#gameover');
    jqMemory['gameoverScore'] = $('#gameover h3');
    jqMemory['restart-button'] = $('#restart-button');

    jqMemory['gameover'].css({'width': MATRIX_SIZE_X * (pixelSize + 2 * pixelMargin) + 'px'});
    jqMemory['gameover'].css({'height': MATRIX_SIZE_Y * (pixelSize + 2 * pixelMargin) + 'px'});

    var init = function() {

        tick = 0;

        //set matrix size and color
        matrix.css({'width': MATRIX_SIZE_X * (pixelSize + 2 * pixelMargin) + 'px'});
        matrix.css({'height': MATRIX_SIZE_Y * (pixelSize + 2 * pixelMargin) + 'px'});
        matrix.css({'background': MATRIX_COLOR});

        //fill matrix with pixels
        var pixelNo = 1;
        for (var x = 0; x < MATRIX_SIZE_X; x++) {
            for (var y = 0; y < MATRIX_SIZE_Y; y++) {
                var pixelDiv = createPixel(pixelNo);
                if (!matrixArray[x]) matrixArray[x] = []
                matrixArray[x][y] = pixelDiv;
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
        var key = e.keyCode;
        if (key==KEY_SPACE) {if (isGameOver) jqMemory['restart-button'].trigger('click');};
        if (key==KEY_LEFT) {
            if (!dir.right) {
                dir.left = true; dir.right = false; dir.up = false; dir.down = false;
            }
        };
        if (key==KEY_RIGHT) {
            if (!dir.left) {
                dir.left=false; dir.right=true; dir.up=false; dir.down=false;
            };
        }
        if (key==KEY_UP) {
            if (!dir.down) {
                dir.left = false; dir.right = false; dir.up = true; dir.down = false;
            }
        };
        if (key==KEY_DOWN) {
            if (!dir.up) {
                dir.left=false; dir.right=false; dir.up=false; dir.down=true;
            }
        };
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