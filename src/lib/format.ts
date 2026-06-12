export function formatJmd(value: number | null | undefined) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

  return new Intl.NumberFormat('en-JM', {
    style: 'currency',
    currency: 'JMD',
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatNumber(value: number | null | undefined) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

  return new Intl.NumberFormat('en-JM').format(safe);
}

export function formatPercent(value: number | null | undefined) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

  return `${Math.max(0, Math.round(safe))}%`;
}

export function shortIdLabel(id: string | null | undefined, prefix = 'ORDER') {
  const value = String(id ?? '').trim();

  if (!value) return prefix;

  return value.length <= 6
    ? value.toUpperCase()
    : value.substring(0, 6).toUpperCase();
}

export function friendlyStatus(status: string | null | undefined) {
  const value = String(status ?? 'pending')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim()
    .toLowerCase();

  return value
    ? value.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Pending';
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-JM', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-JM', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatTime(value: string | null | undefined) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-JM', {
      timeStyle: 'short',
    }).format(date);
  }

  return value;
}

export function cleanHostedImageUrl(url: string | null | undefined) {
  const trimmed = String(url ?? '').trim();

  if (
    !trimmed ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined'
  ) {
    return null;
  }

  return trimmed;
}

export function normalizeCategory(category: unknown) {
  const raw = String(category ?? 'Vegetables').trim();

  if (!raw) return 'Vegetables';

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function safeEmailName(email: string | null | undefined) {
  const value = String(email ?? '').trim();

  if (!value.includes('@')) return titleCase(value) || 'Customer';

  return titleCase(value.split('@')[0].replace(/[._-]+/g, ' ')) || 'Customer';
}

export function titleCase(value: string | null | undefined) {
  const text = String(value ?? '').trim().toLowerCase();

  if (!text) return '';

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function truncateText(value: string | null | undefined, maxLength = 80) {
  const text = String(value ?? '').trim();

  if (!text) return '';

  if (text.length <= maxLength) return text;

  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function pluralize(
  count: number | null | undefined,
  singular: string,
  plural = `${singular}s`
) {
  const safe = Number.isFinite(Number(count)) ? Number(count) : 0;

  return safe === 1 ? singular : plural;
}

export function formatStockLabel(stock: number | null | undefined) {
  const safe = Number.isFinite(Number(stock)) ? Math.max(0, Math.trunc(Number(stock))) : 0;

  if (safe <= 0) return 'Out of stock';
  if (safe === 1) return 'Only 1 left';

  return `${safe} in stock`;
}