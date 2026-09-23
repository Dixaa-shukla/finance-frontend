import { Link } from 'react-router';
import {
  ArrowRight,
  Bell,
  Bot,
  CircleUserRound,
  KeyRound,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { SETTINGS_TABS } from '@/config/pageTabs';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';

// Application preferences and security. Categories live on the tab next to this page.
export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const isGoogleAccount = user?.provider === 'GOOGLE';

  return (
    <div className="space-y-6">
      <Header
        title="Settings"
        subtitle="Manage your preferences, categories and security"
        action={
          <span className="glass-card hidden items-center gap-2 px-4 py-2.5 text-xs font-bold text-navy-800 sm:inline-flex">
            <Mail className="h-3.5 w-3.5 text-brand-blue" />
            <span className="max-w-[13rem] truncate">{user?.email ?? 'Not signed in'}</span>
          </span>
        }
      />

      <PageTabs tabs={SETTINGS_TABS} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <div className="settings-hero glass-card relative overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple via-[#5b7ce8] to-brand-sky text-white shadow-glow">
              <SlidersHorizontal className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy-900">
                Your account, in one place
              </h2>
              <p className="mt-1 text-sm text-navy-700/65">
                Profile details, notification centre and sign-in security.
              </p>
            </div>
          </div>

          <p className="relative z-10 mt-6 max-w-xl text-sm leading-relaxed text-navy-700/60">
            Everything below reads and writes the same data your budgets, goals and Nova AI
            insights are built from — so a change here shows up across the whole app.
          </p>

          <div className="relative z-10 mt-6 flex flex-wrap gap-2">
            {['Profile', 'Notifications', 'Security', 'Nova AI'].map((chip) => (
              <span
                key={chip}
                className="rounded-pill bg-white/70 px-3 py-1.5 text-[11px] font-bold text-navy-700/70"
              >
                {chip}
              </span>
            ))}
          </div>

          <span
            aria-hidden="true"
            className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-brand-purple/20 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute -top-12 right-24 h-32 w-32 rounded-full bg-brand-cyan/20 blur-3xl"
          />
        </div>

        <AccountCard />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          icon={<CircleUserRound className="h-5 w-5" />}
          title="Profile & Personal Details"
          detail="The personal information Nova uses across your finance experience."
        >
          {/* Profile has its own page now, so this section just points at it. */}
          <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-sky-50/90 to-lavender-100/65 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-navy-900">Your profile</p>
              <p className="mt-1 text-xs leading-relaxed text-navy-700/60">
                Name, phone, photo, currency, monthly salary and your primary financial
                goal are all edited on the Profile page.
              </p>
            </div>
            <Link
              to="/profile"
              className="flex shrink-0 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
            >
              Open profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={<WalletCards className="h-5 w-5" />}
          title="Financial Preferences"
          detail="Currency, monthly salary and primary goal — all stored on your profile."
        >
          <div className="rounded-2xl bg-gradient-to-br from-sky-50/90 to-lavender-100/65 p-5">
            <p className="text-sm font-extrabold text-navy-900">Where these live</p>
            <p className="mt-2 text-xs leading-relaxed text-navy-700/65">
              There is no separate preferences record. Your preferred currency, monthly
              salary and primary financial goal are fields on your profile, so budgets and
              Nova AI insights always read the values you saved there.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/70 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender-100 text-brand-purple">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold text-navy-700/75">
                Edit them on the Profile page.
              </p>
            </div>
          </div>
        </SettingsSection>
      </div>

      <SettingsSection
        icon={<Bell className="h-5 w-5" />}
        title="Notifications"
        detail="Budget alerts, goal deadlines, due reminders and monthly summaries."
      >
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-sky-50/90 to-lavender-100/65 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-navy-900">Your notification centre</p>
            {/*
              Honest about the absence of toggles: NotificationController has no
              preference routes, so there is nothing here to switch on or off.
            */}
            <p className="mt-1 text-xs leading-relaxed text-navy-700/60">
              Review alerts, mark them read and delete the ones you're done with. Delivery
              can't be turned off per type — the backend stores no notification preferences.
            </p>
          </div>
          <Link
            to="/notifications"
            className="flex shrink-0 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
          >
            Open notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </SettingsSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Account Security"
          detail="Sign-in and session controls, handled by the authentication backend."
        >
          <div className="divide-y divide-sky-100/80 overflow-hidden rounded-2xl border border-white/70 bg-white/45">
            {/*
 * Google accounts do not have a password to change.
 */}
            <SecurityRow
              icon={<KeyRound className="h-4 w-4" />}
              title="Change password"
              detail={
                isGoogleAccount
                  ? 'Not applicable — Google manages this account’s credentials.'
                  : 'Every other device is signed out when you change it.'
              }
              action={
                isGoogleAccount ? (
                  <span className="shrink-0 rounded-pill bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold text-navy-700/50">
                    Managed by Google
                  </span>
                ) : (
                  <Link
                    to="/change-password"
                    className="shrink-0 rounded-pill bg-gradient-to-r from-brand-purple to-brand-sky px-3.5 py-2 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Change
                  </Link>
                )
              }
            />
            <SecurityRow
              icon={<Mail className="h-4 w-4" />}
              title="Account email"
              detail={user?.email ?? 'Your signed-in account'}
              action={
                <span className="shrink-0 rounded-pill bg-mint-100 px-2.5 py-1 text-[10px] font-extrabold text-brand-green">
                  {user?.enabled === false ? 'Disabled' : 'Active'}
                </span>
              }
            />
            <SecurityRow
              icon={<UserRound className="h-4 w-4" />}
              title="Sign-in method"
              detail={
                isGoogleAccount
                  ? 'Google — no local password is stored for this account'
                  : 'Email and password'
              }
              action={
                <span className="shrink-0 rounded-pill bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold text-brand-blue">
                  {user?.provider ?? 'LOCAL'}
                </span>
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={<Bot className="h-5 w-5" />}
          title="Nova AI"
          detail="Your assistant and insights read the finance data already on your account."
        >
          <div className="rounded-2xl bg-gradient-to-br from-lavender-100/85 to-sky-50/85 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-brand-purple">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-navy-900">
                  Personalised from your data
                </p>
                <p className="mt-1 text-xs text-navy-700/60">
                  No separate AI preference is stored by the backend.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-1.5 rounded-pill bg-white/80 px-3.5 py-2 text-xs font-extrabold text-brand-blue transition-colors hover:bg-white"
              >
                Chat with Nova AI
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/ai-analytics"
                className="inline-flex items-center gap-1.5 rounded-pill bg-white/80 px-3.5 py-2 text-xs font-extrabold text-brand-purple transition-colors hover:bg-white"
              >
                Reports
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </SettingsSection>
      </div>

      {isAdmin && (
        <SettingsSection
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Administration"
          detail="This account holds the ADMIN role, so the platform panel is available."
        >
          <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-mint-50 to-sky-50/90 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-navy-700/70">
              Platform totals, every account, AI usage across all users and the system-wide
              default categories.
            </p>
            <Link
              to="/admin"
              className="flex shrink-0 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
            >
              Open admin panel
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

/**
 * Shows a quick summary of the signed-in account.
 * Displays all roles instead of only the first one, since role order is not guaranteed.
 */
function AccountCard() {
  const { user, isAdmin } = useAuth();
  const roles = user?.roles ?? [];

  return (
    <div className="glass-card min-w-[250px] p-5">
      <div className="flex items-center gap-3">
        {/*
 * Shows the user's initials instead of the profile photo.
 * The profile form already displays and handles the photo.
 */}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple via-[#5b7ce8] to-brand-sky text-base font-extrabold text-white shadow-glow">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-navy-900">Account</p>
          <p className="truncate text-[11px] text-navy-700/55">
            {isAdmin ? 'Administrator' : 'Signed-in profile'}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-[11px]">
        <div>
          <dt className="font-bold text-navy-700/55">Email</dt>
          <dd className="mt-1 truncate font-semibold text-navy-800">{user?.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-bold text-navy-700/55">Roles</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {roles.length ? (
              roles.map((role) => (
                <span
                  key={role}
                  className={`rounded-pill px-2 py-0.5 font-extrabold ${
                    role === 'ADMIN'
                      ? 'bg-lavender-100 text-brand-purple'
                      : 'bg-mint-100 text-brand-green'
                  }`}
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="font-semibold text-navy-800">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-navy-700/55">Member since</dt>
          <dd className="mt-1 font-semibold text-navy-800">
            {user?.createdAt ? formatDate(user.createdAt.slice(0, 10)) : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  detail,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-sky-100/80 px-5 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-brand-blue">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-extrabold text-navy-900">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-navy-700/60">{detail}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function SecurityRow({
  icon,
  title,
  detail,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender-100 text-brand-purple">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-navy-800">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-navy-700/55">{detail}</p>
      </div>
      {action}
    </div>
  );
}
