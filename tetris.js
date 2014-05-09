$(window).load(function() {
/*
  Basic Tetris clone using only js, html, and css (no images involved)
  Created by Andrew Clark (https://github.com/amclark)
*/
(function() {
    /*
      Each piece is defined in a 4x4 grid using the following coordinates:
        a0, a1, a2, a3
        b0, b1, b2, b3
        c0, c1, c2, c3
        d0, d1, d2, d3
      This function initializes the boxes variable which maps the names above
      to (x, y) coordinates.
    */    
    function initBoxes() {
        boxes = {};
        for (var i = 0; i < 4; i++) {
            var row = 'abcd'.charAt(i);
            for (var j = 0; j < 4; j++) {
                boxes[row+j] = {x: j, y: i};
            }
        }
    }

    // Creates a "piece" given a color and the names of four boxes
    function getPiece(name, color, i0, i1, i2, i3) {
        var $piece = $(
            ['<div class="'+name+' piece">',
             '    <div class="'+color+' box '+i0+'"></div>',
             '    <div class="'+color+' box '+i1+'"></div>',
             '    <div class="'+color+' box '+i2+'"></div>',
             '    <div class="'+color+' box '+i3+'"></div>',
             '</div>'].join('\n'));
        $piece.data('boxes', [boxes[i0], boxes[i1], boxes[i2], boxes[i3]]);
        $piece.data('color', color);
        return $piece;
    }

    // Creates the grid that keeps track of which locations are occupied
    function initGrid() {
        grid = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];
        for (var i = 0; i < 22; i++) {
            grid.push([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        }
        grid.push([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    }

    // Used to add or remove a piece from grid (for collision detection)
    function setGrid($piece, x, y, val) {
        var locs = $piece.data('boxes');
        for (var i = 0; i < locs.length; i++) {
            grid[locs[i].y + y][locs[i].x + x] = val;
        }
    }
    
    // Check to see if this piece will collide with anything if placed at (x, y)
    function checkCollision($piece, x, y) {
        var locs = $piece.data('boxes');
        for (var i = 0; i < locs.length; i++) {
            if (grid[locs[i].y + y][locs[i].x + x] === 1) {
                return true;
            }
        }
        return false;
    }
    
    // rotates the current piece
    function rotate(direction) {
        var x = $currPiece.data('x');
        var y = $currPiece.data('y');
        var type = $currPiece.data('type');
        var state = $currPiece.data('state');
        var $piece = pieces[type][state];
        var newState = (state + pieces[type].length + direction) % pieces[type].length;
        var $newPiece = pieces[type][newState];
        setGrid($piece, x, y, 0);
        if (checkCollision($newPiece, x, y)) {
            setGrid($piece, x, y, 1);
            return false;
        }
        $currPiece.empty();
        $currPiece.append($newPiece.clone());
        $currPiece.data('state', newState);
        setGrid($newPiece, x, y, 1);
    }
    
    /*
      Gets the name for a row, top row name is long and row names get shorter as you go down,
      this is done to make it very simple to select elements in rows above any given row using
      attribute startswith selector
    */
    function rowName(y) {
        return 'abcdefghijklmnopqrstuvwxyz'.slice(0, -y);
    }
    
    // Moves a box to the given position and updates data attributes
    function positionBox($box, x, y) {
        $box.css({'top': (y*20-20) + 'px', 'left': (x*20-20) + 'px'});    
        $box.data('x', x);
        $box.data('y', y);
        $box.attr('data-row', rowName(y));
    }
    
    // Adds a single box to the board (this is called for each square of a piece after the piece lands)
    function addBox(color, x, y) {
        var $box = $('<div class="'+color+' box"></div>');
        positionBox($box, x, y);
        $board.append($box);
    }
    
    // Move a box down (called when a row below the box is removed)
    function shiftBox() {
        $box = $(this);
        positionBox($box, $box.data('x'), $box.data('y') + 1);
    }
    
    // Remove a box (called with the row containing this box is removed)
    function removeBox() {
        $(this).remove();
    }
    
    // Set the current piece in its current location and check to see if any rows can be deleted
    function setPiece() {
        var x = $currPiece.data('x');
        var y = $currPiece.data('y');
        var $piece = pieces[$currPiece.data('type')][$currPiece.data('state')];
        var locs = $piece.data('boxes');
        var i, j;
        for (i = 0; i < locs.length; i++) {
            addBox($piece.data('color'), x + locs[i].x, y + locs[i].y);
        }
        $currPiece.remove();
        $currPiece = null;
        for (i = 1; i < grid.length - 1; i++) {
            var remove = true;
            for (j = 1; j < grid[i].length - 1; j++) {
                if (grid[i][j] !== 1) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                $('[data-row="'+rowName(i)+'"]').each(removeBox);
                $('[data-row^="'+rowName(i-1)+'"]').each(shiftBox);
                for (j = i; j > 1; j--) {
                    grid[j] = grid[j-1];
                }
                grid[1] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
            }
        }
    }
    
    // Moves the current piece
    function move(dx, dy) {
        var x = $currPiece.data('x');
        var y = $currPiece.data('y');
        var i;
        var $piece = pieces[$currPiece.data('type')][$currPiece.data('state')];
        var locs = $piece.data('boxes');
        if (dx === 0 && dy === 0 && checkCollision($piece, x, y)) {
            return false;
        }
        setGrid($piece, x, y, 0);
        if (checkCollision($piece, x + dx, y + dy)) {
            setGrid($piece, x, y, 1);
            if (dy === 1) {
                if (hitBottom) {
                    setPiece();
                }
                hitBottom = !hitBottom;
            }
            return false;
        }
        x += dx;
        y += dy;
        setGrid($piece, x, y, 1);
        $currPiece.css({'top': (y*20-20) + 'px', 'left': (x*20-20) + 'px'});
        $currPiece.data('x', x);
        $currPiece.data('y', y);
        return true;
    }
    
    // Display 'Game Over' and restart button when player loses
    function gameOver() {
        var $gameOver = $('<div id="game-over">Game Over</div>');
        var $restart = $('<input id="restart" type="button" value="Restart"/>');
        $restart.click(restart);
        $gameOver.append($restart);
        $board.append($gameOver);
        clearInterval(interval);
        $currPiece = null;
        return;
    }
    
    // Clear the board and start over
    function restart() {
        $board.empty();
        initGrid();
        interval = setInterval(gameLoop, 1000);
    }
    
    // Called every second to move pieces down and add new pieces
    function gameLoop() {
        if ($currPiece === null) {
            var type = nextPieceType;
            var $piece = pieces[type][0].clone();
            nextPieceType = Math.floor(Math.random() * pieces.length);
            $nextPiece.empty();
            $nextPiece.append(pieces[nextPieceType][0].clone());
            $currPiece = $('<div/>');
            $currPiece.css({'position': 'absolute'});
            $currPiece.data('x', 4);
            $currPiece.data('y', 0);
            $currPiece.append($piece);
            $currPiece.data('type', type);
            $currPiece.data('state', 0);
            if (!move(0, 0)) {
                gameOver();
                return;
            }
            $board.append($currPiece);
        } else {
            move(0, 1);
        }
    }
    
    // Add keyboard listeners
    $(document).keydown(function (event) {
        if ($currPiece !== null) {
            var direction = 0;
            switch (event.which)
            {
                case 17: // ctrl
                case 32: // space
                    rotate(-1);
                    break;
                case 38: // up arrow
                case 87: // 'w'
                    rotate(1);
                    break;
                case 37: // left arrow
                case 65: // 'a'
                    move(-1, 0);
                    break;
                case 39: // right arrow
                case 68: // 'd'
                    move(1, 0);
                    break;
                case 40: // down arrow
                case 83: // 's'
                    move(0, 1);
                    break;
            }
        }
    });
    

    // Initialize variables
    var boxes;
    initBoxes();
    // This nested array contains the definitions of all pieces and their rotations
    var pieces = [[getPiece('O', 'yellow', 'b1', 'b2', 'c1', 'c2')],
                  [getPiece('I', 'cyan', 'b0', 'b1', 'b2', 'b3'),
                   getPiece('I-90', 'cyan', 'a2', 'b2', 'c2', 'd2')],
                  [getPiece('S', 'green', 'b1', 'b2', 'c0', 'c1'),
                   getPiece('S-90', 'green', 'a0', 'b0', 'b1', 'c1')],
                  [getPiece('Z', 'red', 'b0', 'b1', 'c1', 'c2'),
                   getPiece('Z-90', 'red', 'a2', 'b1', 'b2', 'c1')],
                  [getPiece('L', 'orange', 'b0', 'b1', 'b2', 'c0'),
                   getPiece('L-90', 'orange', 'a0', 'a1', 'b1', 'c1'),
                   getPiece('L-180', 'orange', 'b2', 'c0', 'c1', 'c2'),
                   getPiece('L-270', 'orange', 'a1', 'b1', 'c1', 'c2')],
                  [getPiece('J', 'blue', 'b0', 'b1', 'b2', 'c2'),
                   getPiece('J-90', 'blue', 'a1', 'b1', 'c0', 'c1'),
                   getPiece('J-180', 'blue', 'b0', 'c0', 'c1', 'c2'),
                   getPiece('J-270', 'blue', 'a1', 'a2', 'b1', 'c1')],
                  [getPiece('T', 'purple', 'b0', 'b1', 'b2', 'c1'),
                   getPiece('T-90', 'purple', 'a1', 'b0', 'b1', 'c1'),
                   getPiece('T-180', 'purple', 'b1', 'c0', 'c1', 'c2'),
                   getPiece('T-270', 'purple', 'a1', 'b1', 'b2', 'c1')]];
    var grid;
    initGrid();
    var $currPiece = null;
    var nextPieceType = Math.floor(Math.random() * pieces.length);
    var $board = $('#board');
    var $nextPiece = $('#next-piece');
    var hitBottom = false;
    var interval = setInterval(gameLoop, 1000);
}());
});
