export type OrderStatus =
  | "pending"
  | "in_process"
  | "done_process"
  | "in_delivery"
  | "done_delivery"
  | "in_debit"
  | "done"
  | "cancel";

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "pending",
  "in_process",
  "done_process",
  "in_delivery",
  "done_delivery",
  "in_debit",
  "done",
  "cancel",
];

export interface Order {
  version: number;
  orderCode: string;
  customerName: string;
  deliveryAddress: string;
  customerPhone: string;
  socialLink: string;
  deliveryDateStart: string;
  deliveryDateEnd: string;
  estimateStart?: string;
  customerSource: string;
  receiverName: string;
  receiverPhone: string;
  samplePictureLink: string[];
  orderDescription?: string;
  customerRemark?: string;
  bannerContent?: string;
  actualPrice: number;
  deliveryFee: number;
  deliveryFeeOption: number;
  discountAmount: number;
  vatFee: number;
  vatFeeOption: number;
  salePrice: number;
  remainingAmount: number;
  depositAmount: number;
  totalAmount: number;
  saleAccount: string;
  floristAccount?: string;
  status: OrderStatus;
}

/** What the backend accepts on create — it assigns orderCode, status and version. */
export type CreateOrderPayload = Omit<
  Order,
  "orderCode" | "status" | "version"
>;

/**
 * What the backend accepts on update: the full order again, identified by
 * `orderCode`, with the `version` it was loaded at (optimistic lock) and the
 * unchanged `status`. `editor` is the account making the change.
 */
export type UpdateOrderPayload = CreateOrderPayload &
  Pick<Order, "orderCode" | "status" | "version"> & { editor?: string };

export interface OrdersApiResponse {
  traceId: string;
  data: {
    page: number;
    totalPage: number;
    pageSize: number;
    list: Order[];
  };
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string }> = {
  pending: { label: "Chờ xử lý" },
  in_process: { label: "Đang xử lý" },
  done_process: { label: "Đã chuẩn bị" },
  in_delivery: { label: "Đang giao" },
  done_delivery: { label: "Đã giao" },
  in_debit: { label: "Chờ công nợ" },
  done: { label: "Hoàn thành" },
  cancel: { label: "Đã huỷ" },
};

export const ORDER_STATUS_OPTIONS = Object.keys(
  ORDER_STATUS_META,
) as OrderStatus[];

export function trans(key: string): string {
  return ORDER_STATUS_META[key as OrderStatus]?.label ?? key;
}

export type OrderStatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "cancelled";

const STATUS_VARIANT_MAP: Record<OrderStatus, OrderStatusVariant> = {
  pending: "error",
  in_process: "error",
  done_process: "warning",
  in_delivery: "warning",
  done_delivery: "warning",
  in_debit: "info",
  done: "success",
  cancel: "cancelled",
};

export function getStatusType(rawStatus: string): OrderStatusVariant {
  const normalized = rawStatus.toLowerCase() as OrderStatus;
  return STATUS_VARIANT_MAP[normalized] ?? "error";
}

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  in_process: 1,
  done_process: 2,
  in_delivery: 3,
  done_delivery: 4,
  in_debit: 5,
  done: 6,
  cancel: 7,
};

export function compareOrderStatus(a: OrderStatus, b: OrderStatus): number {
  const rankA = STATUS_RANK[a.toLowerCase()] ?? 99;
  const rankB = STATUS_RANK[b.toLowerCase()] ?? 99;
  return rankA - rankB;
}

const ORDER_DATE_RE =
  /^(\d{2})-(\d{2})-(\d{4})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})$/;

/**
 * Order dates come back as "DD-MM-YYYYTHH:mm:ss+07:00" (day/month swapped
 * relative to ISO 8601) — `new Date()` misparses this silently, so rewrite
 * to a real ISO string first.
 */
