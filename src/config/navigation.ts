import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  PiggyBank,
  Target,
  ArrowLeftRight,
  ChartLine,
  Bot,
  ChartPie,
  Bell,
  CircleUserRound,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { ComponentType } from 'react';

// One sidebar item. Some modules are reached from inside a page instead of here.
export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  built?: boolean;
  // Admin-only items are hidden from everyone else.
  requiresAdmin?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, built: true },
  { label: 'Expenses', path: '/expenses', icon: ReceiptText, built: true },
  { label: 'Income', path: '/income', icon: TrendingUp, built: true },
  { label: 'Budget Planner', path: '/budgets', icon: PiggyBank, built: true },
  { label: 'Goals', path: '/goals', icon: Target, built: true },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, built: true },
  { label: 'Investments', path: '/investments', icon: ChartLine, built: true },
  { label: 'AI Assistant', path: '/ai-assistant', icon: Bot, built: true },
  { label: 'Reports', path: '/ai-analytics', icon: ChartPie, built: true },
  { label: 'Notifications', path: '/notifications', icon: Bell, built: true },
  { label: 'Profile', path: '/profile', icon: CircleUserRound, built: true },
  { label: 'Settings', path: '/settings', icon: Settings, built: true },
  { label: 'Admin Panel', path: '/admin', icon: ShieldCheck, built: true, requiresAdmin: true },
];
