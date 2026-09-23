import { Link, useLocation } from 'react-router';
import type { ComponentType } from 'react';

// A row of links used when one sidebar item covers more than one page.
// Example: Expenses also holds AI Categorization and Receipts.
export interface PageTab {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
}

export function PageTabs({ tabs }: { tabs: PageTab[] }) {
  const location = useLocation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map(({ label, path, icon: Icon }) => {
        const active = location.pathname === path;

        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky text-white shadow-glow'
                : 'bg-white/60 text-navy-700/65 hover:bg-white hover:shadow-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
