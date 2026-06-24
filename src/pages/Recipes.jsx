import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

// Split a newline-separated string into clean, non-empty lines.
function lines(str) {
  return (str || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function RecipeCard({ recipe, canDelete, onDelete, delay }) {
  const [confirming, setConfirming] = useState(false);
  const ingredients = useMemo(() => lines(recipe.ingredients), [recipe.ingredients]);
  const steps = useMemo(() => lines(recipe.steps), [recipe.steps]);

  return (
    <Card delay={delay} className="overflow-hidden p-0">
      {/* header band */}
      <div className="flex items-start gap-3 bg-grad-accent-soft px-4 py-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--card)] text-lg shadow-elev1">
          🥘
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-extrabold leading-tight text-[var(--text)]">
            {recipe.title}
          </h3>
          {recipe.added_name && (
            <p className="mt-0.5 text-xs text-[var(--text2)]">added by {recipe.added_name}</p>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => setConfirming((c) => !c)}
            className="-mr-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors active:bg-white/5"
            aria-label="Delete recipe"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {confirming && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5">
              <span className="flex-1 text-xs text-[var(--text2)]">Delete this recipe?</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-auto"
                onClick={() => setConfirming(false)}
              >
                Keep
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-auto"
                onClick={() => {
                  setConfirming(false);
                  onDelete(recipe);
                }}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 px-4 py-4">
        {ingredients.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[var(--pink-hot)]">
              Ingredients
            </div>
            <ul className="space-y-1.5">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug text-[var(--text)]">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pink-hot)]" />
                  <span className="min-w-0 break-words">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {steps.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[var(--purple)]">
              Steps
            </div>
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-[var(--text)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grad-accent text-[11px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 break-words pt-px">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {ingredients.length === 0 && steps.length === 0 && (
          <p className="text-sm italic text-[var(--muted)]">No details yet — just a name for now.</p>
        )}
      </div>
    </Card>
  );
}

export default function Recipes() {
  const recipes = useStore((s) => s.recipes);
  const refreshRecipes = useStore((s) => s.refreshRecipes);
  const me = useStore((s) => s.me);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshRecipes();
  }, [refreshRecipes]);

  function openEditor() {
    setTitle('');
    setIngredients('');
    setSteps('');
    setEditing(true);
  }

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await api.post('/api/recipes', {
        title: title.trim(),
        ingredients: ingredients.trim(),
        steps: steps.trim(),
        userId: me?.id,
      });
      refreshRecipes();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(recipe) {
    await api.del('/api/recipes/' + recipe.id);
    refreshRecipes();
  }

  const list = recipes || [];

  return (
    <div className="pb-28">
      <PageHeader
        icon="🍳"
        title="Our recipes"
        sub="what we cook together"
        right={
          <button
            onClick={openEditor}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-grad-accent text-white shadow-card active:scale-95"
            aria-label="Add recipe"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-1">
        {list.length === 0 ? (
          <Card variant="accent" className="px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--card)] text-3xl shadow-elev1">
              🍳
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text)]">Your cookbook is empty</h3>
            <p className="mx-auto mt-1.5 max-w-[260px] text-sm text-[var(--text2)]">
              Save the meals you love making together — the cozy ones worth a second round.
            </p>
            <Button
              variant="primary"
              className="mx-auto mt-5 w-auto px-6"
              icon={<ChefHat size={18} />}
              onClick={openEditor}
            >
              Add your first recipe
            </Button>
          </Card>
        ) : (
          list.map((r, i) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              delay={Math.min(i, 6) * 0.04}
              canDelete={me?.id && r.added_by === me.id}
              onDelete={remove}
            />
          ))
        )}
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="New recipe 🍳">
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--text2)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday pancakes"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[15px] outline-none focus:border-[var(--border-strong)]"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--text2)]">
              Ingredients <span className="font-normal text-[var(--muted)]">· one per line</span>
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              placeholder={'2 cups flour\n1 egg\na splash of love'}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--text2)]">
              Steps <span className="font-normal text-[var(--muted)]">· one per line</span>
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={5}
              placeholder={'Mix the dry stuff\nWhisk in the egg\nFlip when bubbly'}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <Button variant="primary" busy={saving} disabled={!title.trim()} onClick={save} className="mt-1">
            Save recipe
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
