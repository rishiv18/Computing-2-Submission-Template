import R from "./ramda.js";
/**
 * bento_block.js is a module to model and play "Blockus" and related games.
 * https://en.wikipedia.org/wiki/Blokus
 * @namespace bento_block
 * @author A. Rishi Viswanath
 * @version 05/2025
 */

// Game state
let currentScreen = 'player-selection-screen';
let gameBoard = [];
let currentPlayer = 1;

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    initializeGameBoard();
    setupEventListeners();
});

// Function to switch between screens
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    }
}

// Function to start the game
function startGame() {
    showScreen('game-screen');
}

// Function to go back to player selection
function backToPlayerSelection() {
    showScreen('player-selection-screen');
}

// Show help dialog
function showHelp() {
    alert('Welcome to Bento Blocks!\n\nThis is a Blokus-inspired puzzle game where players take turns placing colorful pieces on the board.\n\nClick the block icon to start playing!');
}

// Export functions for global access
window.startGame = startGame;
window.backToPlayerSelection = backToPlayerSelection;
window.showScreen = showScreen;