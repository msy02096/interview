const externalUrlPattern = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

export function withBase(path: string, base = import.meta.env.BASE_URL ?? '/'): string {
  if (externalUrlPattern.test(path) || path.startsWith('#') || path.startsWith('mailto:')) {
    return path;
  }

  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedBasePath = normalizedBase === '/' ? '/' : normalizedBase.slice(0, -1);

  if (normalizedBasePath !== '/' && (path === normalizedBasePath || path.startsWith(normalizedBase))) {
    return path;
  }

  const relativePath = path.startsWith('/') ? path.slice(1) : path;

  return `${normalizedBase}${relativePath}`.replace(/\/{2,}/g, '/');
}