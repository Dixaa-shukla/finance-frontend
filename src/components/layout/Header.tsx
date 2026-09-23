import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
import { NotificationBell } from '@/components/layout/NotificationBell';

interface HeaderProps {
  title: string;
  subtitle: string;
  /**
   * Optional page-level action (e.g. "+ Add Expense"), shown to the left of the
   * search/notification controls. Purely additive — every existing caller that
   * omits it renders exactly as before.
   */
  action?: ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* Larger on desktop to match the reference design's page greeting. */}
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[27px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-navy-700/60">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {action}
        <button
          aria-label="Search"
          className="glass-card flex h-10 w-10 items-center justify-center text-navy-700/70 hover:text-brand-blue"
        >
          <Search className="h-4 w-4" />
        </button>
        <NotificationBell />

        {/* Module 1 — the app's only sign-out control. */}
        <UserMenu />
      </div>
    </div>
  );
}
