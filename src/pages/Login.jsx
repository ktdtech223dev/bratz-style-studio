import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

const ACCOUNTS = [
  { username: 'keshawn', name: 'Keshawn', color: '#b8a9e8' },
  { username: 'mercury', name: 'Mercury', color: '#f5a3c7' },
];

export default function Login() {
  const setMe = useStore((s) => s.setMe);
  const [picked, setPicked] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const account = ACCOUNTS.find((a) => a.username === picked);

  async function submit(fullPin) {
    try {
      const me = await api.login(picked, fullPin);
      setMe(me);
    } catch (e) {
      setError('Wrong PIN, try again');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  }

  function tap(d) {
    setError('');
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) setTimeout(() => submit(next), 120);
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center px-7 safe-top safe-bottom"
      style={{ background: 'linear-gradient(180deg,#3d3470,#1a1f4a)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[var(--pink-hot)]/20 shadow-glow">
          <Heart size={40} fill="#ff6ba8" color="#ff6ba8" />
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Us</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">just us 💜</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!picked ? (
          <motion.div
            key="pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm space-y-4"
          >
            {ACCOUNTS.map((a, i) => (
              <motion.button
                key={a.username}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPicked(a.username)}
                className="flex w-full items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-extrabold text-[#1a1f4a]"
                  style={{ background: a.color }}
                >
                  {a.name[0]}
                </div>
                <div className="text-left">
                  <div className="text-xl font-extrabold">{a.name}</div>
                  <div className="text-sm text-[var(--text2)]">tap to sign in</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: shake ? [0, -8, 8, -6, 6, 0] : 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-xs"
          >
            <div className="mb-6 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-[#1a1f4a]"
                style={{ background: account.color }}
              >
                {account.name[0]}
              </div>
              <p className="mt-3 text-lg font-bold">Hi, {account.name}</p>
              <p className="text-sm text-[var(--text2)]">enter your PIN</p>
            </div>

            <div className="mb-7 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border-2 transition-all"
                  style={{
                    borderColor: account.color,
                    background: i < pin.length ? account.color : 'transparent',
                  }}
                />
              ))}
            </div>
            {error && <p className="mb-3 text-center text-sm text-[var(--pink-hot)]">{error}</p>}

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => tap(String(n))}
                  className="h-16 rounded-2xl bg-[var(--card)] text-2xl font-bold active:bg-[var(--card2)]"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => {
                  setPicked(null);
                  setPin('');
                  setError('');
                }}
                className="h-16 rounded-2xl text-sm font-semibold text-[var(--text2)] active:bg-[var(--card)]"
              >
                back
              </button>
              <button
                onClick={() => tap('0')}
                className="h-16 rounded-2xl bg-[var(--card)] text-2xl font-bold active:bg-[var(--card2)]"
              >
                0
              </button>
              <button
                onClick={() => setPin(pin.slice(0, -1))}
                className="flex h-16 items-center justify-center rounded-2xl text-[var(--text2)] active:bg-[var(--card)]"
              >
                <Delete size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
