// server/arcade.js — real-time, turn-based two-player games.
// Board cells store the userId who played (0 = empty). Turn alternation is
// handled by the socket layer; this module only validates moves + detects wins.

const CATALOG = [
  { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: '⭕', blurb: 'three in a row' },
  { id: 'connect4', title: 'Connect 4', icon: '🔴', blurb: 'four to win' },
];

function title(game) {
  return (CATALOG.find((g) => g.id === game) || {}).title || 'Game';
}

function newState(game) {
  if (game === 'tictactoe') return { board: Array(9).fill(0) };
  if (game === 'connect4') return { cols: 7, rows: 6, board: Array(42).fill(0) };
  throw new Error('unknown game');
}

function applyMove(game, state, move, playerId) {
  if (game === 'tictactoe') return tttMove(state, move, playerId);
  if (game === 'connect4') return c4Move(state, move, playerId);
  throw new Error('unknown game');
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
