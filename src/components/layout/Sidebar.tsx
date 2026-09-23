import { Link, useLocation } from 'react-router';
import { Sparkle, ArrowRight } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';

// The NOVA AI FINANCE sidebar.
// The item list lives in config/navigation.ts so the nav and routes stay in sync.
// Branding sits on top, links scroll in the middle, AI card is pinned at the bottom.
interface SidebarProps {
  // The drawer version shown on small screens.
  mobile?: boolean;
  // Lets the mobile drawer close itself after a link is clicked.
  onNavigate?: () => void;
}
export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Admin Panel is only for admins, so it is left out for everyone else.
  const items = NAV_ITEMS.filter((item) => !item.requiresAdmin || isAdmin);

  return (
    <aside
      className={
        mobile
          ? 'sidebar-shell flex h-full w-[268px] flex-col border-r border-white/70 bg-white/85 backdrop-blur-xl'
          : 'sidebar-shell sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-white/70 bg-white/50 backdrop-blur-xl lg:flex'
      }
    >
      {/* Branding stays at the top. */}
      <div className="px-6 pb-7 pt-8">
        <Link to="/dashboard" onClick={onNavigate} className="block">
          <span className="relative inline-block">
            <span className="bg-gradient-to-br from-[#0b1f5e] via-[#1f4bb8] to-brand-blue bg-clip-text text-[30px] font-extrabold leading-none tracking-[-0.055em] text-transparent">
              NOVA
            </span>
            <Sparkle
              aria-hidden="true"
              className="absolute -right-[18px] -top-1 h-4 w-4 fill-brand-cyan/30 text-brand-cyan"
            />
          </span>
          <p className="mt-1.5 text-[12px] font-bold tracking-[0.28em] text-brand-blue/70">
            AI FINANCE
          </p>
          <p className="mt-2 text-[10px] font-semibold leading-snug text-navy-700/45">
            AI-Powered Personal Finance Management
          </p>
        </Link>
      </div>

      {/* Links scroll if the list is taller than the screen. */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 pb-3">
        {items.map(({ label, path, icon: Icon, built, requiresAdmin }, index) => {
          // A link is active on its own path and on any page nested under it.
          const active =
            location.pathname === path || location.pathname.startsWith(`${path}/`);

          // A divider above Admin Panel, matching the sidebar layout.
          const dividerAbove = !!requiresAdmin && index > 0;

          return (
            <div key={path}>
              {dividerAbove && <hr className="my-2 border-sky-100" />}
              <Link
                to={path}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-[11px] text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky text-white shadow-glow'
                    : 'text-[#1b3d8f] hover:bg-white/80 hover:shadow-soft'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
                    active ? '' : 'text-brand-blue/70 group-hover:scale-110'
                  }`}
                />
                <span className="flex-1 leading-tight">{label}</span>

                {/* Marks a link whose page is not built yet. */}
                {!built && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      active ? 'bg-white/25 text-white' : 'bg-sky-100 text-navy-700/40'
                    }`}
                  >
                    Soon
                  </span>
                )}

                {/* Small white dot on the active link. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/90"
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* AI Assistant card stays at the bottom. */}
      <div className="px-3.5 pb-5 pt-1">
        <CrystalArt />

        <div className="glass-card mt-1 border-white/80 p-4">
          <p className="text-sm font-extrabold text-navy-900">AI Assistant</p>
          <p className="mt-1 text-[11px] leading-relaxed text-navy-700/60">
            Your smart finance companion
          </p>
          <Link
            to="/ai-assistant"
            onClick={onNavigate}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-sky py-2.5 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
          >
            Chat with Nova AI
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

/**
 * The crystal-on-a-pedestal illustration from the reference design.
 *
 * Built from clip-path gradients rather than an image file so it scales, costs no
 * network request, and recolours with the brand tokens. Two facets plus a
 * highlight give it the faceted-gem look; the pedestal carries a soft reflection.
 * Ornamental → aria-hidden.
 */
function CrystalArt() {
  return (
    <div aria-hidden="true" className="relative flex h-[126px] items-end justify-center">
      {/* Glow behind the crystal */}
      <span className="absolute bottom-6 h-24 w-24 rounded-full bg-brand-purple/30 blur-2xl" />
      <span className="absolute bottom-8 h-16 w-16 rounded-full bg-brand-cyan/25 blur-xl" />

      {/* Crystal body */}
      <span
        className="absolute bottom-7 h-[86px] w-[74px] bg-gradient-to-br from-white via-brand-purple/45 to-brand-blue/65 shadow-glass"
        style={{ clipPath: 'polygon(50% 0%, 88% 32%, 74% 100%, 26% 100%, 12% 32%)' }}
      />
      {/* Lit left facet, so the gem reads as faceted rather than flat */}
      <span
        className="absolute bottom-7 h-[86px] w-[74px] bg-gradient-to-b from-white/95 to-white/10"
        style={{ clipPath: 'polygon(50% 0%, 50% 100%, 26% 100%, 12% 32%)' }}
      />
      {/* Specular highlight */}
      <span
        className="absolute bottom-[62px] left-1/2 h-4 w-2 -translate-x-[14px] rotate-[18deg] rounded-full bg-white/80 blur-[1px]"
      />

      {/* Pedestal + its reflection */}
      <span className="absolute bottom-3 h-5 w-28 rounded-[50%] bg-gradient-to-r from-white/60 via-white/95 to-white/60 shadow-soft" />
      <span className="absolute bottom-1 h-2.5 w-20 rounded-[50%] bg-brand-blue/12 blur-sm" />

      <Sparkle className="absolute right-3 top-0 h-4 w-4 fill-brand-cyan/25 text-brand-cyan/80" />
      <Sparkle className="absolute left-3 top-7 h-3 w-3 fill-brand-purple/25 text-brand-purple/70" />
      <Sparkle className="absolute right-8 top-12 h-2.5 w-2.5 text-brand-blue/50" />
    </div>
  );
}
