// server/arcade.js — real-time, turn-based two-player games.
// Board cells store the userId who played (0 = empty). Turn alternation is
// handled by the socket layer; this module only validates moves + detects wins.

const CATALOG = [
  { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: '⭕', blurb: 'three in a row' },
  { id: 'connect4', title: 'Connect 4', icon: '🔴', blurb: 'four to win' },
  { id: 'gomoku', title: 'Five in a Row', icon: '⚫', blurb: 'get 5 in a line' },
  { id: 'battleship', title: 'Battleship', icon: '🚢', blurb: 'sink the fleet' },
  { id: 'pictionary', title: 'Pictionary', icon: '🎨', blurb: 'draw & guess' },
  { id: 'memory', title: '🃏 Memory match', icon: '🃏', blurb: 'flip & find pairs' },
  { id: 'dotsandboxes', title: '⬜ Dots & boxes', icon: '⬜', blurb: 'claim the boxes' },
  { id: 'reversi', title: '⚫ Reversi', icon: '⚫', blurb: 'flip to dominate' },
];

const WORDS = [
  'pizza', 'sunflower', 'rainbow', 'guitar', 'airplane', 'cat', 'heart', 'beach', 'coffee',
  'snowman', 'robot', 'butterfly', 'mountain', 'rocket', 'ice cream', 'umbrella', 'dragon',
  'cactus', 'moon', 'star', 'flower', 'dog', 'tree', 'house', 'car', 'sun', 'fish', 'bird',
  'boat', 'cake', 'crown', 'ghost', 'apple', 'banana', 'balloon', 'clock', 'ladder',
  'lighthouse', 'octopus', 'penguin', 'volcano', 'windmill', 'anchor', 'campfire', 'telescope',
  'hammock', 'jellyfish', 'unicorn', 'snail', 'mushroom', 'kite', 'donut', 'strawberry',
  'cloud', 'snowflake', 'spider', 'turtle', 'castle', 'bridge', 'rose',
];
function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function title(game) {
  return (CATALOG.find((g) => g.id === game) || {}).title || 'Game';
}

function newState(game) {
  if (game === 'tictactoe') return { board: Array(9).fill(0) };
  if (game === 'connect4') return { cols: 7, rows: 6, board: Array(42).fill(0) };
  if (game === 'gomoku') return { size: 9, board: Array(81).fill(0) };
  if (game === 'battleship')
    return { size: 8, ships: { 1: genFleet(8), 2: genFleet(8) }, shots: { 1: [], 2: [] } };
  if (game === 'pictionary')
    return { word: randomWord(), drawer: null, strokes: [], guesses: [], solved: false };
  if (game === 'memory') return newMemory();
  if (game === 'dotsandboxes') return newDots();
  if (game === 'reversi') return newReversi();
  throw new Error('unknown game');
}

