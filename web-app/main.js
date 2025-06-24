/**
 * game.js - Main game controller for Bento Blocks
 * 
 * This file wraps the BentoBlocks core module in a browser-based web app.
 * It handles all UI interactions, DOM manipulation, and user input,
 * following the same pattern as Zombie Siege's browser frontend.
 * 
 * @author Bento Blocks Game
 * @version 1.0.0
 */
console.log("Loading main.js...");
console.log("BentoBlocks available:", typeof BentoBlocks);
(function() {
    'use strict';

    // Game state
    let gameBoard = null;
    let selectedPiece = null;
    let draggedElement = null;
    let gameSettings = {
        playerCount: 4,
        difficulty: 'normal'
    };

    // DOM elements
    const elements = {
        gameContainer: null,
        gameBoard: null,
        piecesContainer: null,
        gameInfo: null,
        currentPlayer: null,
        playerScore: null,
        helpButton: null,
        helpModal: null,
        gameOverModal: null,
        loadingScreen: null,
        statusMessages: null,
        errorDialog: null
    };

    // Player colors for CSS classes
    const PLAYER_COLORS = {
        1: 'player-1',
        2: 'player-2', 
        3: 'player-3',
        4: 'player-4'
    };

    /**
     * Initialize the game when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupGame);
        } else {
            setupGame();
        }
    }

    /**
     * Set up the game interface and event listeners
     */
    function setupGame() {
        try {
            // Cache DOM elements
            cacheElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize game board
            startNewGame();
            
            // Hide loading screen
            hideLoadingScreen();
            
            console.log('Bento Blocks initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            showError('Failed to initialize game. Please refresh the page.');
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    function cacheElements() {
        elements.gameContainer = document.getElementById('gameContainer');
        elements.gameBoard = document.getElementById('gameBoard');
        elements.piecesContainer = document.getElementById('piecesContainer');
        elements.gameInfo = document.getElementById('gameInfo');
        elements.currentPlayer = document.getElementById('playerIndicator');
        elements.playerScore = document.getElementById('playerScore');
        elements.helpButton = document.getElementById('helpButton');
        elements.helpModal = document.getElementById('helpModal');
        elements.gameOverModal = document.getElementById('gameOverModal');
        elements.loadingScreen = document.getElementById('loadingScreen');
        elements.statusMessages = document.getElementById('statusMessages');
        elements.errorDialog = document.getElementById('errorDialog');

        // Validate required elements
        const requiredElements = ['gameBoard', 'piecesContainer', 'currentPlayer', 'playerScore'];
        for (const elementName of requiredElements) {
            if (!elements[elementName]) {
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
    }

    /**
     * Set up event listeners for game interactions
     */
    function setupEventListeners() {
        // Help button
        if (elements.helpButton) {
            elements.helpButton.addEventListener('click', showHelpModal);
        }

        // Modal close buttons
        document.addEventListener('click', handleModalClose);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);

        // Prevent default drag behavior on images and other elements
        document.addEventListener('dragstart', (e) => e.preventDefault());

        // Game over modal buttons
        const newGameButton = document.getElementById('newGameButton');
        if (newGameButton) {
            newGameButton.addEventListener('click', startNewGame);
        }

        // Window resize handler
        window.addEventListener('resize', debounce(handleResize, 250));
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        try {
            // Create new board
            gameBoard = BentoBlocks.createBoard();
            gameBoard = BentoBlocks.startGame(gameBoard, gameSettings.playerCount);
            
            // Reset UI state
            selectedPiece = null;
            
            // Render game board
            renderBoard();
            
            // Render pieces for current player
            renderPieces();
            
            // Update game info
            updateGameInfo();
            
            // Hide game over modal if showing
            hideGameOverModal();
            
            showStatusMessage('New game started! Player 1\'s turn.');
            
        } catch (error) {
            console.error('Failed to start new game:', error);
            showError('Failed to start new game. Please try again.');
        }
    }

    /**
     * Render the game board grid
     */
    function renderBoard() {
        if (!elements.gameBoard) return;

        // Clear existing board
        elements.gameBoard.innerHTML = '';

        // Create grid cells
        for (let row = 0; row < gameBoard.size; row++) {
            for (let col = 0; col < gameBoard.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add player class if cell is occupied
                const cellValue = gameBoard.grid[row][col];
                if (cellValue !== 0) {
                    cell.classList.add('occupied', PLAYER_COLORS[cellValue]);
                }
                
                // Add click handler
                cell.addEventListener('click', () => handleCellClick(row, col));
                cell.addEventListener('mouseenter', () => handleCellHover(row, col));
                cell.addEventListener('mouseleave', () => clearPreview());
                
                elements.gameBoard.appendChild(cell);
            }
        }
    }

    /**
     * Render pieces for the current player
     */
    function renderPieces() {
        if (!elements.piecesContainer) return;

        // Clear existing pieces
        elements.piecesContainer.innerHTML = '';

        const currentPlayerData = gameBoard.players.find(p => p.id === gameBoard.currentPlayer);
        if (!currentPlayerData) return;

        // Get available pieces
        const availablePieces = currentPlayerData.pieces.filter(piece => !piece.used);

        availablePieces.forEach(piece => {
            const pieceElement = createPieceElement(piece);
            elements.piecesContainer.appendChild(pieceElement);
        });
    }

    /**
     * Create a DOM element for a game piece
     * @param {Object} piece - Piece object
     * @returns {HTMLElement} Piece DOM element
     */
    function createPieceElement(piece) {
        const container = document.createElement('div');
        container.className = 'piece';
        container.dataset.pieceId = piece.id;
        
        if (piece.used) {
            container.classList.add('used');
        }

        // Get transformed shape
        const shape = BentoBlocks.getTransformedShape(piece);
        
        // Calculate grid dimensions
        const maxX = Math.max(...shape.map(([x, y]) => x)) + 1;
        const maxY = Math.max(...shape.map(([x, y]) => y)) + 1;
        
        // Set grid template
        container.style.gridTemplateColumns = `repeat(${maxY}, 20px)`;
        container.style.gridTemplateRows = `repeat(${maxX}, 20px)`;

        // Create piece cells
        const grid = Array(maxX).fill(null).map(() => Array(maxY).fill(false));
        shape.forEach(([x, y]) => {
            grid[x][y] = true;
        });

        // Add cells to DOM
        for (let x = 0; x < maxX; x++) {
            for (let y = 0; y < maxY; y++) {
                const cell = document.createElement('div');
                if (grid[x][y]) {
                    cell.className = 'piece-cell';
                } else {
                    cell.className = 'piece-cell-empty';
                    cell.style.visibility = 'hidden';
                }
                container.appendChild(cell);
            }
        }

        // Add event listeners
        if (!piece.used) {
            container.addEventListener('click', () => selectPiece(piece));
            container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                rotatePiece(piece);
            });
            container.addEventListener('dblclick', () => flipPiece(piece));
        }

        return container;
    }

    /**
     * Handle cell click for piece placement
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     */
    function handleCellClick(row, col) {
        if (!selectedPiece || gameBoard.status !== 'in_progress') {
            return;
        }

        try {
            // Attempt to place piece
            gameBoard = BentoBlocks.placePiece(gameBoard, selectedPiece, row, col, gameBoard.currentPlayer);
            
            // Update UI
            renderBoard();
            renderPieces();
            updateGameInfo();
            
            // Clear selection
            selectedPiece = null;
            clearPieceSelection();
            clearPreview();
            
            // Check for game end
            if (BentoBlocks.isGameOver(gameBoard)) {
                endGame();
            } else {
                const currentPlayerData = gameBoard.players.find(p => p.id === gameBoard.currentPlayer);
                showStatusMessage(`Player ${gameBoard.currentPlayer}'s turn`);
            }
            
        } catch (error) {
            console.warn('Invalid piece placement:', error.message);
            showStatusMessage('Invalid placement. Try a different position.', 'warning');
        }
    }

    /**
     * Handle cell hover for piece preview
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     */
    function handleCellHover(row, col) {
        if (!selectedPiece || gameBoard.status !== 'in_progress') {
            return;
        }

        clearPreview();

        if (BentoBlocks.canPlacePiece(gameBoard, selectedPiece, row, col, gameBoard.currentPlayer)) {
            showPreview(row, col, selectedPiece);
        }
    }

    /**
     * Show piece placement preview
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {Object} piece - Piece object
     */
    function showPreview(row, col, piece) {
        const shape = BentoBlocks.getTransformedShape(piece);
        
        shape.forEach(([dx, dy]) => {
            const previewRow = row + dx;
            const previewCol = col + dy;
            
            if (BentoBlocks.isValidPosition(previewRow, previewCol, gameBoard)) {
                const cell = elements.gameBoard.children[previewRow * gameBoard.size + previewCol];
                if (cell) {
                    cell.classList.add('preview');
                }
            }
        });
    }

    /**
     * Clear piece placement preview
     */
    function clearPreview() {
        const previewCells = elements.gameBoard.querySelectorAll('.preview');
        previewCells.forEach(cell => cell.classList.remove('preview'));
    }

    /**
     * Select a piece for placement
     * @param {Object} piece - Piece object
     */
    function selectPiece(piece) {
        if (piece.used) return;

        selectedPiece = piece;
        
        // Update UI
        clearPieceSelection();
        const pieceElement = elements.piecesContainer.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }
        
        showStatusMessage(`Selected piece ${piece.id}. Click on the board to place it.`);
    }

    /**
     * Clear piece selection
     */
    function clearPieceSelection() {
        const selectedElements = elements.piecesContainer.querySelectorAll('.selected');
        selectedElements.forEach(el => el.classList.remove('selected'));
    }

    /**
     * Rotate the selected piece
     * @param {Object} piece - Piece object
     */
    function rotatePiece(piece) {
        if (piece.used) return;

        // Update piece rotation
        const playerData = gameBoard.players.find(p => p.id === gameBoard.currentPlayer);
        const pieceIndex = playerData.pieces.findIndex(p => p.id === piece.id);
        
        if (pieceIndex !== -1) {
            playerData.pieces[pieceIndex].rotation = (piece.rotation + 1) % 4;
            
            // Re-render pieces
            renderPieces();
            
            // Re-select piece if it was selected
            if (selectedPiece && selectedPiece.id === piece.id) {
                selectedPiece = playerData.pieces[pieceIndex];
                selectPiece(selectedPiece);
            }
        }
    }

    /**
     * Flip the selected piece
     * @param {Object} piece - Piece object
     */
    function flipPiece(piece) {
        if (piece.used) return;

        // Update piece flip state
        const playerData = gameBoard.players.find(p => p.id === gameBoard.currentPlayer);
        const pieceIndex = playerData.pieces.findIndex(p => p.id === piece.id);
        
        if (pieceIndex !== -1) {
            playerData.pieces[pieceIndex].flipped = !piece.flipped;
            
            // Re-render pieces
            renderPieces();
            
            // Re-select piece if it was selected
            if (selectedPiece && selectedPiece.id === piece.id) {
                selectedPiece = playerData.pieces[pieceIndex];
                selectPiece(selectedPiece);
            }
        }
    }

    /**
     * Update game information display
     */
    function updateGameInfo() {
        if (!gameBoard) return;

        const gameState = BentoBlocks.getGameState(gameBoard);
        const currentPlayerData = gameState.players.find(p => p.id === gameBoard.currentPlayer);

        if (elements.currentPlayer) {
            elements.currentPlayer.textContent = `Player ${gameBoard.currentPlayer}`;
            elements.currentPlayer.className = PLAYER_COLORS[gameBoard.currentPlayer];
        }

        if (elements.playerScore && currentPlayerData) {
            elements.playerScore.textContent = currentPlayerData.score;
        }
    }

    /**
     * End the game and show results
     */
    function endGame() {
        const gameState = BentoBlocks.getGameState(gameBoard);
        const winners = BentoBlocks.getWinner(gameBoard);
        
        if (winners && winners.length > 0) {
            if (winners.length === 1) {
                showStatusMessage(`Game Over! Player ${winners[0].id} wins with ${winners[0].score} points!`);
            } else {
                const winnerIds = winners.map(w => w.id).join(', ');
                showStatusMessage(`Game Over! Tie between players ${winnerIds}!`);
            }
        } else {
            showStatusMessage('Game Over!');
        }

        // Show game over modal
        showGameOverModal(gameState);
    }

    /**
     * Show the game over modal
     * @param {Object} gameState - Current game state
     */
    function showGameOverModal(gameState) {
        if (!elements.gameOverModal) return;

        // Update final scores
        const finalScores = document.getElementById('finalScores');
        if (finalScores) {
            finalScores.innerHTML = '';
            
            // Sort players by score
            const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
            
            sortedPlayers.forEach((player, index) => {
                const scoreElement = document.createElement('div');
                scoreElement.className = `player-score ${PLAYER_COLORS[player.id]}`;
                scoreElement.innerHTML = `
                    <span class="rank">${index + 1}.</span>
                    <span class="player">Player ${player.id}</span>
                    <span class="score">${player.score} points</span>
                `;
                finalScores.appendChild(scoreElement);
            });
        }

        elements.gameOverModal.showModal();
    }

    /**
     * Hide the game over modal
     */
    function hideGameOverModal() {
        if (elements.gameOverModal) {
            elements.gameOverModal.close();
        }
    }

    /**
     * Show the help modal
     */
    function showHelpModal() {
        if (elements.helpModal) {
            elements.helpModal.showModal();
        }
    }

    /**
     * Handle modal close events
     * @param {Event} event - Click event
     */
    function handleModalClose(event) {
        if (event.target.classList.contains('modal-close') || 
            event.target.id === 'closeHelpModal' ||
            event.target.id === 'closeGameOverModal' ||
            event.target.id === 'closeErrorDialog') {
            
            const modal = event.target.closest('dialog');
            if (modal) {
                modal.close();
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handleKeyboard(event) {
        switch (event.key) {
            case 'Escape':
                // Close modals or clear selection
                if (elements.helpModal && elements.helpModal.open) {
                    elements.helpModal.close();
                } else if (elements.gameOverModal && elements.gameOverModal.open) {
                    elements.gameOverModal.close();
                } else {
                    selectedPiece = null;
                    clearPieceSelection();
                    clearPreview();
                }
                break;
            
            case 'r':
            case 'R':
                // Rotate selected piece
                if (selectedPiece && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    rotatePiece(selectedPiece);
                }
                break;
            
            case 'f':
            case 'F':
                // Flip selected piece
                if (selectedPiece && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    flipPiece(selectedPiece);
                }
                break;
            
            case 'n':
            case 'N':
                // New game
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    startNewGame();
                }
                break;
            
            case '?':
                // Show help
                if (!event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    showHelpModal();
                }
                break;
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        // Recalculate board size if needed
        // This is mainly for responsive design adjustments
    }

    /**
     * Show a status message
     * @param {string} message - Message to show
     * @param {string} type - Message type ('info', 'warning', 'error')
     */
    function showStatusMessage(message, type = 'info') {
        if (!elements.statusMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;
        
        elements.statusMessages.appendChild(messageElement);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);

        // Also announce to screen readers
        const announcements = document.getElementById('gameAnnouncements');
        if (announcements) {
            announcements.textContent = message;
        }
    }

    /**
     * Show an error dialog
     * @param {string} message - Error message
     */
    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (elements.errorDialog) {
            elements.errorDialog.showModal();
        }
        
        console.error('Game Error:', message);
    }

    /**
     * Hide the loading screen
     */
    function hideLoadingScreen() {
        if (elements.loadingScreen) {
            elements.loadingScreen.style.display = 'none';
        }
    }

    /**
     * Debounce function to limit rapid function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize the game
    init();

    // Export for testing purposes
    if (typeof window !== 'undefined') {
        window.BentoBlocksGame = {
            startNewGame,
            getGameBoard: () => gameBoard,
            selectPiece,
            // Add other functions that need to be exposed for testing
        };
    }

})();
