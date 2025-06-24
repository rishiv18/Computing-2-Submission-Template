/**
 * BentoBlocks.js - Core game logic module for Bento Blocks (Blockus-style game)
 * 
 * This module defines pure functions for representing and playing Bento Blocks
 * in pure JavaScript. The module exposes pure functions in its API that act
 * on a game board object, following the same pattern as Zombie Siege.
 * 
 * @author Bento Blocks Game
 * @version 1.0.0
 */
console.log("Loading bento_blocks.js...");
(function(global) {
    'use strict';

    /**
     * BentoBlocks namespace - Core game logic module
     */
    const BentoBlocks = {};

    // Game Constants
    const BOARD_SIZE = 20;
    const PLAYERS = {
        PLAYER_1: 1,
        PLAYER_2: 2,
        PLAYER_3: 3,
        PLAYER_4: 4
    };

    const GAME_STATUS = {
        WAITING: 'waiting',
        IN_PROGRESS: 'in_progress',
        FINISHED: 'finished'
    };

    // Predefined piece shapes (as coordinate arrays)
    const PIECE_SHAPES = {
        // Single block
        'I1': [[0, 0]],
        
        // Two blocks
        'I2': [[0, 0], [1, 0]],
        
        // Three blocks
        'I3': [[0, 0], [1, 0], [2, 0]],
        'L3': [[0, 0], [1, 0], [0, 1]],
        
        // Four blocks
        'I4': [[0, 0], [1, 0], [2, 0], [3, 0]],
        'L4': [[0, 0], [1, 0], [2, 0], [0, 1]],
        'O4': [[0, 0], [1, 0], [0, 1], [1, 1]],
        'S4': [[0, 0], [1, 0], [1, 1], [2, 1]],
        'T4': [[0, 0], [1, 0], [2, 0], [1, 1]],
        
        // Five blocks
        'I5': [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
        'L5': [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1]],
        'N5': [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]],
        'P5': [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
        'T5': [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
        'U5': [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
        'V5': [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
        'W5': [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
        'X5': [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
        'Y5': [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]],
        'Z5': [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
        'F5': [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]
    };

    /**
     * Creates a new empty game board
     * @returns {Object} Game board object
     */
    BentoBlocks.createBoard = function() {
        const board = {
            grid: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)),
            size: BOARD_SIZE,
            players: [
                { id: PLAYERS.PLAYER_1, score: 0, pieces: getAllPieces(), color: 'red' },
                { id: PLAYERS.PLAYER_2, score: 0, pieces: getAllPieces(), color: 'blue' },
                { id: PLAYERS.PLAYER_3, score: 0, pieces: getAllPieces(), color: 'yellow' },
                { id: PLAYERS.PLAYER_4, score: 0, pieces: getAllPieces(), color: 'purple' }
            ],
            currentPlayer: PLAYERS.PLAYER_1,
            status: GAME_STATUS.WAITING,
            moveHistory: [],
            lastMove: null
        };
        
        return Object.freeze(board);
    };

    /**
     * Gets all available pieces for a player
     * @returns {Array} Array of piece objects
     */
    function getAllPieces() {
        return Object.keys(PIECE_SHAPES).map(shapeKey => ({
            id: shapeKey,
            shape: PIECE_SHAPES[shapeKey],
            used: false,
            rotation: 0,
            flipped: false
        }));
    }

    /**
     * Starts a new game
     * @param {Object} board - Game board object
     * @param {number} playerCount - Number of players (2-4)
     * @returns {Object} Updated board object
     */
    BentoBlocks.startGame = function(board, playerCount = 4) {
        if (!board || playerCount < 2 || playerCount > 4) {
            throw new Error('Invalid board or player count');
        }

        const newBoard = {
            ...board,
            players: board.players.slice(0, playerCount),
            currentPlayer: PLAYERS.PLAYER_1,
            status: GAME_STATUS.IN_PROGRESS
        };

        return Object.freeze(newBoard);
    };

    /**
     * Checks if a position is valid on the board
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     * @param {Object} board - Game board object
     * @returns {boolean} True if position is valid
     */
    BentoBlocks.isValidPosition = function(row, col, board) {
        return row >= 0 && row < board.size && col >= 0 && col < board.size;
    };

    /**
     * Checks if a cell is empty
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     * @param {Object} board - Game board object
     * @returns {boolean} True if cell is empty
     */
    BentoBlocks.isCellEmpty = function(row, col, board) {
        if (!BentoBlocks.isValidPosition(row, col, board)) {
            return false;
        }
        return board.grid[row][col] === 0;
    };

    /**
     * Rotates a piece shape 90 degrees clockwise
     * @param {Array} shape - Array of coordinate pairs
     * @returns {Array} Rotated shape coordinates
     */
    BentoBlocks.rotatePiece = function(shape) {
        // Rotate 90 degrees clockwise: (x, y) -> (y, -x)
        const rotated = shape.map(([x, y]) => [y, -x]);
        
        // Normalize to ensure all coordinates are positive
        const minX = Math.min(...rotated.map(([x, y]) => x));
        const minY = Math.min(...rotated.map(([x, y]) => y));
        
        return rotated.map(([x, y]) => [x - minX, y - minY]);
    };

    /**
     * Flips a piece shape horizontally
     * @param {Array} shape - Array of coordinate pairs
     * @returns {Array} Flipped shape coordinates
     */
    BentoBlocks.flipPiece = function(shape) {
        // Flip horizontally: (x, y) -> (-x, y)
        const flipped = shape.map(([x, y]) => [-x, y]);
        
        // Normalize to ensure all coordinates are positive
        const minX = Math.min(...flipped.map(([x, y]) => x));
        const minY = Math.min(...flipped.map(([x, y]) => y));
        
        return flipped.map(([x, y]) => [x - minX, y - minY]);
    };

    /**
     * Gets the transformed shape of a piece
     * @param {Object} piece - Piece object
     * @returns {Array} Transformed shape coordinates
     */
    BentoBlocks.getTransformedShape = function(piece) {
        let shape = [...piece.shape];
        
        // Apply rotations
        for (let i = 0; i < piece.rotation; i++) {
            shape = BentoBlocks.rotatePiece(shape);
        }
        
        // Apply flip if needed
        if (piece.flipped) {
            shape = BentoBlocks.flipPiece(shape);
        }
        
        return shape;
    };

    /**
     * Checks if a piece can be placed at a specific position
     * @param {Object} board - Game board object
     * @param {Object} piece - Piece object
     * @param {number} row - Starting row position
     * @param {number} col - Starting column position
     * @param {number} playerId - Player ID placing the piece
     * @returns {boolean} True if placement is valid
     */
    BentoBlocks.canPlacePiece = function(board, piece, row, col, playerId) {
        if (piece.used) {
            return false;
        }

        const shape = BentoBlocks.getTransformedShape(piece);
        const player = board.players.find(p => p.id === playerId);
        
        if (!player) {
            return false;
        }

        // Check if all cells are empty and within bounds
        for (const [dx, dy] of shape) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            if (!BentoBlocks.isValidPosition(newRow, newCol, board) || 
                !BentoBlocks.isCellEmpty(newRow, newCol, board)) {
                return false;
            }
        }

        // Check placement rules
        return BentoBlocks.isValidPlacement(board, shape, row, col, playerId);
    };

    /**
     * Validates piece placement according to game rules
     * @param {Object} board - Game board object
     * @param {Array} shape - Piece shape coordinates
     * @param {number} row - Starting row position
     * @param {number} col - Starting column position
     * @param {number} playerId - Player ID placing the piece
     * @returns {boolean} True if placement follows rules
     */
    BentoBlocks.isValidPlacement = function(board, shape, row, col, playerId) {
        const player = board.players.find(p => p.id === playerId);
        const placedPieces = player.pieces.filter(p => p.used);
        
        // First piece must touch a corner
        if (placedPieces.length === 0) {
            return BentoBlocks.touchesCorner(shape, row, col, board);
        }

        let touchesCorner = false;
        let touchesEdge = false;

        // Check each cell of the piece
        for (const [dx, dy] of shape) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            // Check if touches corner of same player's piece
            if (BentoBlocks.touchesPlayerCorner(newRow, newCol, board, playerId)) {
                touchesCorner = true;
            }
            
            // Check if touches edge of same player's piece (invalid)
            if (BentoBlocks.touchesPlayerEdge(newRow, newCol, board, playerId)) {
                touchesEdge = true;
            }
        }

        return touchesCorner && !touchesEdge;
    };

    /**
     * Checks if piece touches a corner of the board
     * @param {Array} shape - Piece shape coordinates
     * @param {number} row - Starting row position
     * @param {number} col - Starting column position
     * @param {Object} board - Game board object
     * @returns {boolean} True if touches corner
     */
    BentoBlocks.touchesCorner = function(shape, row, col, board) {
        const corners = [[0, 0], [0, board.size - 1], [board.size - 1, 0], [board.size - 1, board.size - 1]];
        
        for (const [dx, dy] of shape) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            for (const [cRow, cCol] of corners) {
                if (newRow === cRow && newCol === cCol) {
                    return true;
                }
            }
        }
        
        return false;
    };

    /**
     * Checks if position touches corner of player's existing pieces
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     * @param {Object} board - Game board object
     * @param {number} playerId - Player ID
     * @returns {boolean} True if touches player's corner
     */
    BentoBlocks.touchesPlayerCorner = function(row, col, board, playerId) {
        const corners = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dx, dy] of corners) {
            const checkRow = row + dx;
            const checkCol = col + dy;
            
            if (BentoBlocks.isValidPosition(checkRow, checkCol, board) &&
                board.grid[checkRow][checkCol] === playerId) {
                return true;
            }
        }
        
        return false;
    };

    /**
     * Checks if position touches edge of player's existing pieces
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     * @param {Object} board - Game board object
     * @param {number} playerId - Player ID
     * @returns {boolean} True if touches player's edge
     */
    BentoBlocks.touchesPlayerEdge = function(row, col, board, playerId) {
        const edges = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dx, dy] of edges) {
            const checkRow = row + dx;
            const checkCol = col + dy;
            
            if (BentoBlocks.isValidPosition(checkRow, checkCol, board) &&
                board.grid[checkRow][checkCol] === playerId) {
                return true;
            }
        }
        
        return false;
    };

    /**
     * Places a piece on the board
     * @param {Object} board - Game board object
     * @param {Object} piece - Piece object
     * @param {number} row - Starting row position
     * @param {number} col - Starting column position
     * @param {number} playerId - Player ID placing the piece
     * @returns {Object} Updated board object
     */
    BentoBlocks.placePiece = function(board, piece, row, col, playerId) {
        if (!BentoBlocks.canPlacePiece(board, piece, row, col, playerId)) {
            throw new Error('Invalid piece placement');
        }

        const shape = BentoBlocks.getTransformedShape(piece);
        const newGrid = board.grid.map(row => [...row]);
        
        // Place piece on grid
        for (const [dx, dy] of shape) {
            newGrid[row + dx][col + dy] = playerId;
        }

        // Update player data
        const newPlayers = board.players.map(player => {
            if (player.id === playerId) {
                const newPieces = player.pieces.map(p => 
                    p.id === piece.id ? { ...p, used: true } : p
                );
                return {
                    ...player,
                    pieces: newPieces,
                    score: player.score + shape.length
                };
            }
            return player;
        });

        // Create move record
        const move = {
            playerId,
            pieceId: piece.id,
            position: [row, col],
            shape: shape,
            timestamp: Date.now()
        };

        // Update game state
        const newBoard = {
            ...board,
            grid: newGrid,
            players: newPlayers,
            moveHistory: [...board.moveHistory, move],
            lastMove: move,
            currentPlayer: BentoBlocks.getNextPlayer(board, playerId)
        };

        return Object.freeze(newBoard);
    };

    /**
     * Gets the next player in turn order
     * @param {Object} board - Game board object
     * @param {number} currentPlayerId - Current player ID
     * @returns {number} Next player ID
     */
    BentoBlocks.getNextPlayer = function(board, currentPlayerId) {
        const playerIds = board.players.map(p => p.id);
        const currentIndex = playerIds.indexOf(currentPlayerId);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        return playerIds[nextIndex];
    };

    /**
     * Checks if a player can make any moves
     * @param {Object} board - Game board object
     * @param {number} playerId - Player ID to check
     * @returns {boolean} True if player can move
     */
    BentoBlocks.canPlayerMove = function(board, playerId) {
        const player = board.players.find(p => p.id === playerId);
        if (!player) return false;

        const availablePieces = player.pieces.filter(p => !p.used);
        
        for (const piece of availablePieces) {
            // Try all rotations and flips
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flipped = 0; flipped < 2; flipped++) {
                    const testPiece = {
                        ...piece,
                        rotation,
                        flipped: flipped === 1
                    };
                    
                    // Try all board positions
                    for (let row = 0; row < board.size; row++) {
                        for (let col = 0; col < board.size; col++) {
                            if (BentoBlocks.canPlacePiece(board, testPiece, row, col, playerId)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    };

    /**
     * Checks if the game is over
     * @param {Object} board - Game board object
     * @returns {boolean} True if game is over
     */
    BentoBlocks.isGameOver = function(board) {
        if (board.status !== GAME_STATUS.IN_PROGRESS) {
            return board.status === GAME_STATUS.FINISHED;
        }

        // Game is over if no players can move
        for (const player of board.players) {
            if (BentoBlocks.canPlayerMove(board, player.id)) {
                return false;
            }
        }
        
        return true;
    };

    /**
     * Gets the game winner(s)
     * @param {Object} board - Game board object
     * @returns {Array} Array of winning player objects
     */
    BentoBlocks.getWinner = function(board) {
        if (!BentoBlocks.isGameOver(board)) {
            return null;
        }

        const maxScore = Math.max(...board.players.map(p => p.score));
        return board.players.filter(p => p.score === maxScore);
    };

    /**
     * Gets current game state summary
     * @param {Object} board - Game board object
     * @returns {Object} Game state summary
     */
    BentoBlocks.getGameState = function(board) {
        return {
            status: board.status,
            currentPlayer: board.currentPlayer,
            players: board.players.map(p => ({
                id: p.id,
                score: p.score,
                color: p.color,
                remainingPieces: p.pieces.filter(piece => !piece.used).length
            })),
            isGameOver: BentoBlocks.isGameOver(board),
            winner: BentoBlocks.getWinner(board),
            totalMoves: board.moveHistory.length
        };
    };

    console.log("About to export BentoBlocks...");
    console.log("BentoBlocks object:", BentoBlocks);
    console.log("typeof module:", typeof module);
    console.log("typeof window:", typeof window);

    // Export the module
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        console.log("Exporting to module.exports");
        module.exports = BentoBlocks;
    } else {
        // Browser environment
        console.log("Exporting to global window");
        global.BentoBlocks = BentoBlocks;
        console.log("After export, window.BentoBlocks:", window.BentoBlocks);
    }

    console.log("Export complete");

})(typeof window !== 'undefined' ? window : this);