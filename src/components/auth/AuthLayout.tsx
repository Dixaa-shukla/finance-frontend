import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Gem, Sparkle, Sparkles } from 'lucide-react';

/**
 * Module 1 — Authentication & Security.
 *
 * The branded shell every auth screen sits in.
 *
 * ⚠️ EVERY COLOUR, RADIUS AND SHADOW HERE COMES FROM tailwind.config.js — the
 * same tokens components/layout/Sidebar.tsx uses (brand-blue/purple/cyan,
 * navy-*, sky-*, rounded-card, rounded-pill, shadow-soft, glass-card). The logo
 * mark below is a deliberate copy of the Sidebar's, so a user arriving at /login
 * sees the identical NOVA identity they'll see inside the dashboard. Do not
 * substitute raw hex values or a different icon set.
 *
 * The page background itself is NOT set here: styles/globals.css already applies
 * bg-app-gradient to <body> with background-attachment: fixed, so the gradient
 * is continuous across every route.
 */

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** The "Don't have an account? Sign up" line under the card. */
  footer?: ReactNode;
  /** Widened for the two-column Register form. */
  wide?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <DecorativeBackdrop />

      <div
        className={`relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}
      >
        {/* NOVA identity — matches Sidebar.tsx exactly */}
        <Link
          to="/login"
          className="mb-7 flex items-center justify-center gap-2.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-[17px] font-extrabold leading-none tracking-tight text-navy-900">
              NOVA AI FINANCE
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-navy-700/50">
              AI-Powered Personal Finance
            </p>
          </div>
        </Link>

        <div className="glass-card p-7 sm:p-9">
          <h1 className="text-center text-[26px] font-extrabold leading-tight tracking-tight text-navy-900">
            {title}
          </h1>
          <p className="mt-2 text-center text-sm text-navy-700/60">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-navy-700/60">{footer}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The crystal/sparkle decoration from the reference design.
 *
 * Purely ornamental, so the whole thing is aria-hidden and pointer-events-none —
 * it must never sit between the user and an input, or be read out by a screen
 * reader. The blurred orbs are what produce the blue → purple → cyan wash behind
 * the glass card.
 */
function DecorativeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Soft gradient orbs */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
      <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" />

      {/* Crystal shards — rotated gradient squares with the card's own sheen */}
      <div className="absolute left-[12%] top-[22%] h-16 w-16 rotate-12 rounded-2xl bg-gradient-to-br from-brand-cyan/40 to-brand-blue/25 shadow-glass backdrop-blur-md" />
      <div className="absolute right-[14%] top-[16%] h-12 w-12 -rotate-12 rounded-xl bg-gradient-to-br from-brand-purple/40 to-brand-blue/20 shadow-glass backdrop-blur-md" />
      <div className="absolute bottom-[18%] right-[18%] h-14 w-14 rotate-[24deg] rounded-2xl bg-gradient-to-br from-brand-blue/35 to-brand-cyan/25 shadow-glass backdrop-blur-md" />
      <div className="absolute bottom-[24%] left-[16%] h-10 w-10 -rotate-[18deg] rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-cyan/25 shadow-glass backdrop-blur-md" />

      {/* Sparkles */}
      <Sparkle className="absolute left-[26%] top-[12%] h-5 w-5 text-brand-purple/50" />
      <Sparkles className="absolute right-[28%] bottom-[12%] h-6 w-6 text-brand-blue/45" />
      <Gem className="absolute left-[8%] bottom-[38%] h-5 w-5 text-brand-cyan/55" />
      <Sparkle className="absolute right-[9%] top-[46%] h-4 w-4 text-brand-cyan/50" />
    </div>
  );
}
