interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string | null;
}

/**
 * Renders the saved profile image when one exists, otherwise initials on a
 * gradient tile so every account has a polished fallback.
 */
export function Avatar({ name, size = 64, imageUrl }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

  if (imageUrl) return <img src={imageUrl} alt={`${name}'s profile`} className="rounded-2xl object-cover shadow-soft" style={{ width: size, height: size }} />;

  return (
    <div
      className="flex items-center justify-center rounded-2xl font-bold text-white shadow-soft"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: 'linear-gradient(135deg, #3B6FE0 0%, #7B6EF6 100%)',
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
