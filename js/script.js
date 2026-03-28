// js/script.js
let MainMenu = document.getElementById("MainMenu");
let GameContainer = document.getElementById("GameContainer");
let GameBoard = document.getElementById("GameBoard");
let Controls = document.getElementById("Controls");
let TimerEl = document.getElementById("Timer");
let AttemptsLeftEl = document.getElementById("AttemptsLeft");
let CurrentDifficultyEl = document.getElementById("CurrentDifficulty");
let QuitBtn = document.getElementById("quit-game");
let EndScreen = document.getElementById("EndScreen");
let EndTitle = document.getElementById("EndTitle");
let EndStats = document.getElementById("EndStats");
let BackToMenuBtn = document.getElementById("back-to-menu");

let selectedCell = null;
let solutionBoard = [];
let puzzleBoard = [];
let cellElements = Array.from({ length: 9 }, () => Array(9).fill(null));

let timerInterval = null;
let elapsedSeconds = 0;
let attemptsLeft = 0;
let wrongAttempts = 0;
let currentDifficulty = null;
let gameActive = false;

const DIFFICULTIES = {
    easy:   { label: "Easy",   holes: 35, attempts: 6 },
    medium: { label: "Medium",   holes: 45, attempts: 4 },
    hard:   { label: "Hard", holes: 55, attempts: 3 }
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createEmptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function cloneBoard(board) {
    return board.map(row => [...row]);
}

function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
        if (board[i][col] === num) return false;
    }

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
        }
    }

    return true;
}

function solve(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

                for (let num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solve(board)) return true;
                        board[row][col] = 0;
                    }
                }

                return false;
            }
        }
    }
    return true;
}

function generateSolution() {
    let board = createEmptyBoard();
    solve(board);
    return board;
}

function createPuzzleFromSolution(solution, holes = 45) {
    let puzzle = cloneBoard(solution);
    let removed = 0;

    while (removed < holes) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removed++;
        }
    }

    return puzzle;
}

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function updateTimer() {
    TimerEl.textContent = formatTime(elapsedSeconds);
}

function updateAttempts() {
    AttemptsLeftEl.textContent = attemptsLeft;
}

function updateDifficultyLabel() {
    CurrentDifficultyEl.textContent = currentDifficulty ? currentDifficulty.label : "-";
}

function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    updateTimer();

    timerInterval = setInterval(() => {
        if (!gameActive) return;
        elapsedSeconds++;
        updateTimer();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function countNumberOnBoard(board, num) {
    let count = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === num) count++;
        }
    }
    return count;
}

function updateNumberButtons() {
    const buttons = document.querySelectorAll(".number-btn");

    buttons.forEach(btn => {
        const num = Number(btn.dataset.num);
        const count = countNumberOnBoard(puzzleBoard, num);

        if (count === 9) {
            btn.classList.add("completed");
        } else {
            btn.classList.remove("completed");
        }
    });
}

function createBoard() {
    GameBoard.innerHTML = "";
    cellElements = Array.from({ length: 9 }, () => Array(9).fill(null));

    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            let box = document.createElement("div");
            box.classList.add("box");

            for (let cellRow = 0; cellRow < 3; cellRow++) {
                for (let cellCol = 0; cellCol < 3; cellCol++) {
                    let row = boxRow * 3 + cellRow;
                    let col = boxCol * 3 + cellCol;

                    let slot = document.createElement("div");
                    slot.classList.add("slot");
                    slot.dataset.row = row;
                    slot.dataset.col = col;

                    slot.addEventListener("click", () => {
                        if (!gameActive) return;
                        if (puzzleBoard[row][col] !== 0) return;

                        if (selectedCell) {
                            selectedCell.classList.remove("selected");
                        }

                        selectedCell = slot;
                        selectedCell.classList.add("selected");
                    });

                    box.appendChild(slot);
                    cellElements[row][col] = slot;
                }
            }

            GameBoard.appendChild(box);
        }
    }
}

