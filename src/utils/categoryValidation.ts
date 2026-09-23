import type { CategoryRequest } from '@/types/category';

export type CategoryFieldErrors = Partial<Record<keyof CategoryRequest, string>>;

const COLOR_HEX_PATTERN = /^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;


export function validateCategoryForm(
  values: CategoryRequest
): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.length > 50) {
    errors.name = 'Name must not exceed 50 characters.';
  }

  if (!values.type) {
    errors.type = 'Type is required.';
  }

  if (values.icon && values.icon.length > 50) {
    errors.icon = 'Icon must not exceed 50 characters.';
  }

  if (values.colorHex && !COLOR_HEX_PATTERN.test(values.colorHex)) {
    errors.colorHex = 'Use a hex colour like #FF5733 or #F53.';
  }

  return errors;
}

export function hasCategoryErrors(errors: CategoryFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
