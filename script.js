const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const grid = 30; // Size of each square block
const rows = 20; // Number of rows in the game
const cols = 10; // Number of columns in the game
let score = 0;
let level = 1;
let timeInSeconds = 0; // Time in seconds
let dropCounter = 0; // Counter to drop pieces
let lastTime = 0; // Last time the game was updated
let isPaused = false; // Game pause state

const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const pauseButton = document.getElementById('pause-button');

context.scale(grid, grid);

// Create an empty matrix for the game area
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

const arena = createMatrix(cols, rows);

// Colors for the different shapes
const colors = [
    null,
    '#ff6347', // Dark red
    '#ffa500', // Dark orange
    '#ffd700', // Dark yellow
    '#32cd32', // Dark green
    '#1e90ff', // Dark blue
    '#9370db', // Dark purple
    '#ff69b4', // Dark pink
    '#00ced1', // Dark turquoise
    '#8b4513', // Dark brown
    '#ff4500', // Dark red-orange
    '#d2691e'  // New color for the 5-row piece (chocolate)
];

// Tetris pieces shapes
const pieces = [
    [[1, 1, 1],
     [0, 1, 0]], // T-shape (3x2)

    [[0, 2, 2],
     [2, 2, 0]], // S-shape (2x3)

    [[3, 3, 0],
     [0, 3, 3]], // Z-shape (2x3)

    [[4, 4],
     [4, 4]], // O-shape (2x2)

    [[0, 5, 0],
     [5, 5, 5]], // T-shape (3x3)

    [[6, 0, 0],
     [6, 6, 6]], // L-shape (3x2)

    [[0, 0, 7],
     [7, 7, 7]], // J-shape (3x2)

    [[8, 8, 8, 8]], // 4-row piece (1x4)

    [[9, 9, 0],
     [0, 9, 9],
     [0, 9, 0]], // T-shape (3x3) complex

    [[10, 10],
     [10, 0],
     [10, 10]], // L-shape with offset (3x3)

    [[11, 11, 11, 11, 11]]  // 5-row piece (1x5)
];

// Create a random piece
function createPiece(type) {
    return pieces[type];
}

const player = {
    position: { x: 3, y: 0 },
    matrix: createPiece(Math.floor(Math.random() * pieces.length))
};

// Draw the matrix of the game (the shapes and the game area)
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.strokeStyle = '#000';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Merge the player's piece with the arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.position.y][x + player.position.x] = value;
            }
        });
    });
}

// Check if the player's piece collides with the arena or other pieces
function collide(arena, player) {
    const [m, o] = [player.matrix, player.position];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Drop the player's piece down
function playerDrop() {
    player.position.y++;
    if (collide(arena, player)) {
        player.position.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
        updateScore();
        updateLevel();
    }
}

// Move the player's piece left or right
function playerMove(dir) {
    player.position.x += dir;
    if (collide(arena, player)) {
        player.position.x -= dir;
    }
}

// Rotate the player's piece
function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

// Rotate the player's piece
function playerRotate() {
    const oldMatrix = player.matrix;
    player.matrix = rotate(player.matrix);
    if (collide(arena, player)) {
        player.matrix = oldMatrix;
    }
}

// Reset the player's piece to the top of the arena
function playerReset() {
    player.matrix = createPiece(Math.floor(Math.random() * pieces.length));
    player.position.y = 0;
    player.position.x = (cols / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver(); // If collision, trigger game over
    }
}

// Sweep the arena for completed rows
function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        if (arena[y].every(value => value !== 0)) {
            arena.splice(y, 1);
            arena.unshift(new Array(cols).fill(0));
            rowCount++;
            y++; // Check the same row again after the shift
        }
    }
    score += rowCount * 10; // Increase score for cleared rows
}

// Update the displayed score
function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + score;
}

// Update the displayed time in MM:SS format
function updateTime() {
    let minutes = Math.floor(timeInSeconds / 60);
    let seconds = timeInSeconds % 60;
    if (seconds < 10) {
        seconds = '0' + seconds; // Add leading zero if seconds is less than 10
    }
    document.getElementById('time').innerText = `Time: ${minutes}:${seconds}`;
}

// Update the displayed level
function updateLevel() {
    document.getElementById('level').innerText = `Level: ${level}`;
}

// Main game update loop
function update(time = 0) {
    if (isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > 1000) {
        playerDrop();
        dropCounter = 0;
        timeInSeconds++; // Increment time every second
        updateTime(); // Update time display
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.position);

    requestAnimationFrame(update);
}

// Handle keyboard input for player movement and rotation
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    }
});

// Toggle pause and resume
function togglePause() {
    if (isPaused) {
        isPaused = false;
        pauseButton.textContent = 'Pause';
        pauseButton.classList.remove('paused');
        update();
    } else {
        isPaused = true;
        pauseButton.textContent = 'Resume';
        pauseButton.classList.add('paused');
    }
}

// Restart the game by resetting the game state
function restartGame() {
    score = 0;
    level = 1;
    timeInSeconds = 0;
    updateScore();
    updateTime();
    updateLevel();

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            arena[y][x] = 0; // Clear all blocks from the arena
        }
    }

    playerReset();
    gameOverScreen.style.display = 'none';
    isPaused = false;
    update(); // Start a fresh game loop
}

// Function to trigger game over
function gameOver() {
    gameOverScreen.style.display = 'block'; // Show the Game Over screen
    finalScoreElement.innerText = 'Final Score: ' + score; // Display final score
    isPaused = true; // Pause the game
    pauseButton.textContent = 'Resume'; // Change the pause button to resume
    pauseButton.classList.add('paused'); // Make pause button red
}

// Initialize game
playerReset();
updateScore();
updateTime();
updateLevel();
update(); // Start the game loop