function createControls() {
    Controls.innerHTML = "";

    for (let i = 1; i <= 9; i++) {
        let btn = document.createElement("button");
        btn.classList.add("number-btn");
        btn.textContent = i;
        btn.dataset.num = i;

        btn.addEventListener("click", () => {
            placeNumber(i);
        });

        Controls.appendChild(btn);
    }
}

function renderBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let cell = cellElements[row][col];
            let value = board[row][col];

            cell.textContent = value === 0 ? "" : value;
            cell.classList.remove("fixed", "wrong", "correct", "selected");

            if (value !== 0) {
                cell.classList.add("fixed");
            }
        }
    }
}

function placeNumber(num) {
    if (!gameActive) return;
    if (!selectedCell) return;

    let row = Number(selectedCell.dataset.row);
    let col = Number(selectedCell.dataset.col);

    if (puzzleBoard[row][col] !== 0) return;

    selectedCell.textContent = num;

    if (solutionBoard[row][col] === num) {
        puzzleBoard[row][col] = num;
        selectedCell.classList.remove("wrong");
        selectedCell.classList.add("correct");

        selectedCell.classList.remove("selected");
        selectedCell = null;

        updateNumberButtons();
        checkWin();
    } else {
        const wrongCell = selectedCell;

        wrongCell.classList.add("wrong");

        attemptsLeft--;
        wrongAttempts++;
        updateAttempts();

        setTimeout(() => {
            if (!gameActive) return;
            wrongCell.textContent = "";
            wrongCell.classList.remove("wrong");
        }, 650);

        if (attemptsLeft <= 0) {
            setTimeout(() => {
                endGame(false);
            }, 700);
        }
    }
}

function checkWin() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (puzzleBoard[row][col] === 0) return;
        }
    }

    setTimeout(() => {
        endGame(true);
    }, 150);
}

function countFilledCells() {
    let count = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (puzzleBoard[row][col] !== 0) count++;
        }
    }
    return count;
}

function endGame(won) {
    gameActive = false;
    stopTimer();

    const statusText = won ? "You Won" : "You Lost";
    EndTitle.textContent = statusText;

    const totalAttempts = currentDifficulty.attempts;
    const usedAttempts = totalAttempts - attemptsLeft;

    EndStats.innerHTML = `
        <p><strong>Difficultly:</strong> ${currentDifficulty.label}</p>
        <p><strong>State:</strong> ${won ? "Completed" : "Without Tries"}</p>
        <p><strong>Time:</strong> ${formatTime(elapsedSeconds)}</p>
        <p><strong>Tries Used:</strong> ${usedAttempts} / ${totalAttempts}</p>
        <p><strong>Errors:</strong> ${wrongAttempts}</p>
        <p><strong>Cells Completed:</strong> ${countFilledCells()} / 81</p>
    `;

    EndScreen.classList.remove("hidden");
}

function startNewGame(difficultyKey) {
    currentDifficulty = DIFFICULTIES[difficultyKey];
    attemptsLeft = currentDifficulty.attempts;
    wrongAttempts = 0;
    selectedCell = null;
    gameActive = true;

    MainMenu.classList.add("hidden");
    GameContainer.classList.add("active");
    EndScreen.classList.add("hidden");

    solutionBoard = generateSolution();
    puzzleBoard = createPuzzleFromSolution(solutionBoard, currentDifficulty.holes);

    createBoard();
    createControls();
    renderBoard(puzzleBoard);

    updateAttempts();
    updateDifficultyLabel();
    updateNumberButtons();
    startTimer();
}

function returnToMenu() {
    gameActive = false;
    stopTimer();
    selectedCell = null;

    GameContainer.classList.remove("active");
    EndScreen.classList.add("hidden");
    MainMenu.classList.remove("hidden");
}

document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        startNewGame(btn.dataset.difficulty);
    });
});

QuitBtn.addEventListener("click", returnToMenu);
BackToMenuBtn.addEventListener("click", returnToMenu);

updateTimer();
updateAttempts();
updateDifficultyLabel();
