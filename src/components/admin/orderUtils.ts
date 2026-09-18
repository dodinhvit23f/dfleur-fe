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

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function formatVnd(value: number): string {
  return vndFormatter.format(value);
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

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function filterOrders(
  orders: Order[],
  filters: OrdersFilterState,
): Order[] {
  const search = filters.search.trim().toLowerCase();
  const rangeStart = filters.deliveryStart
    ? startOfDay(filters.deliveryStart).getTime()
    : null;
  const rangeEnd = filters.deliveryEnd
    ? endOfDay(filters.deliveryEnd).getTime()
    : null;

  return orders.filter((order) => {
    if (search) {
      const haystack = [
        order.orderCode,
        order.customerName,
        order.receiverName,
        order.customerPhone,
        order.receiverPhone,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(order.status)
    ) {
      return false;
    }

    if (
      filters.salers.length > 0 &&
      !filters.salers.includes(order.saleAccount)
    ) {
      return false;
    }

    if (
      filters.florists.length > 0 &&
      !filters.florists.includes(order.floristAccount ?? "")
    ) {
      return false;
    }

    if (rangeStart !== null || rangeEnd !== null) {
      const deliveryTime = parseOrderDate(order.deliveryDateStart).getTime();
      if (Number.isNaN(deliveryTime)) return false;
      if (rangeStart !== null && deliveryTime < rangeStart) return false;
      if (rangeEnd !== null && deliveryTime > rangeEnd) return false;
    }

    return true;
  });
}
