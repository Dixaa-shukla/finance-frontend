import { Layers, Tags, TrendingDown, TrendingUp } from 'lucide-react';
import type { CategoryResponse } from '@/types/category';

/**
 * The four summary tiles for Module 5.
 *
 * ⚠️ EVERY NUMBER HERE IS COUNTED FROM WHAT GET /categories/user/{userId}
 * RETURNED. Nothing is hardcoded. Remember that response mixes two kinds of row:
 * `default: true` rows are the shared, admin-managed ones every account sees,
 * and `default: false` rows belong to this user alone — which is exactly the
 * split the last tile reports.
 */
export function CategoryStats({
  categories,
}: {
  categories: CategoryResponse[];
}) {
  const expense = categories.filter((c) => c.type === 'EXPENSE').length;
  const income = categories.filter((c) => c.type === 'INCOME').length;
  // `default` is the response spelling of the isDefault flag — see types/category.ts.
  const custom = categories.filter((c) => !c.default).length;
  const shared = categories.length - custom;

  const cards = [
    {
      label: 'Total Categories',
      value: String(categories.length),
      note: `${shared} shared · ${custom} yours`,
      icon: Tags,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Expense Categories',
      value: String(expense),
      note: 'Used when logging spending',
      icon: TrendingDown,
      tint: 'from-brand-purple to-brand-sky',
    },
    {
      label: 'Income Categories',
      value: String(income),
      note: 'Used when logging earnings',
      icon: TrendingUp,
      tint: 'from-brand-green to-brand-cyan',
    },
    {
      label: 'Your Custom',
      value: String(custom),
      note: custom === 0 ? 'None created yet' : 'Only visible to you',
      icon: Layers,
      tint: 'from-brand-cyan to-brand-blue',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-navy-700/60">
              {card.label}
            </p>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-soft`}
            >
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-extrabold tracking-tight text-navy-900">
            {card.value}
          </p>
          <p className="mt-1 truncate text-xs text-navy-700/50">{card.note}</p>
        </div>
      ))}
    </div>
  );
}