export function parseOrderDate(raw: string): Date {
  const match = ORDER_DATE_RE.exec(raw);
  if (!match) return new Date(Number.NaN);
  const [, dd, mm, yyyy, hh, min, ss, offset] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${offset}`);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatOrderDate(raw: string): string {
  const date = parseOrderDate(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatOrderTimeRange(start: string, end: string): string {
  const startDate = parseOrderDate(start);
  const endDate = parseOrderDate(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "—";
  }
  const startLabel = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
  const endLabel = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
}

const deliveryTime = (raw: string): number => {
  const time = parseOrderDate(raw).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

/** Newest delivery start first, ties broken by newest delivery end; unparseable dates last. */
export function compareOrdersByDeliveryDesc(a: Order, b: Order): number {
  const byStart =
    deliveryTime(b.deliveryDateStart) - deliveryTime(a.deliveryDateStart);
  if (byStart !== 0 && !Number.isNaN(byStart)) return byStart;
  const byEnd =
    deliveryTime(b.deliveryDateEnd) - deliveryTime(a.deliveryDateEnd);
  return Number.isNaN(byEnd) ? 0 : byEnd;
}

/** Of two copies of the same order, the one with the higher version (the incoming one on a tie). */
export function pickNewerOrder(current: Order, incoming: Order): Order {
  return incoming.version >= current.version ? incoming : current;
}

/**
 * Adds `order` and re-sorts by delivery time, newest first. A row with the same
 * code is replaced unless the existing copy has a newer version.
 */
export function insertOrderSorted(orders: Order[], order: Order): Order[] {
  const existing = orders.find((row) => row.orderCode === order.orderCode);
  return [
    ...orders.filter((row) => row.orderCode !== order.orderCode),
    existing ? pickNewerOrder(existing, order) : order,
  ].sort(compareOrdersByDeliveryDesc);
}

/**
 * Puts `order` in place of the row with the same `orderCode` (found by code, so
 * it works wherever the row currently sits) and keeps its position. The existing
 * row wins if it has a newer version; an unknown code leaves the list unchanged.
 */
export function replaceOrderByCode(orders: Order[], order: Order): Order[] {
  const index = orders.findIndex((row) => row.orderCode === order.orderCode);
  if (index === -1) return orders;
  const next = [...orders];
  next[index] = pickNewerOrder(orders[index], order);
  return next;
}

/**
 * Merges a fetched page into the rows currently shown, row by row: a row with a
 * mutation in flight (`lockedCodes`) keeps its local copy, otherwise the higher
 * version wins. Order and membership follow the fetched page.
 */
export function mergeFetchedOrders(
  local: Order[],
  fetched: Order[],
  lockedCodes: ReadonlySet<string>,
): Order[] {
  const localByCode = new Map(local.map((row) => [row.orderCode, row]));
  return fetched.map((row) => {
    const current = localByCode.get(row.orderCode);
    if (!current) return row;
    return lockedCodes.has(row.orderCode)
      ? current
      : pickNewerOrder(current, row);
  });
}

export interface DeliveryWindow {
  /** True when start and end fall on the same calendar day (or one is unparseable). */
  sameDay: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

/** Start/end date and time labels for the table's delivery cells. */
export function getDeliveryWindow(start: string, end: string): DeliveryWindow {
  const startDate = parseOrderDate(start);
  const endDate = parseOrderDate(end);
  const startValid = !Number.isNaN(startDate.getTime());
  const endValid = !Number.isNaN(endDate.getTime());
  const time = (date: Date, valid: boolean) =>
    valid ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "—";
  const sameDay =
    !startValid ||
    !endValid ||
    (startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate());
  return {
    sameDay,
    startDate: formatOrderDate(start),
    endDate: formatOrderDate(end),
    startTime: time(startDate, startValid),
    endTime: time(endDate, endValid),
  };
}

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function formatVnd(value: number): string {
  return vndFormatter.format(value);
}

const clean = (value: string | null | undefined): string => value?.trim() ?? "";
const digitsOnly = (value: string | null | undefined): string =>
  clean(value).replace(/\D/g, "");

/** "Name · Phone", skipping whichever part is missing (null/undefined/blank). */
export function formatContact(
  name: string | null | undefined,
  phone: string | null | undefined,
): string {
  return [clean(name), clean(phone)].filter(Boolean).join(" · ");
}

/**
 * The customer's "Name · Phone" when the customer is a different person from
 * the receiver, otherwise null (nothing extra worth showing). The customer is
 * treated as the receiver when their name OR their phone matches the receiver's
 * (names case-insensitively, phones by digits only) — a phone typo shouldn't
 * make the same person show up twice. A customer with no name and no phone
 * yields null.
 */
export function getExtraCustomerContact(order: Order): string | null {
  const name = clean(order.customerName);
  const phone = clean(order.customerPhone);
  if (!name && !phone) return null;

  const receiverName = clean(order.receiverName);
  const receiverPhone = digitsOnly(order.receiverPhone);
  const sameName =
    name !== "" && name.toLowerCase() === receiverName.toLowerCase();
  const samePhone =
    digitsOnly(phone) !== "" && digitsOnly(phone) === receiverPhone;
  if (sameName || samePhone) return null;

  return formatContact(name, phone);
}

export function hasSocialLink(socialLink: string | undefined): boolean {
  return Boolean(socialLink) && socialLink !== "None";
}

export function hasSamplePicture(links: string[] | undefined): boolean {
  return Boolean(links && links.length > 0 && links[0] && links[0] !== "null");
}

export interface OrdersFilterState {
  search: string;
  deliveryStart: Date | null;
  deliveryEnd: Date | null;
  statuses: OrderStatus[];
  salers: string[];
  florists: string[];
}

export const emptyOrdersFilterState: OrdersFilterState = {
  search: "",
  deliveryStart: null,
  deliveryEnd: null,
  statuses: [],
  salers: [],
  florists: [],
};

export function hasActiveOrdersFilters(filters: OrdersFilterState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.deliveryStart !== null ||
    filters.deliveryEnd !== null ||
    filters.statuses.length > 0 ||
    filters.salers.length > 0 ||
    filters.florists.length > 0
  );
}

function sameDate(a: Date | null, b: Date | null): boolean {
  if (a === null || b === null) return a === b;
  return a.getTime() === b.getTime();
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function areOrdersFiltersEqual(
  a: OrdersFilterState,
  b: OrdersFilterState,
): boolean {
  return (
    a.search.trim() === b.search.trim() &&
    sameDate(a.deliveryStart, b.deliveryStart) &&
    sameDate(a.deliveryEnd, b.deliveryEnd) &&
    sameList(a.statuses, b.statuses) &&
    sameList(a.salers, b.salers) &&
    sameList(a.florists, b.florists)
  );
}

/** Inverse of `parseOrderDate`: emits the backend's "DD-MM-YYYYTHH:mm:ss+07:00". */
export function formatOrderDateString(date: Date): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+07:00`;
}
