import { Asset } from '../../models/index.js';
import { config } from '../../config/env.js';

export function buildAnalyticsScope(user, queryParams = {}) {
  const filter = {};
  if (user.role === 'OFFICER') filter.assigned_officer_id = user.id;
  if (user.role === 'MAINTENANCE') filter._id = { $in: [] };
  for (const [field, value] of Object.entries({ district: queryParams.district, taluka: queryParams.taluka, department: queryParams.department })) if (value) filter[field] = value;
  if (queryParams.type) filter.type = { $in: queryParams.type.split(',').map((item) => item.trim()) };
  return filter;
}

export async function getScopedAssets(user, queryParams) {
  return Asset.find(buildAnalyticsScope(user, queryParams)).lean();
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: config.appTimezone,
  year: 'numeric', month: '2-digit', day: '2-digit'
});

function partsInTimezone(date) {
  return Object.fromEntries(dateFormatter.formatToParts(date)
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, value]));
}

function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function localDateKey(date = new Date()) {
  const { year, month, day } = partsInTimezone(date);
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(dateKey, { days = 0, months = 0 } = {}) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay) + days);
  return date.toISOString().slice(0, 10);
}

function zonedBoundary(dateKey, endOfDay = false) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;
  const target = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let timestamp = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: config.appTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(timestamp))
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]));
    timestamp += target - Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  }
  return new Date(timestamp);
}

export function getAnalyticsDateRange(queryParams = {}, now = new Date()) {
  const toKey = isDateKey(queryParams.dateTo) ? queryParams.dateTo : localDateKey(now);
  let fromKey = isDateKey(queryParams.dateFrom) ? queryParams.dateFrom : shiftDateKey(toKey, { months: -12 });
  const earliestKey = shiftDateKey(toKey, { months: -36 });
  if (fromKey < earliestKey) fromKey = earliestKey;
  if (fromKey > toKey) fromKey = toKey;
  return {
    from: zonedBoundary(fromKey),
    to: zonedBoundary(toKey, true),
    filters: { ...queryParams, dateFrom: fromKey, dateTo: toKey }
  };
}

export function getMonthKey(date) {
  const { year, month } = partsInTimezone(date);
  return `${year}-${month}`;
}

export function getMonthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 12))
    .toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function getDateDifferenceInDays(from, to) {
  const fromKey = localDateKey(from);
  const toKey = localDateKey(to);
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86400000);
}
