import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * The signed-in application shell: module navigation on the left, page content
 * on the right.
 *
 * The page background is NOT set here — styles/globals.css puts bg-app-gradient
 * on <body> with background-attachment: fixed, so the soft blue/lavender wash is
 * continuous and never a plain white panel, per the project brief.
 *
 * Below the lg breakpoint the sidebar becomes an overlay drawer: this many
 * modules do not fit alongside content on a phone, but they must still be
 * reachable.
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only bar carrying the drawer toggle. */}
        <div className="flex items-center gap-3 px-5 pt-5 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open module navigation"
            className="glass-card flex h-10 w-10 items-center justify-center text-navy-700/70"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="bg-gradient-to-r from-[#0b1f5e] via-[#1f4bb8] to-brand-blue bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            NOVA AI FINANCE
          </span>
        </div>

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/*
            The backdrop is a real <button> rather than a div with onClick so it
            is reachable by keyboard and announced, which a bare div is not.
          */}
          <button
            type="button"
            aria-label="Close module navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-navy-900/30 backdrop-blur-sm"
          />
          <div className="relative z-10">
            <Sidebar mobile onNavigate={() => setDrawerOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close module navigation"
            onClick={() => setDrawerOpen(false)}
            className="relative z-10 m-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-navy-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
