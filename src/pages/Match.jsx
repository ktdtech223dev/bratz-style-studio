import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PictionaryBoard from '../components/PictionaryBoard';
import { useStore } from '../store/useStore';

const TITLES = {
  tictactoe: 'Tic-Tac-Toe',
  connect4: 'Connect 4',
  gomoku: 'Five in a Row',
  battleship: 'Battleship',
  pictionary: 'Pictionary',
  memory: '🃏 Memory match',
  dotsandboxes: '⬜ Dots & boxes',
  reversi: '⚫ Reversi',
};

export default function Match() {
  const { id } = useParams();
  const mid = Number(id);
  const nav = useNavigate();
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.users);
  const matches = useStore((s) => s.matches);
  const refreshMatches = useStore((s) => s.refreshMatches);
  const emit = useStore((s) => s.emit);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  const match = matches.find((m) => m.id === mid);

  // mark "seen" once it's finished so the badge clears
  useEffect(() => {
    if (match && match.status === 'done' && me) {
      const seen = (match.seen_by || '').split(',').filter(Boolean).map(Number);
      if (!seen.includes(me.id)) emit('match:seen', { matchId: mid });
    }
  }, [match?.status, mid, me, emit]);

  if (!match) return <PageHeader title="Match" sub="loading…" />;

  const colorOf = (uid) => users.find((u) => u.id === uid)?.color || '#b8a9e8';
  const nameOf = (uid) => users.find((u) => u.id === uid)?.display_name || 'Them';
  const myTurn = match.status === 'active' && match.turn === me?.id;
  const isPictionary = match.game === 'pictionary';
  const amDrawer = isPictionary && match.state?.drawer === me?.id;

  let statusText;
  let statusColor = 'var(--lav-text)';
  if (match.status === 'done') {
    if (match.winner === 0) statusText = "It's a draw 🤝";
    else if (match.winner === me?.id) {
      statusText = isPictionary ? 'You guessed it! 🎉' : 'You won! 🎉';
      statusColor = 'var(--green)';
    } else {
      statusText = isPictionary ? `${nameOf(match.winner)} guessed it` : `${nameOf(match.winner)} won`;
      statusColor = 'var(--pink-hot)';
    }
  } else if (isPictionary) {
    statusText = amDrawer ? "You're drawing 🎨" : 'Your turn to guess 👀';
    statusColor = amDrawer ? 'var(--lav-text)' : 'var(--green)';
  } else {
    statusText = myTurn ? 'Your turn' : `${nameOf(match.turn)}'s turn…`;
    statusColor = myTurn ? 'var(--green)' : 'var(--text2)';
  }

  function play(move) {
    if (!myTurn) return;
    emit('match:move', { matchId: mid, move });
  }

  // a newer match of the same game (rematch) → offer to jump in
  const rematch = matches.find((m) => m.game === match.game && m.id > mid && m.status === 'active');

  return (
    <div>
      <PageHeader title={TITLES[match.game] || 'Match'} />
      <div className="px-5">
        <div
          className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center text-lg font-extrabold"
          style={{ color: statusColor }}
        >
          {statusText}
        </div>

        {match.game === 'tictactoe' && (
          <TicTacToe state={match.state} colorOf={colorOf} myTurn={myTurn} onPlay={play} />
        )}
        {match.game === 'connect4' && (
          <Connect4 state={match.state} colorOf={colorOf} myTurn={myTurn} onPlay={play} />
        )}
        {match.game === 'gomoku' && (
          <Gomoku state={match.state} colorOf={colorOf} myTurn={myTurn} onPlay={play} />
        )}
        {match.game === 'battleship' && (
          <Battleship
            state={match.state}
            me={me?.id}
            colorOf={colorOf}
            myTurn={myTurn}
            done={match.status === 'done'}
            onPlay={play}
          />
        )}
        {match.game === 'memory' && (
          <Memory
            state={match.state}
            me={me?.id}
            colorOf={colorOf}
            nameOf={nameOf}
            myTurn={myTurn}
            createdBy={match.created_by}
            onPlay={play}
          />
        )}
        {match.game === 'dotsandboxes' && (
          <DotsAndBoxes
            state={match.state}
            me={me?.id}
            colorOf={colorOf}
            nameOf={nameOf}
            myTurn={myTurn}
            createdBy={match.created_by}
            onPlay={play}
          />
        )}
        {match.game === 'reversi' && (
          <Reversi state={match.state} me={me?.id} colorOf={colorOf} myTurn={myTurn} onPlay={play} />
        )}
        {isPictionary && <PictionaryBoard match={match} me={me} emit={emit} />}

        {/* players legend */}
        {!isPictionary && (
          <div className="mt-5 flex justify-center gap-5">
            {[match.created_by, match.created_by === 1 ? 2 : 1].map((uid) => (
              <div key={uid} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ background: colorOf(uid) }} />
                <span className="text-sm font-bold">{uid === me?.id ? 'You' : nameOf(uid)}</span>
              </div>
            ))}
          </div>
        )}

        {match.status === 'done' && (
          <div className="mt-6 space-y-2.5">
            {rematch ? (
              <button
                onClick={() => nav(`/match/${rematch.id}`)}
                className="w-full rounded-2xl bg-[var(--green)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95"
              >
                Rematch is ready →
              </button>
            ) : (
              <button
                onClick={() => emit('match:rematch', { matchId: mid })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
              >
                <RotateCcw size={18} /> Rematch
              </button>
            )}
            <button
              onClick={() => nav('/games')}
              className="w-full rounded-2xl bg-[var(--card)] py-3 font-bold text-[var(--text2)]"
            >
              Back to games
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TicTacToe({ state, colorOf, myTurn, onPlay }) {
  const line = state.line || [];
  return (
    <div className="mx-auto grid w-full max-w-[320px] grid-cols-3 gap-2.5">
      {state.board.map((cell, i) => (
        <motion.button
          key={i}
          whileTap={cell === 0 && myTurn ? { scale: 0.9 } : {}}
          onClick={() => cell === 0 && onPlay(i)}
          disabled={cell !== 0 || !myTurn}
          className="flex aspect-square items-center justify-center rounded-2xl border-2"
          style={{
            background: 'var(--card)',
            borderColor: line.includes(i) ? '#9be89b' : 'var(--border)',
          }}
        >
          {cell !== 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-3/5 w-3/5 rounded-full"
              style={{ background: colorOf(cell), boxShadow: `0 0 14px ${colorOf(cell)}66` }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

function Connect4({ state, colorOf, myTurn, onPlay }) {
  const { cols, rows, board } = state;
  const line = state.line || [];
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-[var(--bg2)] p-2.5">
      <div className="flex gap-1.5">
        {Array.from({ length: cols }).map((_, c) => {
          const colFull = board[c * rows + (rows - 1)] !== 0;
          return (
            <button
              key={c}
              onClick={() => myTurn && !colFull && onPlay(c)}
              disabled={!myTurn || colFull}
              className="flex flex-1 flex-col-reverse gap-1.5 rounded-xl p-1 active:bg-white/5"
            >
              {Array.from({ length: rows }).map((__, r) => {
                const cell = board[c * rows + r];
                const idx = c * rows + r;
                return (
                  <span
                    key={r}
                    className="aspect-square w-full rounded-full"
                    style={{
                      background: cell ? colorOf(cell) : 'var(--card)',
                      boxShadow: line.includes(idx)
                        ? '0 0 0 2px #9be89b, 0 0 12px #9be89b88'
                        : cell
                          ? `0 0 10px ${colorOf(cell)}66`
                          : 'inset 0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  />
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Gomoku({ state, colorOf, myTurn, onPlay }) {
  const { size, board } = state;
  const line = state.line || [];
  return (
    <div
      className="mx-auto w-full max-w-[360px] rounded-2xl bg-[var(--bg2)] p-2"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 3 }}
    >
      {board.map((cell, i) => (
        <button
          key={i}
          onClick={() => cell === 0 && myTurn && onPlay(i)}
          disabled={cell !== 0 || !myTurn}
          className="flex aspect-square items-center justify-center rounded-md"
          style={{ background: line.includes(i) ? '#9be89b22' : 'var(--card)' }}
        >
          {cell !== 0 && (
            <span
              className="h-3/4 w-3/4 rounded-full"
              style={{
                background: colorOf(cell),
                boxShadow: line.includes(i) ? '0 0 8px #9be89b' : `0 0 6px ${colorOf(cell)}66`,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

function Battleship({ state, me, colorOf, myTurn, done, onPlay }) {
  const { size, ships, shots } = state;
  const opp = me === 1 ? 2 : 1;
  const myShips = (ships[me] || []).flat();
  const oppShips = (ships[opp] || []).flat();
  const myShots = shots[me] || [];
  const oppShots = shots[opp] || [];

  const Cell = ({ bg, content, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex aspect-square items-center justify-center rounded-[5px] text-xs"
      style={{ background: bg }}
    >
      {content}
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-[var(--pink-hot)]">
          Enemy waters {myTurn && !done ? '· fire!' : ''}
        </div>
        <div
          className="rounded-2xl bg-[var(--bg2)] p-1.5"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 3 }}
        >
          {Array.from({ length: size * size }).map((_, i) => {
            const fired = myShots.includes(i);
            const hit = fired && oppShips.includes(i);
            const revealShip = done && oppShips.includes(i);
            return (
              <Cell
                key={i}
                disabled={fired || !myTurn || done}
                onClick={() => onPlay(i)}
                bg={hit ? '#ff6ba8' : fired ? 'var(--card2)' : revealShip ? '#ffffff14' : 'var(--card)'}
                content={hit ? '💥' : fired ? <span className="text-[var(--muted)]">•</span> : ''}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-[var(--blue)]">Your fleet</div>
        <div
          className="rounded-2xl bg-[var(--bg2)] p-1.5"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 3 }}
        >
          {Array.from({ length: size * size }).map((_, i) => {
            const ship = myShips.includes(i);
            const shot = oppShots.includes(i);
            const hit = ship && shot;
            return (
              <Cell
                key={i}
                disabled
                bg={hit ? '#ff6ba8' : ship ? colorOf(me) + '88' : shot ? 'var(--card2)' : 'var(--card)'}
                content={hit ? '🔥' : shot ? <span className="text-[var(--muted)]">•</span> : ''}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Score strip shared by Memory + Dots & boxes ──
function ScoreStrip({ scores, me, colorOf, nameOf, createdBy }) {
  const p2 = createdBy === 1 ? 2 : 1;
  const players = [createdBy, p2];
  return (
    <div className="mb-4 flex justify-center gap-3">
      {players.map((uid) => {
        const isMe = uid === me;
        return (
          <div
            key={uid}
            className="flex min-w-[88px] items-center justify-center gap-2 rounded-2xl border px-3 py-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--card)',
            }}
          >
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: colorOf(uid) }} />
            <span className="text-sm font-bold text-[var(--text2)]">{isMe ? 'You' : nameOf(uid)}</span>
            <span className="text-lg font-extrabold" style={{ color: colorOf(uid) }}>
              {scores?.[uid] ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Memory({ state, me, colorOf, nameOf, myTurn, createdBy, onPlay }) {
  const cards = state.cards || [];
  const matched = state.matched || [];
  const pending = state.pending || [];
  const scores = state.scores || {};
  const isUp = (i) => matched.includes(i) || pending.includes(i);
  return (
    <div>
      <ScoreStrip scores={scores} me={me} colorOf={colorOf} nameOf={nameOf} createdBy={createdBy} />
      <div className="mx-auto grid w-full max-w-[340px] grid-cols-4 gap-2.5">
        {cards.map((face, i) => {
          const up = isUp(i);
          const done = matched.includes(i);
          const canTap = myTurn && !up;
          return (
            <motion.button
              key={i}
              whileTap={canTap ? { scale: 0.9 } : {}}
              onClick={() => canTap && onPlay(i)}
              disabled={!canTap}
              className="relative flex aspect-square items-center justify-center rounded-2xl border-2 text-3xl"
              style={{
                background: up ? 'var(--card2)' : 'var(--card)',
                borderColor: done ? '#9be89b' : up ? 'var(--border-strong)' : 'var(--border)',
                opacity: done ? 0.92 : 1,
              }}
            >
              {up ? (
                <motion.span
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {face}
                </motion.span>
              ) : (
                <span
                  className="h-2/3 w-2/3 rounded-xl"
                  style={{ background: 'var(--grad-accent-soft)', opacity: 0.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function DotsAndBoxes({ state, me, colorOf, nameOf, myTurn, createdBy, onPlay }) {
  const G = state.grid || 3; // boxes per side
  const edges = state.edges || [];
  const boxes = state.boxes || [];
  const scores = state.scores || {};
  const H = (G + 1) * G; // count of horizontal edges
  // edge id helpers (mirror server)
  const hId = (r, c) => r * G + c; // horizontal edge at dot-row r, between cols c,c+1
  const vId = (r, c) => H + r * (G + 1) + c; // vertical edge at box-row r, dot-col c
  const D = 2 * G + 1; // dimension of the dot/edge lattice (dots + gaps)

  // cell sizing: dots are small, edges fill the gaps
  const dot = 10;
  const gap = 40;
  const colTemplate = Array.from({ length: D })
    .map((_, k) => (k % 2 === 0 ? `${dot}px` : `${gap}px`))
    .join(' ');

  const tap = (id) => myTurn && edges[id] === 0 && onPlay(id);

  const cellAt = (gr, gc) => {
    const isDotRow = gr % 2 === 0;
    const isDotCol = gc % 2 === 0;
    if (isDotRow && isDotCol) {
      // a dot
      return <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />;
    }
    if (isDotRow && !isDotCol) {
      // horizontal edge: dot-row r = gr/2, between cols (gc-1)/2 .. that col index
      const r = gr / 2;
      const c = (gc - 1) / 2;
      const id = hId(r, c);
      const owner = edges[id];
      return (
        <button
          onClick={() => tap(id)}
          disabled={!myTurn || owner !== 0}
          className="h-2 w-full rounded-full transition-colors"
          style={{ background: owner ? colorOf(owner) : myTurn ? 'var(--border)' : 'var(--card2)' }}
        />
      );
    }
    if (!isDotRow && isDotCol) {
      // vertical edge: box-row r = (gr-1)/2, dot-col c = gc/2
      const r = (gr - 1) / 2;
      const c = gc / 2;
      const id = vId(r, c);
      const owner = edges[id];
      return (
        <button
          onClick={() => tap(id)}
          disabled={!myTurn || owner !== 0}
          className="h-full w-2 rounded-full transition-colors"
          style={{ background: owner ? colorOf(owner) : myTurn ? 'var(--border)' : 'var(--card2)' }}
        />
      );
    }
    // box center
    const r = (gr - 1) / 2;
    const c = (gc - 1) / 2;
    const owner = boxes[r * G + c];
    return (
      <span
        className="flex h-full w-full items-center justify-center rounded-md text-sm font-extrabold"
        style={{ background: owner ? colorOf(owner) + '33' : 'transparent', color: owner ? colorOf(owner) : 'transparent' }}
      >
        {owner ? (owner === me ? 'You' : '') : ''}
      </span>
    );
  };

  return (
    <div>
      <ScoreStrip scores={scores} me={me} colorOf={colorOf} nameOf={nameOf} createdBy={createdBy} />
      <div className="mx-auto w-fit rounded-2xl bg-[var(--bg2)] p-4">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: colTemplate,
            gridTemplateRows: colTemplate,
            alignItems: 'center',
            justifyItems: 'center',
          }}
        >
          {Array.from({ length: D * D }).map((_, k) => {
            const gr = Math.floor(k / D);
            const gc = k % D;
            return (
              <div key={k} className="flex h-full w-full items-center justify-center">
                {cellAt(gr, gc)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Reversi({ state, me, colorOf, myTurn, onPlay }) {
  const size = state.size || 6;
  const board = state.board || [];
  const last = state.last;

  // compute my legal moves for affordance dots
  const legal = new Set();
  if (myTurn && me) {
    const opp = me === 1 ? 2 : 1;
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];
    for (let i = 0; i < board.length; i++) {
      if (board[i] !== 0) continue;
      const r0 = Math.floor(i / size);
      const c0 = i % size;
      let ok = false;
      for (const [dr, dc] of dirs) {
        let r = r0 + dr;
        let c = c0 + dc;
        let seen = 0;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === opp) {
          seen++;
          r += dr;
          c += dc;
        }
        if (seen > 0 && r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === me) {
          ok = true;
          break;
        }
      }
      if (ok) legal.add(i);
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-[330px] rounded-2xl p-2"
      style={{ background: '#1f7a3f', display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 4 }}
    >
      {board.map((cell, i) => {
        const playable = legal.has(i);
        return (
          <motion.button
            key={i}
            whileTap={playable ? { scale: 0.88 } : {}}
            onClick={() => playable && onPlay(i)}
            disabled={!playable}
            className="relative flex aspect-square items-center justify-center rounded-md"
            style={{ background: i === last ? '#2f9c55' : '#23713c', boxShadow: 'inset 0 0 0 1px #0003' }}
          >
            {cell !== 0 && (
              <motion.span
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="h-4/5 w-4/5 rounded-full"
                style={{ background: colorOf(cell), boxShadow: `0 1px 4px #0006, 0 0 8px ${colorOf(cell)}55` }}
              />
            )}
            {cell === 0 && playable && (
              <span
                className="h-1/4 w-1/4 rounded-full"
                style={{ background: colorOf(me), opacity: 0.4 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
