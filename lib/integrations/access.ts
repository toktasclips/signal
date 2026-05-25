function normalizeEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

function matchesOwner(email: string | null | undefined, ownerEmail?: string): boolean {
  const normalizedOwner = normalizeEmail(ownerEmail);
  return Boolean(normalizedOwner && normalizeEmail(email) === normalizedOwner);
}

export function isStripeSyncOwner(email?: string | null): boolean {
  return matchesOwner(email, process.env.STRIPE_SYNC_USER_EMAIL);
}

export function isMetaSyncOwner(email?: string | null): boolean {
  return matchesOwner(
    email,
    process.env.META_SYNC_USER_EMAIL ?? process.env.STRIPE_SYNC_USER_EMAIL
  );
}

export function canUseExternalSync(email?: string | null): boolean {
  return isStripeSyncOwner(email) || isMetaSyncOwner(email);
}
