import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { KeyRound, LogOut, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/api/authService';
import { profileService } from '@/api/profileService';

/**
 * Module 1 — Authentication & Security. The signed-in user's avatar + account menu.
 *
 * This is the ONLY place in the app that calls logout(). Without it the auth module
 * is a one-way door: you can sign in but never out, because clearing the tokens is
 * the only way to end a session (the JWT itself stays valid until it expires).
 *
 * What logout() does, in order (see AuthContext):
 *   1. POST /api/v1/auth/logout with the refresh token  -> 204, token revoked server-side
 *   2. clears localStorage
 *   3. flips status to 'signed-out', which makes ProtectedRoute send you to /login
 *
 * ⚠️ STEP 1 MATTERS. Only clearing localStorage would leave the refresh token alive
 * in the database for its full 14 days, so anyone who had copied it could keep
 * minting new access tokens. The server call revokes it.
 */
export function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'one' | 'all' | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Depend on the id, not the whole user object: AuthContext hands back a new
  // object on every refreshUser(), which would refetch the image for no reason.
  const userId = user?.id;

  useEffect(() => {
    let active = true;
    if (userId) {
      void profileService.getByUserId(userId).then((profile) => { if (active) setProfileImageUrl(profile.profilePictureUrl); }).catch(() => { if (active) setProfileImageUrl(null); });
    }
    function imageUpdated(event: Event) { const imageUrl = (event as CustomEvent<string>).detail; if (active && imageUrl) setProfileImageUrl(imageUrl); }
    window.addEventListener('nova-profile-image-updated', imageUpdated);
    return () => { active = false; window.removeEventListener('nova-profile-image-updated', imageUpdated); };
  }, [userId]);

  if (!user) return null;

  // "diksha@x.com" -> "D". Falls back so the circle is never empty.
  const initial = user.email.trim().charAt(0).toUpperCase() || '?';

  async function handleLogout() {
    setBusy('one');
    /*
     * No try/catch and no reset of `busy`: logout() swallows network errors itself
     * and always ends signed-out, so this component unmounts the moment it
     * resolves. Resetting state afterwards would be a write to an unmounted
     * component.
     */
    await logout();
  }

  /**
   * POST /auth/logout-all — revokes every refresh token for the account.
   *
   * ⚠️ THIS REVOKES THIS BROWSER'S TOKEN TOO, so it must be followed by a local
   * sign-out. Skipping that would leave the UI looking signed in until the access
   * token expired, then bounce the person to /login mid-task for no visible reason.
   */
  async function handleLogoutAll() {
    setBusy('all');
    try {
      await authService.logoutAll();
    } catch {
      // Ignored on purpose: whatever happened server-side, the right next step for
      // someone who just asked to be signed out everywhere is still to sign out
      // here. logout() below also revokes this device's token as a fallback.
    }
    await logout();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-sm font-bold text-white shadow-soft transition-transform hover:scale-105"
      >
        {profileImageUrl ? <img src={profileImageUrl} alt="Your profile" className="h-full w-full rounded-full object-cover" /> : initial}
      </button>

      {open && (
        <>
          {/*
           * Click-catcher instead of a document-level listener. Simpler, and it
           * cannot leak: it unmounts with the menu.
           */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            className="glass-card absolute right-0 top-12 z-20 w-64 overflow-hidden p-0"
          >
            <div className="border-b border-sky-200/70 px-4 py-3">
              <p className="truncate text-sm font-bold text-navy-900">
                {user.email}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-navy-700/50">
                {user.provider === 'GOOGLE' ? 'Google account' : 'Email account'}
              </p>

              {/* roles arrive WITHOUT the ROLE_ prefix — see types/auth.ts */}
              {isAdmin && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-pill bg-brand-purple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-purple">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
            </div>

            {/*
             * ⚠️ HIDDEN FOR GOOGLE ACCOUNTS. A GOOGLE-provider user has no local
             * password to change — AuthServiceImpl rejects the attempt — so
             * offering the link would only lead to an error they cannot fix.
             */}
            {user.provider !== 'GOOGLE' && (
              <Link
                to="/change-password"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-navy-700/80 transition-colors hover:bg-sky-100 hover:text-brand-blue"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={handleLogoutAll}
              disabled={busy !== null}
              className="flex w-full items-center gap-2.5 border-t border-sky-200/70 px-4 py-3 text-left text-sm font-semibold text-navy-700/80 transition-colors hover:bg-sky-100 hover:text-brand-blue disabled:opacity-60"
            >
              <MonitorSmartphone className="h-4 w-4" />
              {busy === 'all' ? 'Signing out…' : 'Sign out of all devices'}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={busy !== null}
              className="flex w-full items-center gap-2.5 border-t border-sky-200/70 px-4 py-3 text-left text-sm font-semibold text-navy-700/80 transition-colors hover:bg-sky-100 hover:text-red-500 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {busy === 'one' ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
