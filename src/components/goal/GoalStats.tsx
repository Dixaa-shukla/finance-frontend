import { Coins, Hourglass, Target, TimerOff, Trophy } from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { GoalResponse } from '@/types/goal';

/**
 * The four summary tiles.
 *
 * ⚠️ EVERY FIGURE IS SUMMED FROM WHAT THE SERVER SENT, and the three counts come
 * from `status` on this same list. GoalServiceImpl computes that field on every
 * read (COMPLETED if currentAmount >= targetAmount, else EXPIRED if the target
 * date has passed, else IN_PROGRESS), so counting here cannot disagree with it.
 */
export function GoalStats({ goals }: { goals: GoalResponse[] }) {
  const target = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const saved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const inProgress = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const completed = goals.filter((g) => g.status === 'COMPLETED').length;
  const expired = goals.filter((g) => g.status === 'EXPIRED').length;

  const overallPercent = target > 0 ? Math.round((saved / target) * 100) : 0;

  const cards = [
    {
      label: 'Total Target',
      value: formatINR(target),
      note: goals.length === 1 ? '1 goal' : `${goals.length} goals`,
      icon: Target,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Total Saved',
      value: formatINR(saved),
      note: `${overallPercent}% of everything targeted`,
      icon: Coins,
      tint: 'from-brand-purple to-brand-sky',
    },
    {
      label: 'In Progress',
      value: String(inProgress),
      note: inProgress === 0 ? 'Nothing active right now' : 'Still being saved for',
      icon: Hourglass,
      tint: 'from-brand-cyan to-brand-blue',
    },
    {
      label: expired > 0 ? 'Expired' : 'Completed',
      value: String(expired > 0 ? expired : completed),
      note:
        expired > 0
          ? 'Past the target date, short of target'
          : completed === 0
            ? 'None reached yet'
            : 'Target reached in full',
      icon: expired > 0 ? TimerOff : Trophy,
      tint: expired > 0 ? 'from-red-400 to-red-500' : 'from-brand-green to-brand-cyan',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-navy-700/60">{card.label}</p>
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
