const stripTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname) return null;
    return stripTrailingSlash(parsed.origin);
  } catch {
    return null;
  }
};

export const resolvePublicAppUrl = (request: Request): string => {
  const envCandidates = [
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_APP_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of envCandidates) {
    if (!candidate) continue;
    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return stripTrailingSlash(new URL(request.url).origin);
};
