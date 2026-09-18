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

/** Inverse of `parseOrderDate`: emits the backend's "DD-MM-YYYYTHH:mm:ss+07:00". */
export function formatOrderDateString(date: Date): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+07:00`;
}

// ---------------------------------------------------------------------------
// Create-order form
// ---------------------------------------------------------------------------

export const CUSTOMER_SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: "Facebook", value: "FACEBOOK" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Zalo", value: "ZALO" },
  { label: "Tiktok", value: "TIKTOK" },
  { label: "Telegram", value: "TELEGRAM" },
  { label: "Hotline", value: "HOTLINE" },
  { label: "Cửa Hàng", value: "REGULAR_CUSTOMER" },
  { label: "Nhân Viên", value: "CUSTOMER" },
  { label: "Bắn Đơn", value: "EMAIL" },
  { label: "Khác", value: "OTHER" },
];

export const DELIVERY_FEE_OPTIONS: {
  value: number;
  label: string;
  hint: string;
}[] = [
  {
    value: 0,
    label: "Cửa hàng trả",
    hint: "Phí ship sẽ được thêm vào bảng chi tiêu của cửa hàng",
  },
  {
    value: 1,
    label: "Khách trả",
    hint: "Phí ship do khách trả, cửa hàng không phát sinh chi tiêu cho việc này",
  },
  {
    value: 2,
    label: "Khách trả tính VAT",
    hint: "Phí ship do khách trả, tính gộp vào VAT, cửa hàng không phát sinh chi tiêu cho việc này",
  },
];

export const VAT_OPTIONS = [0, 5, 8] as const;

export const ORDER_IMAGE_LIMITS = {
  maxFiles: 10,
  maxSizeMb: 4,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export interface OrderFormValues {
  customerName: string;
  customerPhone: string;
  socialLink: string;
  customerSource: string;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  deliveryDateStart: Date;
  deliveryDateEnd: Date;
  /** Minutes before deliveryDateStart the order should be finished. */
  estimateStartMinutes: string;
  saleAccount: string;
  floristAccount: string;
  /** Money inputs are held as raw digit strings ("1500000"). */
  actualPrice: string;
  discount: string;
  deliveryFee: string;
  deposit: string;
  deliveryFeeOption: number;
  vatFeeOption: number;
  orderDescription: string;
  customerRemark: string;
  bannerContent: string;
  images: File[];
}

export function createEmptyOrderFormValues(): OrderFormValues {
  const now = new Date();
  return {
    customerName: "",
    customerPhone: "",
    socialLink: "",
    customerSource: "FACEBOOK",
    deliveryAddress: "",
    receiverName: "",
    receiverPhone: "",
    deliveryDateStart: now,
    deliveryDateEnd: now,
    estimateStartMinutes: "",
    saleAccount: "",
    floristAccount: "",
    actualPrice: "",
    discount: "",
    deliveryFee: "",
    deposit: "",
    deliveryFeeOption: 0,
    vatFeeOption: 0,
    orderDescription: "",
    customerRemark: "",
    bannerContent: "",
    images: [],
  };
}

export function toDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function parseMoney(raw: string): number {
  const digits = toDigits(raw);
  return digits === "" ? 0 : Number(digits);
}

const numberFormatter = new Intl.NumberFormat("vi-VN");

/** "1500000" -> "1.500.000" for display inside a text input. */
export function formatMoneyInput(raw: string): string {
  const digits = toDigits(raw);
  return digits === "" ? "" : numberFormatter.format(Number(digits));
}

export interface OrderTotals {
  vatFee: number;
  salePrice: number;
  totalAmount: number;
  remainingAmount: number;
}

/**
 * Same rules as the florist-fe order form: delivery fee is added to the total
 * only when the customer pays it (option 1/2), and is VAT-able only for
 * option 2; VAT is a percentage of the sale price (+ delivery fee for option 2).
 */
export function computeOrderTotals(values: OrderFormValues): OrderTotals {
  const listPrice = parseMoney(values.actualPrice);
  const deliveryFee = parseMoney(values.deliveryFee);
  const discount = parseMoney(values.discount);
  const deposit = parseMoney(values.deposit);
  const { deliveryFeeOption, vatFeeOption } = values;

  const salePrice = listPrice - discount;
  let totalAmount = salePrice;
  let vatFee = (salePrice * vatFeeOption) / 100;

  if (deliveryFeeOption === 1 || deliveryFeeOption === 2) {
    totalAmount += deliveryFee;
  }
  if (deliveryFeeOption === 2) {
    vatFee += (deliveryFee * vatFeeOption) / 100;
  }
  totalAmount += vatFee;

  return {
    vatFee,
    salePrice,
    totalAmount,
    remainingAmount: totalAmount - deposit,
  };
}

/** Returns the first validation message (Vietnamese, user-facing) or null. */
export function validateOrder(values: OrderFormValues): string | null {
  if (values.customerName.trim() === "") return "Chưa nhập tên khách hàng";
  if (values.customerPhone.trim() === "") {
    return "Chưa nhập số điện thoại khách hàng";
  }
  if (toDigits(values.actualPrice) === "") return "Chưa nhập giá niêm yết";
  if (values.deliveryAddress.trim() === "")
    return "Chưa nhập địa chỉ giao hàng";
  if (values.images.length === 0) return "Thiếu file ảnh mẫu";
  if (values.saleAccount.trim() === "") {
    return "Nhân viên sale không được để rỗng";
  }
  const source = values.customerSource.toLowerCase();
  if (
    (source === "facebook" || source === "instagram") &&
    values.socialLink.trim() === ""
  ) {
    return "Facebook, Instagram không được để rỗng mạng xã hội";
  }
  if (values.deliveryDateStart.getTime() > values.deliveryDateEnd.getTime()) {
    return "Ngày bắt đầu không thể muộn hơn ngày kết thúc";
  }
  return null;
}

export function buildOrder(
  values: OrderFormValues,
  samplePictureLink: string[],
): CreateOrderPayload {
  const totals = computeOrderTotals(values);
  const estimateMinutes = parseMoney(values.estimateStartMinutes);
  const floristAccount = values.floristAccount.trim();

  return {
    customerName: values.customerName.trim(),
    deliveryAddress: values.deliveryAddress.trim(),
    customerPhone: values.customerPhone.trim(),
    socialLink: values.socialLink.trim() || "none",
    deliveryDateStart: formatOrderDateString(values.deliveryDateStart),
    deliveryDateEnd: formatOrderDateString(values.deliveryDateEnd),
    ...(estimateMinutes > 0 && {
      estimateStart: formatOrderDateString(
        new Date(values.deliveryDateStart.getTime() - estimateMinutes * 60_000),
      ),
    }),
    customerSource: values.customerSource,
    receiverName: values.receiverName.trim(),
    receiverPhone: values.receiverPhone.trim(),
    samplePictureLink,
    orderDescription: values.orderDescription.trim(),
    customerRemark: values.customerRemark.trim(),
    bannerContent: values.bannerContent.trim(),
    actualPrice: parseMoney(values.actualPrice),
    deliveryFee: parseMoney(values.deliveryFee),
    deliveryFeeOption: values.deliveryFeeOption,
    discountAmount: parseMoney(values.discount),
    vatFee: totals.vatFee,
    vatFeeOption: values.vatFeeOption,
    salePrice: totals.salePrice,
    remainingAmount: totals.remainingAmount,
    depositAmount: parseMoney(values.deposit),
    totalAmount: totals.totalAmount,
    saleAccount: values.saleAccount.trim(),
    ...(floristAccount !== "" && { floristAccount }),
  };
}
