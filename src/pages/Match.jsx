import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';

const TITLES = {
  tictactoe: 'Tic-Tac-Toe',
  connect4: 'Connect 4',
  gomoku: 'Five in a Row',
  battleship: 'Battleship',
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
  const partner = match.turn && match.turn !== me?.id ? match.turn : null;

  let statusText;
  let statusColor = 'var(--lav-text)';
  if (match.status === 'done') {
    if (match.winner === 0) statusText = "It's a draw 🤝";
    else if (match.winner === me?.id) {
      statusText = 'You won! 🎉';
      statusColor = 'var(--green)';
    } else {
      statusText = `${nameOf(match.winner)} won`;
      statusColor = 'var(--pink-hot)';
    }
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

        {/* players legend */}
        <div className="mt-5 flex justify-center gap-5">
          {[match.created_by, match.created_by === 1 ? 2 : 1].map((uid) => (
            <div key={uid} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full" style={{ background: colorOf(uid) }} />
              <span className="text-sm font-bold">{uid === me?.id ? 'You' : nameOf(uid)}</span>
            </div>
          ))}
        </div>

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
