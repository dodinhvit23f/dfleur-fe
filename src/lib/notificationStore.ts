import type { OrderEventType } from "./api/orderSse";
import { STORAGE_KEYS } from "./storage";

export interface StoredOrderNotification {
  id: string;
  eventType: OrderEventType;
  orderCode: string;
  actor: string;
  message: string;
  receivedAt: number;
  read: boolean;
}

export const NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CAP = 200;

function isExpired(n: StoredOrderNotification, now: number): boolean {
  return now - n.receivedAt > NOTIFICATION_TTL_MS;
}

/** Non-expired notifications, newest first. Expiry is lazy: filtered on every
 *  read, not actively swept — acceptable given the list is capped. */
export function readNotifications(): StoredOrderNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return (parsed as StoredOrderNotification[]).filter(
      (n) => !isExpired(n, now),
    );
  } catch {
    return [];
  }
}

function writeNotifications(list: StoredOrderNotification[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
}

export function addNotification(
  n: StoredOrderNotification,
  cap = DEFAULT_CAP,
): StoredOrderNotification[] {
  const next = [n, ...readNotifications()].slice(0, cap);
  writeNotifications(next);
  return next;
}

/** Batch variant: one stringify+setItem for a whole flushed event batch,
 *  instead of one per event — see OrderNotificationProvider's flush(). */
export function addNotifications(
  list: StoredOrderNotification[],
  cap = DEFAULT_CAP,
): StoredOrderNotification[] {
  if (list.length === 0) return readNotifications();
  const next = [...list, ...readNotifications()].slice(0, cap);
  writeNotifications(next);
  return next;
}

export function markRead(id: string): StoredOrderNotification[] {
  const next = readNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  writeNotifications(next);
  return next;
}

export function markAllRead(): StoredOrderNotification[] {
  const next = readNotifications().map((n) => ({ ...n, read: true }));
  writeNotifications(next);
  return next;
}

export function clearNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
}