function applyMove(game, state, move, playerId) {
  if (game === 'tictactoe') return tttMove(state, move, playerId);
  if (game === 'connect4') return c4Move(state, move, playerId);
  if (game === 'gomoku') return gomokuMove(state, move, playerId);
  if (game === 'battleship') return battleshipMove(state, move, playerId);
  if (game === 'memory') return memoryMove(state, move, playerId);
  if (game === 'dotsandboxes') return dotsMove(state, move, playerId);
  if (game === 'reversi') return reversiMove(state, move, playerId);
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

// ── Memory match (Concentration) ──
// 8 pairs (16 cards). Deterministic shuffle (NO Math.random): a fixed interleave
// permutation applied to the sorted pair list.
const MEMORY_FACES = ['🍓', '🌙', '⭐', '🌈', '🐱', '🎸', '🚀', '🌸'];
// A fixed permutation of 0..15 chosen so pairs are spread out (deterministic).
const MEMORY_PERM = [0, 8, 3, 11, 6, 14, 1, 9, 4, 12, 7, 15, 2, 10, 5, 13];
function newMemory() {
  // sorted deck: face f at slots 2f and 2f+1, then permuted by MEMORY_PERM
  const sorted = [];
  for (let f = 0; f < MEMORY_FACES.length; f++) {
    sorted.push(MEMORY_FACES[f], MEMORY_FACES[f]);
  }
  const cards = MEMORY_PERM.map((p) => sorted[p]);
  return {
    cards, // 16 face strings, fixed
    matched: [], // indices that have been matched
    pending: [], // 0,1, or 2 currently face-up unmatched indices
    scores: { 1: 0, 2: 0 },
  };
}
function memoryMove(state, idx, playerId) {
  idx = Number(idx);
  const other = playerId === 1 ? 2 : 1;
  const cards = state.cards;
  const n = cards.length;
  if (idx < 0 || idx >= n) throw new Error('invalid move');
  let matched = state.matched.slice();
  let pending = state.pending.slice();
  const scores = { 1: state.scores[1], 2: state.scores[2] };

  // If two non-matching cards are still face-up from a previous turn, clear them
  // first (this is the start of the new player's selection).
  if (pending.length === 2) pending = [];

  if (matched.includes(idx) || pending.includes(idx)) throw new Error('invalid move');

  if (pending.length === 0) {
    // reveal first card of the pair; same player keeps the turn to pick the second
    pending = [idx];
    return {
      state: { ...state, matched, pending, scores },
      done: false,
      winner: null,
      turnAgain: true,
    };
  }

  // pending.length === 1 → this is the second card
  const first = pending[0];
  pending = [first, idx];
  if (cards[first] === cards[idx]) {
    // match! score and keep going
    matched = matched.concat([first, idx]);
    scores[playerId] += 1;
    pending = [];
    const done = matched.length >= n;
    let winner = null;
    if (done) winner = scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2;
    return {
      state: { ...state, matched, pending, scores },
      done,
      winner,
      turnAgain: !done,
    };
  }
  // no match: leave both face-up (so opponent can see) and pass the turn
  return {
    state: { ...state, matched, pending, scores },
    done: false,
    winner: null,
    turnAgain: false,
  };
}

// ── Dots & boxes ── 4x4 dots → 3x3 boxes.
// Edges: horizontal and vertical segments between adjacent dots.
// Edge ids: horizontals first (rows 0..GRID, cols 0..GRID-1), then verticals
// (rows 0..GRID-1, cols 0..GRID). GRID = number of boxes per side = 3.
const DB_GRID = 3;
const DB_H = (DB_GRID + 1) * DB_GRID; // 12 horizontal edges
const DB_V = DB_GRID * (DB_GRID + 1); // 12 vertical edges
const DB_EDGES = DB_H + DB_V; // 24 total
function dbTopEdge(br, bc) {
  return br * DB_GRID + bc;
}
function dbBottomEdge(br, bc) {
  return (br + 1) * DB_GRID + bc;
}
function dbLeftEdge(br, bc) {
  return DB_H + br * (DB_GRID + 1) + bc;
}
function dbRightEdge(br, bc) {
  return DB_H + br * (DB_GRID + 1) + (bc + 1);
}
function newDots() {
  return {
    grid: DB_GRID,
    edges: Array(DB_EDGES).fill(0), // 0 = undrawn, else playerId who drew it
    boxes: Array(DB_GRID * DB_GRID).fill(0), // 0 = unclaimed, else owner
    scores: { 1: 0, 2: 0 },
  };
}
function dotsMove(state, edge, playerId) {
  edge = Number(edge);
  if (edge < 0 || edge >= DB_EDGES) throw new Error('invalid move');
  const edges = state.edges.slice();
  if (edges[edge] !== 0) throw new Error('edge taken');
  edges[edge] = playerId;
  const boxes = state.boxes.slice();
  const scores = { 1: state.scores[1], 2: state.scores[2] };
  let claimed = 0;
  for (let br = 0; br < DB_GRID; br++) {
    for (let bc = 0; bc < DB_GRID; bc++) {
      const bi = br * DB_GRID + bc;
      if (boxes[bi] !== 0) continue;
      if (
        edges[dbTopEdge(br, bc)] &&
        edges[dbBottomEdge(br, bc)] &&
        edges[dbLeftEdge(br, bc)] &&
        edges[dbRightEdge(br, bc)]
      ) {
        boxes[bi] = playerId;
        scores[playerId] += 1;
        claimed++;
      }
    }
  }
  const done = boxes.every((b) => b !== 0);
  let winner = null;
  if (done) winner = scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2;
  return {
    state: { ...state, edges, boxes, scores },
    done,
    winner,
    // completing at least one box → go again (standard rule)
    turnAgain: !done && claimed > 0,
  };
}

// ── Reversi / Othello ── 6x6 board. board[i] ∈ {0 empty,1,2}. index = r*6+c.
const RV_SIZE = 6;
const RV_DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];
function newReversi() {
  const board = Array(RV_SIZE * RV_SIZE).fill(0);
  const m = RV_SIZE / 2; // 3
  // standard initial four discs in the centre
  board[(m - 1) * RV_SIZE + (m - 1)] = 2; // (2,2)
  board[(m - 1) * RV_SIZE + m] = 1; // (2,3)
  board[m * RV_SIZE + (m - 1)] = 1; // (3,2)
  board[m * RV_SIZE + m] = 2; // (3,3)
  return { size: RV_SIZE, board, last: null };
}
// returns array of opponent cells that would flip if `player` plays at idx (empty)
function rvFlips(board, idx, player) {
  const opp = player === 1 ? 2 : 1;
  if (board[idx] !== 0) return [];
  const r0 = Math.floor(idx / RV_SIZE);
  const c0 = idx % RV_SIZE;
  const out = [];
  for (const [dr, dc] of RV_DIRS) {
    let r = r0 + dr;
    let c = c0 + dc;
    const line = [];
    while (r >= 0 && r < RV_SIZE && c >= 0 && c < RV_SIZE && board[r * RV_SIZE + c] === opp) {
      line.push(r * RV_SIZE + c);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < RV_SIZE && c >= 0 && c < RV_SIZE && board[r * RV_SIZE + c] === player) {
      out.push(...line);
    }
  }
  return out;
}
function rvHasMove(board, player) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0 && rvFlips(board, i, player).length > 0) return true;
  }
  return false;
}
function rvResult(board) {
  let a = 0;
  let b = 0;
  for (const v of board) {
    if (v === 1) a++;
    else if (v === 2) b++;
  }
  const winner = a === b ? 0 : a > b ? 1 : 2;
  return { winner };
}
function reversiMove(state, idx, playerId) {
  idx = Number(idx);
  const board = state.board.slice();
  if (idx < 0 || idx >= board.length || board[idx] !== 0) throw new Error('invalid move');
  const flips = rvFlips(board, idx, playerId);
  if (flips.length === 0) throw new Error('no flips');
  board[idx] = playerId;
  for (const f of flips) board[f] = playerId;

  const opp = playerId === 1 ? 2 : 1;
  const full = board.every((v) => v !== 0);
  if (full) {
    return { state: { size: RV_SIZE, board, last: idx }, done: true, winner: rvResult(board).winner };
  }
  const oppCanMove = rvHasMove(board, opp);
  const meCanMove = rvHasMove(board, playerId);
  if (!oppCanMove && !meCanMove) {
    // neither side can move → game over
    return { state: { size: RV_SIZE, board, last: idx }, done: true, winner: rvResult(board).winner };
  }
  // opponent passes when they have no legal move → current player keeps the turn
  const turnAgain = !oppCanMove;
  return { state: { size: RV_SIZE, board, last: idx }, done: false, winner: null, turnAgain };
}

function normGuess(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = { CATALOG, title, newState, applyMove, normGuess };
