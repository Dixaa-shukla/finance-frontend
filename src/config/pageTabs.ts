import {
  ReceiptText,
  Sparkles,
  FolderOpen,
  ArrowLeftRight,
  Repeat,
  Tags,
  SlidersHorizontal,
} from 'lucide-react';
import type { PageTab } from '@/components/layout/PageTabs';

// Expenses sidebar item covers three pages.
export const EXPENSE_TABS: PageTab[] = [
  { label: 'Expenses', path: '/expenses', icon: ReceiptText },
  { label: 'AI Categorization', path: '/expenses/ai-categorization', icon: Sparkles },
  { label: 'Receipts', path: '/expenses/receipts', icon: FolderOpen },
];

// Transactions sidebar item covers the ledger and recurring rules.
export const TRANSACTION_TABS: PageTab[] = [
  { label: 'All Transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Recurring', path: '/transactions/recurring', icon: Repeat },
];

// Settings sidebar item covers preferences and categories.
export const SETTINGS_TABS: PageTab[] = [
  { label: 'Preferences', path: '/settings', icon: SlidersHorizontal },
  { label: 'Categories', path: '/settings/categories', icon: Tags },
];
