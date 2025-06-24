console.log("Loading main.js...");
console.log("BentoBlocks available:", typeof BentoBlocks);

(function() {
    'use strict';

    // Game state
    let gameBoard = null;
    let selectedPiece = null;
    let currentPlayer = 1;

    // DOM elements
    let boardElement = null;
    let piecesContainer = null;
    let currentPlayerDisplay = null;
    let statusMessage = null;

    // Initialize the game when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded, initializing game...");
        initializeGame();
    });

    function initializeGame() {
        try {
            console.log("Starting game initialization...");
            
            // Get DOM elements
            boardElement = document.querySelector('.board');
            piecesContainer = document.querySelector('.pieces-grid');
            currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
            statusMessage = document.getElementById('statusMessage');

            if (!boardElement || !piecesContainer) {
                throw new Error("Required DOM elements not found");
            }

            // Create new game board
            gameBoard = BentoBlocks.createBoard();
            gameBoard = BentoBlocks.startGame(gameBoard, 4);

            console.log("Game board created:", gameBoard);

            // Initialize UI
            createBoardUI();
            createPiecesUI();
            updateDisplay();
            hideLoadingScreen();

            // Add event listeners
            addEventListeners();

            showStatusMessage("New game started! Player 1's turn.", 'success');
            console.log("Game initialization complete");

        } catch (error) {
            console.error("Failed to initialize game:", error);
            showErrorDialog("Failed to start new game. Please try again.");
        }
    }

    function createBoardUI() {
        console.log("Creating board UI...");
        boardElement.innerHTML = '';

        // Create 20x20 grid of cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click handler
                cell.addEventListener('click', () => handleBoardClick(row, col));
                
                boardElement.appendChild(cell);
            }
        }
        console.log("Board UI created successfully");
    }

    function createPiecesUI() {
        console.log("Creating pieces UI...");
        piecesContainer.innerHTML = '';

        const currentPlayerObj = gameBoard.players.find(p => p.id === currentPlayer);
        if (!currentPlayerObj) return;

        currentPlayerObj.pieces.forEach(piece => {
            const pieceElement = createPieceElement(piece);
            piecesContainer.appendChild(pieceElement);
        });

        console.log("Pieces UI created successfully");
    }

    function createPieceElement(piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = `game-piece ${piece.used ? 'used' : ''}`;
        pieceDiv.dataset.pieceId = piece.id;

        if (!piece.used) {
            pieceDiv.addEventListener('click', () => selectPiece(piece));
            pieceDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                rotatePiece(piece);
            });
            pieceDiv.addEventListener('dblclick', () => flipPiece(piece));
        }

        // Create visual representation of the piece
        const shape = BentoBlocks.getTransformedShape(piece);
        
        // Calculate grid dimensions for this piece
        const maxX = Math.max(...shape.map(([x, y]) => x)) + 1;
        const maxY = Math.max(...shape.map(([x, y]) => y)) + 1;
        
        // Set grid template
        pieceDiv.style.gridTemplateColumns = `repeat(${maxY}, 12px)`;
        pieceDiv.style.gridTemplateRows = `repeat(${maxX}, 12px)`;

        // Create blocks for each part of the piece
        shape.forEach(([x, y]) => {
            const block = document.createElement('div');
            block.className = 'piece-block';
            block.style.gridColumn = y + 1;
            block.style.gridRow = x + 1;
            pieceDiv.appendChild(block);
        });

        return pieceDiv;
    }

    function selectPiece(piece) {
        if (piece.used) return;

        console.log("Selecting piece:", piece.id);
        
        // Remove previous selection
        document.querySelectorAll('.game-piece.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new piece
        selectedPiece = piece;
        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }

        showStatusMessage(`Selected piece: ${piece.id}`, 'info');
    }

    function rotatePiece(piece) {
        if (piece.used) return;
        
        piece.rotation = (piece.rotation + 1) % 4;
        updatePiecesUI();
        console.log(`Rotated piece ${piece.id} to rotation ${piece.rotation}`);
    }

    function flipPiece(piece) {
        if (piece.used) return;
        
        piece.flipped = !piece.flipped;
        updatePiecesUI();
        console.log(`Flipped piece ${piece.id}, now flipped: ${piece.flipped}`);
    }

    function handleBoardClick(row, col) {
        if (!selectedPiece) {
            showStatusMessage("Please select a piece first", 'error');
            return;
        }

        try {
            console.log(`Attempting to place piece ${selectedPiece.id} at (${row}, ${col})`);
            
            if (BentoBlocks.canPlacePiece(gameBoard, selectedPiece, row, col, currentPlayer)) {
                // Place the piece
                gameBoard = BentoBlocks.placePiece(gameBoard, selectedPiece, row, col, currentPlayer);
                
                console.log("Piece placed successfully");
                
                // Update UI
                updateBoardDisplay();
                updatePiecesUI();
                
                // Clear selection
                selectedPiece = null;
                document.querySelectorAll('.game-piece.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Switch to next player
                currentPlayer = BentoBlocks.getNextPlayer(gameBoard, currentPlayer);
                updateDisplay();
                
                // Check if game is over
                if (BentoBlocks.isGameOver(gameBoard)) {
                    showGameOverDialog();
                } else {
                    showStatusMessage(`Player ${currentPlayer}'s turn`, 'success');
                }
                
            } else {
                showStatusMessage("Invalid placement. Try a different position.", 'error');
                console.log("Invalid piece placement");
            }
            
        } catch (error) {
            console.error("Error placing piece:", error);
            showStatusMessage("Invalid piece placement", 'error');
        }
    }

    function updateBoardDisplay() {
        const cells = document.querySelectorAll('.board-cell');
        
        cells.forEach((cell) => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const cellValue = gameBoard.grid[row][col];
            
            // Remove all player classes
            cell.classList.remove('occupied', 'player-1', 'player-2', 'player-3', 'player-4');
            
            if (cellValue > 0) {
                cell.classList.add('occupied', `player-${cellValue}`);
            }
        });
    }

    function updatePiecesUI() {
        createPiecesUI();
    }

    function updateDisplay() {
        // Update current player display
        if (currentPlayerDisplay) {
            currentPlayerDisplay.textContent = `Current Player: Player ${currentPlayer}`;
        }

        // Update scores
        gameBoard.players.forEach((player, index) => {
            const scoreElement = document.getElementById(`player${index + 1}Score`);
            if (scoreElement) {
                scoreElement.textContent = `Player ${player.id}: ${player.score}`;
            }
        });

        // Update pieces for current player
        updatePiecesUI();
    }

    function showStatusMessage(message, type = 'info') {
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type} show`;
            statusMessage.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                statusMessage.style.display = 'none';
                statusMessage.classList.remove('show');
            }, 3000);
        }
    }

    function showErrorDialog(message) {
        const errorDialog = document.getElementById('errorDialog');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorDialog && errorMessage) {
            errorMessage.textContent = message;
            errorDialog.style.display = 'block';
        }
    }

    function showGameOverDialog() {
        const gameOverModal = document.getElementById('gameOverModal');
        const finalScores = document.getElementById('finalScores');
        
        if (gameOverModal && finalScores) {
            const winners = BentoBlocks.getWinner(gameBoard);
            
            let scoresHTML = '<h3>Final Scores:</h3>';
            gameBoard.players.forEach(player => {
                const isWinner = winners.some(w => w.id === player.id);
                scoresHTML += `<div class="player-score player-${player.id} ${isWinner ? 'winner' : ''}">
                    Player ${player.id}: ${player.score} ${isWinner ? '👑' : ''}
                </div>`;
            });
            
            finalScores.innerHTML = scoresHTML;
            gameOverModal.style.display = 'block';
        }
    }

    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    function addEventListeners() {
        // New game button
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // Help button
        const helpButton = document.getElementById('helpButton');
        const helpModal = document.getElementById('helpModal');
        const closeHelpModal = document.getElementById('closeHelpModal');
        
        if (helpButton && helpModal) {
            helpButton.addEventListener('click', () => {
                helpModal.style.display = 'block';
            });
        }
        
        if (closeHelpModal && helpModal) {
            closeHelpModal.addEventListener('click', () => {
                helpModal.style.display = 'none';
            });
        }

        // Error dialog close
        const closeErrorDialog = document.getElementById('closeErrorDialog');
        const errorDialog = document.getElementById('errorDialog');
        
        if (closeErrorDialog && errorDialog) {
            closeErrorDialog.addEventListener('click', () => {
                errorDialog.style.display = 'none';
            });
        }

        // Game over modal
        const closeGameOverModal = document.getElementById('closeGameOverModal');
        const newGameButton = document.getElementById('newGameButton');
        const gameOverModal = document.getElementById('gameOverModal');
        
        if (closeGameOverModal && gameOverModal) {
            closeGameOverModal.addEventListener('click', () => {
                gameOverModal.style.display = 'none';
            });
        }
        
        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                location.reload();
            });
        }
    }

    // Expose some functions globally for debugging
    window.BentoGame = {
        gameBoard: () => gameBoard,
        selectedPiece: () => selectedPiece,
        currentPlayer: () => currentPlayer
    };

    console.log("Main.js loaded successfully");

})();