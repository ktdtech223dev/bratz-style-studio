// server/arcade.js — real-time, turn-based two-player games.
// Board cells store the userId who played (0 = empty). Turn alternation is
// handled by the socket layer; this module only validates moves + detects wins.

const CATALOG = [
  { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: '⭕', blurb: 'three in a row' },
  { id: 'connect4', title: 'Connect 4', icon: '🔴', blurb: 'four to win' },
  { id: 'gomoku', title: 'Five in a Row', icon: '⚫', blurb: 'get 5 in a line' },
  { id: 'battleship', title: 'Battleship', icon: '🚢', blurb: 'sink the fleet' },
];

function title(game) {
  return (CATALOG.find((g) => g.id === game) || {}).title || 'Game';
}

function newState(game) {
  if (game === 'tictactoe') return { board: Array(9).fill(0) };
  if (game === 'connect4') return { cols: 7, rows: 6, board: Array(42).fill(0) };
  if (game === 'gomoku') return { size: 9, board: Array(81).fill(0) };
  if (game === 'battleship')
    return { size: 8, ships: { 1: genFleet(8), 2: genFleet(8) }, shots: { 1: [], 2: [] } };
  throw new Error('unknown game');
}

function applyMove(game, state, move, playerId) {
  if (game === 'tictactoe') return tttMove(state, move, playerId);
  if (game === 'connect4') return c4Move(state, move, playerId);
  if (game === 'gomoku') return gomokuMove(state, move, playerId);
  if (game === 'battleship') return battleshipMove(state, move, playerId);
  throw new Error('unknown game');
}

// Generic "n-in-a-row through (col,row)" check on a row-major board.
function nInARow(at, cols, rows, col, row, p, need) {
  const dirs = [
    [1, 0], [0, 1], [1, 1], [1, -1],
  ];
  for (const [dc, dr] of dirs) {
    const cells = [row * cols + col];
    for (const s of [1, -1]) {
      let c = col + dc * s;
      let r = row + dr * s;
      while (c >= 0 && c < cols && r >= 0 && r < rows && at(c, r) === p) {
        cells.push(r * cols + c);
        c += dc * s;
        r += dr * s;
      }
    }
    if (cells.length >= need) return cells;
  }
  return null;
}

// ── Gomoku (five in a row) ── row-major, index = row*size + col
function gomokuMove(state, idx, playerId) {
  idx = Number(idx);
  const { size } = state;
  const board = state.board.slice();
  if (idx < 0 || idx >= size * size || board[idx] !== 0) throw new Error('invalid move');
  board[idx] = playerId;
  const at = (c, r) => board[r * size + c];
  const line = nInARow(at, size, size, idx % size, Math.floor(idx / size), playerId, 5);
  const full = board.every((v) => v !== 0);
  const done = !!line || full;
  return { state: { size, board, line: line || null }, done, winner: line ? playerId : done ? 0 : null };
}

// ── Battleship ── fleets auto-placed; players alternate firing one shot per turn.
function genFleet(size) {
  const ships = [];
  const occupied = new Set();
  for (const len of [4, 3, 3, 2, 2]) {
    let placed = false;
    let tries = 0;
    while (!placed && tries++ < 800) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      const cells = [];
      for (let k = 0; k < len; k++) {
        const rr = horiz ? r : r + k;
        const cc = horiz ? c + k : c;
        if (rr >= size || cc >= size) {
          cells.length = 0;
          break;
        }
        const idx = rr * size + cc;
        if (occupied.has(idx)) {
          cells.length = 0;
          break;
        }
        cells.push(idx);
      }
      if (cells.length === len) {
        cells.forEach((i) => occupied.add(i));
        ships.push(cells);
        placed = true;
      }
    }
  }
  return ships;
}
function battleshipMove(state, cell, playerId) {
  cell = Number(cell);
  const opp = playerId === 1 ? 2 : 1;
  const mine = state.shots[playerId].slice();
  if (cell < 0 || cell >= state.size * state.size || mine.includes(cell)) throw new Error('invalid shot');
  mine.push(cell);
  const shots = { ...state.shots, [playerId]: mine };
  const oppCells = state.ships[opp].flat();
  const won = oppCells.every((c) => mine.includes(c));
  return { state: { ...state, shots }, done: won, winner: won ? playerId : null };
}

// ── Tic-Tac-Toe ──
const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
function tttMove(state, idx, playerId) {
  idx = Number(idx);
  const board = state.board.slice();
  if (idx < 0 || idx > 8 || board[idx] !== 0) throw new Error('invalid move');
  board[idx] = playerId;
  let winner = null;
  let line = null;
  for (const l of TTT_LINES) {
    if (board[l[0]] && board[l[0]] === board[l[1]] && board[l[1]] === board[l[2]]) {
      winner = board[l[0]];
      line = l;
    }
  }
  const full = board.every((v) => v !== 0);
  const done = winner !== null || full;
  return { state: { board, line }, done, winner: winner ?? (done ? 0 : null) };
}

// ── Connect 4 ── index = col*rows + row, row 0 = bottom
function c4Move(state, col, playerId) {
  col = Number(col);
  const { cols, rows } = state;
  if (col < 0 || col >= cols) throw new Error('invalid column');
  const board = state.board.slice();
  let placedRow = -1;
  for (let r = 0; r < rows; r++) {
    const i = col * rows + r;
    if (board[i] === 0) {
      board[i] = playerId;
      placedRow = r;
      break;
    }
  }
  if (placedRow === -1) throw new Error('column full');
  const win = c4Win(board, cols, rows, col, placedRow, playerId);
  const full = board.every((v) => v !== 0);
  const done = !!win || full;
  return { state: { cols, rows, board, line: win || null }, done, winner: win ? playerId : done ? 0 : null };
}
function c4Win(board, cols, rows, col, row, p) {
  const idx = (c, r) => c * rows + r;
  const at = (c, r) => (c < 0 || c >= cols || r < 0 || r >= rows ? -1 : board[idx(c, r)]);
  const dirs = [
    [1, 0], [0, 1], [1, 1], [1, -1],
  ];
  for (const [dc, dr] of dirs) {
    const cells = [idx(col, row)];
    for (const s of [1, -1]) {
      let c = col + dc * s;
      let r = row + dr * s;
      while (at(c, r) === p) {
        cells.push(idx(c, r));
        c += dc * s;
        r += dr * s;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

module.exports = { CATALOG, title, newState, applyMove };
