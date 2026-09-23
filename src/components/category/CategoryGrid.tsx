import { Pencil, ShieldCheck, Tag, Trash2, User } from 'lucide-react';
import type { CategoryResponse } from '@/types/category';

/**
 * The card grid.
 *
 * ⚠️ WHY EDIT AND DELETE ARE HIDDEN ON DEFAULT CATEGORIES FOR NON-ADMINS —
 * BOTH REASONS COME FROM THE BACKEND, NOT FROM TASTE:
 *
 *   DELETE /categories/{id} returns 400 BadRequest for a default row ("Default
 *   categories cannot be deleted directly. Use the admin endpoint."), and the
 *   admin route that CAN delete it is @PreAuthorize("hasRole('ADMIN')"). So for
 *   an ordinary user a delete button on a default can only ever fail.
 *
 *   PUT /categories/{id} is worse: CategoryServiceImpl.updateCategory carries an
 *   explicit `// TODO: ... restrict updates to default categories to ADMIN role`,
 *   meaning it currently has NO role or ownership check at all. Rendering an edit
 *   button there would let one user rename a category that every account shares.
 *   The button is withheld rather than the request being blocked, because only the
 *   server can actually enforce this — worth fixing server-side.
 *
 * A user's own custom rows have neither problem, so they are always editable and
 * deletable by their owner.
 */
interface CategoryGridProps {
  categories: CategoryResponse[];
  busy: boolean;
  isAdmin: boolean;
  onEdit: (category: CategoryResponse) => void;
  onDelete: (category: CategoryResponse) => void;
}

/** A colour to draw the card accent with when colorHex is null or blank. */
const FALLBACK_COLOR = '#5AA9F0';

/**
 * ⚠️ `icon` IS A FREE @Size(max = 50) STRING ON THE BACKEND, NOT AN EMOJI FIELD,
 * AND THE SEEDED DEFAULTS PROVE IT: id 4/6/3 carry "🍔"/"💰"/"🛍️", but id 1
 * ("General") carries the Material-icon NAME "shopping_cart". Rendering that
 * literally in a 44px tile spilled the word across the card.
 *
 * So: draw the value only when it is a short symbol — no ASCII letters, digits,
 * underscores or spaces, which is what every emoji satisfies and what no name
 * string does. Anything else falls back to a tag glyph, with the raw value kept
 * in the tooltip so nothing the backend stored is hidden outright.
 */
function isGlyphIcon(icon: string): boolean {
  return icon.length <= 8 && !/[A-Za-z0-9_\s-]/.test(icon);
}

export function CategoryGrid({
  categories,
  busy,
  isAdmin,
  onEdit,
  onDelete,
}: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="glass-card px-8 py-14 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No categories match this view
        </p>
        <p className="mt-1 text-sm text-navy-700/60">
          Try another tab, or clear the search box above.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
        busy ? 'opacity-50' : ''
      }`}
    >
      {categories.map((category) => {
        const color = category.colorHex ? category.colorHex : FALLBACK_COLOR;
        const editable = !category.default || isAdmin;
        const deletable = !category.default || isAdmin;

        return (
          <div key={category.id} className="glass-card relative p-5">
            {/* The category's own colorHex, used as a left accent bar. */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
              style={{ backgroundColor: color }}
            />

            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg"
                  style={{ backgroundColor: `${color}1F` }}
                  title={category.icon ?? undefined}
                >
                  {category.icon && isGlyphIcon(category.icon) ? (
                    <span aria-hidden="true">{category.icon}</span>
                  ) : (
                    <Tag className="h-4 w-4" style={{ color }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-700/50">
                    {category.type === 'EXPENSE' ? 'Expense' : 'Income'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {editable && (
                  <button
                    type="button"
                    onClick={() => onEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-brand-blue"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {deletable && (
                  <button
                    type="button"
                    onClick={() => onDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 pl-2">
              {/* `default` is the response spelling — see types/category.ts. */}
              {category.default ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-lavender-100 px-2.5 py-1 text-xs font-semibold text-navy-800">
                  <ShieldCheck className="h-3 w-3 text-brand-purple" />
                  Shared default
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-sky-100 px-2.5 py-1 text-xs font-semibold text-navy-800">
                  <User className="h-3 w-3 text-brand-blue" />
                  Your category
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/60 px-2.5 py-1 text-xs font-medium text-navy-700/70">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {category.colorHex ? category.colorHex : 'No colour set'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
