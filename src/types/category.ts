/**
 * Module 5 — Category Management.
 */

/** com.finance_backend.category.entity.CategoryType */
export type CategoryType = 'EXPENSE' | 'INCOME';

export const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
];

/** CategoryResponse — what every GET returns. */
export interface CategoryResponse {
  id: number;
  name: string;
  type: CategoryType;
  /** Optional; defaults to an emoji like "💰" and can be up to 50 characters. */
  icon: string | null;
  /** Optional; #RGB or #RRGGBB, max 7 chars. */
  colorHex: string | null;
  /** The `isDefault` flag — see the note above about the name. */
  default: boolean;
  /** null on default categories, the owner's id on custom ones. */
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * CategoryRequest is used for all category create and update requests.
 */
export interface CategoryRequest {
  name: string;
  type: CategoryType;
  icon: string | null;
  colorHex: string | null;
}

/**
 * Provides the basic fields needed to show a category in a picker.
 */
export interface CategoryOption {
  id: number;
  name: string;
  type: CategoryType;
}

export type CategoryScope = 'ALL' | CategoryType;

/** Suggested emojis for the icon field; users can also enter any text up to 50 characters. */
export const ICON_SUGGESTIONS = [
  '🍔', '🛍️', '🚗', '🎬', '💡', '🏠', '💰', '💼',
  '📈', '🎁', '✈️', '🏥', '📚', '🐾', '☕', '📱',
];

/**
 * Colour presets drawn from the NOVA palette. `colorHex` accepts any #RGB or
 * #RRGGBB value, so these are a shortcut rather than a restriction.
 */
export const COLOR_PRESETS = [
  '#3B6FE0',
  '#7B6EF6',
  '#3FC7E0',
  '#22B07D',
  '#5AA9F0',
  '#F2994A',
  '#EB5757',
  '#9B51E0',
];
