import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';

export default function NoteEditor() {
  const emit = useStore((s) => s.emit);
  const partner = useStore((s) => s.partner);
  const nav = useNavigate();
  const [body, setBody] = useState('');

  function send() {
    const text = body.trim();
    if (!text) return;
    emit('note:send', { body: text });
    nav('/notes');
  }

  return (
    <div>
      <PageHeader title="New note" sub={`to ${partner?.display_name || 'your partner'}`} to="/notes" />
      <div className="px-5">
        <Card className="p-5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            autoFocus
            placeholder={`write something sweet for ${partner?.display_name || 'them'}…`}
            className="w-full resize-none rounded-2xl bg-[var(--bg2)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          <button
            onClick={send}
            disabled={!body.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
          >
            <Send size={18} /> Send note
          </button>
        </Card>
      </div>
    </div>
  );
}
