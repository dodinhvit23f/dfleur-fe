import {
  type CreateOrderPayload,
  formatOrderDateString,
  hasSocialLink,
  type Order,
  parseOrderDate,
} from "./orderUtils";

// ---------------------------------------------------------------------------
// Order form domain: values, totals, validation, mapping to/from the API model.
// Shared by the create and the update flows.
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

/** An already-uploaded image (its URL) or a new file picked in the form. */
export type OrderImage = string | File;

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
  saleAccounts: string[];
  floristAccounts: string[];
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
  /** Existing URLs and new Files in display order; only Files get uploaded. */
  images: OrderImage[];
}

/** Vietnamese labels (as shown in the form); also the list of all form fields. */
export const ORDER_FIELD_LABELS: Record<keyof OrderFormValues, string> = {
  customerName: "Tên người đặt",
  customerPhone: "Số điện thoại người đặt",
  socialLink: "Đường dẫn mạng xã hội",
  customerSource: "Nguồn khách hàng",
  deliveryAddress: "Địa chỉ giao",
  receiverName: "Tên người nhận",
  receiverPhone: "Số điện thoại người nhận",
  deliveryDateStart: "Thời gian sớm nhất để giao",
  deliveryDateEnd: "Thời gian muộn nhất phải giao",
  estimateStartMinutes: "Hoàn thành trước khi giao (phút)",
  saleAccounts: "Nhân viên sale",
  floristAccounts: "Nhân viên florist",
  actualPrice: "Giá niêm yết",
  discount: "Chiết khấu",
  deliveryFee: "Phí giao hàng",
  deposit: "Số tiền đặt cọc",
  deliveryFeeOption: "Bên trả phí vận chuyển",
  vatFeeOption: "Phần trăm VAT",
  orderDescription: "Mô tả đơn hàng",
  customerRemark: "Ghi chú của khách",
  bannerContent: "Nội dung banner",
  images: "Ảnh mẫu",
};

const ORDER_FORM_FIELDS = Object.keys(
  ORDER_FIELD_LABELS,
) as (keyof OrderFormValues)[];

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
    saleAccounts: [],
    floristAccounts: [],
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

/** "a, b" <-> ["a", "b"]: staff accounts travel comma-joined on the wire. */
export function splitAccounts(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((account) => account.trim())
    .filter(Boolean);
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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type OrderFormErrors = Partial<Record<keyof OrderFormValues, string>>;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

/**
 * Field-level validation (Vietnamese, user-facing messages). Keys are inserted
 * in priority order, so the first one is the message to toast. Empty = valid.
 */
export function validateOrder(values: OrderFormValues): OrderFormErrors {
  const errors: OrderFormErrors = {};

  if (values.customerName.trim() === "") {
    errors.customerName = "Chưa nhập tên khách hàng";
  }
  if (values.customerPhone.trim() === "") {
    errors.customerPhone = "Chưa nhập số điện thoại khách hàng";
  }
  if (toDigits(values.actualPrice) === "") {
    errors.actualPrice = "Chưa nhập giá niêm yết";
  }
  if (values.deliveryAddress.trim() === "") {
    errors.deliveryAddress = "Chưa nhập địa chỉ giao hàng";
  }
  if (values.images.length === 0) {
    errors.images = "Thiếu file ảnh mẫu";
  } else if (values.images.length > ORDER_IMAGE_LIMITS.maxFiles) {
    errors.images = `Tối đa ${ORDER_IMAGE_LIMITS.maxFiles} ảnh`;
  }
  if (values.saleAccounts.length === 0) {
    errors.saleAccounts = "Nhân viên sale không được để rỗng";
  }
  const source = values.customerSource.toLowerCase();
  if (
    (source === "facebook" || source === "instagram") &&
    values.socialLink.trim() === ""
  ) {
    errors.socialLink = "Facebook, Instagram không được để rỗng mạng xã hội";
  }
  if (!isValidDate(values.deliveryDateStart)) {
    errors.deliveryDateStart = "Thời gian bắt đầu giao không hợp lệ";
  }
  if (!isValidDate(values.deliveryDateEnd)) {
    errors.deliveryDateEnd = "Thời gian kết thúc giao không hợp lệ";
  } else if (
    isValidDate(values.deliveryDateStart) &&
    values.deliveryDateStart.getTime() > values.deliveryDateEnd.getTime()
  ) {
    errors.deliveryDateEnd = "Ngày bắt đầu không thể muộn hơn ngày kết thúc";
  }
  if (parseMoney(values.discount) > parseMoney(values.actualPrice)) {
    errors.discount = "Chiết khấu không được lớn hơn giá niêm yết";
  } else if (
    parseMoney(values.deposit) > computeOrderTotals(values).totalAmount
  ) {
    errors.deposit = "Tiền đặt cọc không được lớn hơn tổng giá trị đơn hàng";
  }

  return errors;
}

/** The message to toast for a set of validation errors, or null when valid. */
export function firstOrderError(errors: OrderFormErrors): string | null {
  return Object.values(errors)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Form values <-> API model
// ---------------------------------------------------------------------------

export function buildOrder(
  values: OrderFormValues,
  samplePictureLink: string[],
): CreateOrderPayload {
  const totals = computeOrderTotals(values);
  const estimateMinutes = parseMoney(values.estimateStartMinutes);
  const floristAccount = values.floristAccounts.join(",");

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
    saleAccount: values.saleAccounts.join(","),
    ...(floristAccount !== "" && { floristAccount }),
  };
}

// 0 shows as an empty input (same value once parsed back by `parseMoney`).
const moneyToDigits = (amount: number | null | undefined): string =>
  amount && amount > 0 ? String(Math.round(amount)) : "";

/**
 * Inverse of `buildOrder` for editing: everything the form shows comes from the
 * order, so an untouched form round-trips to the same payload. Totals (VAT, sale
 * price, …) are recomputed from these inputs, not read back.
 */
export function orderToFormValues(order: Order): OrderFormValues {
  const start = parseOrderDate(order.deliveryDateStart);
  const estimate = order.estimateStart
    ? parseOrderDate(order.estimateStart)
    : null;
  const estimateMinutes =
    estimate && isValidDate(estimate) && isValidDate(start)
      ? Math.round((start.getTime() - estimate.getTime()) / 60_000)
      : 0;

  return {
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    socialLink: hasSocialLink(order.socialLink) ? order.socialLink : "",
    customerSource: (order.customerSource ?? "").toUpperCase() || "OTHER",
    deliveryAddress: order.deliveryAddress ?? "",
    receiverName: order.receiverName ?? "",
    receiverPhone: order.receiverPhone ?? "",
    deliveryDateStart: start,
    deliveryDateEnd: parseOrderDate(order.deliveryDateEnd),
    estimateStartMinutes: estimateMinutes > 0 ? String(estimateMinutes) : "",
    saleAccounts: splitAccounts(order.saleAccount),
    floristAccounts: splitAccounts(order.floristAccount),
    actualPrice: String(order.actualPrice ?? 0),
    discount: moneyToDigits(order.discountAmount),
    deliveryFee: moneyToDigits(order.deliveryFee),
    deposit: moneyToDigits(order.depositAmount),
    deliveryFeeOption: order.deliveryFeeOption ?? 0,
    vatFeeOption: order.vatFeeOption ?? 0,
    orderDescription: order.orderDescription ?? "",
    customerRemark: order.customerRemark ?? "",
    bannerContent: order.bannerContent ?? "",
    images: [...(order.samplePictureLink ?? [])],
  };
}

// ---------------------------------------------------------------------------
// Change tracking
// ---------------------------------------------------------------------------

// Money-like text inputs ("", "0" and "000" are all zero).
const NUMERIC_TEXT_FIELDS: ReadonlySet<keyof OrderFormValues> = new Set([
  "actualPrice",
  "discount",
  "deliveryFee",
  "deposit",
  "estimateStartMinutes",
]);

// Compares the way the payload would differ: text is trimmed (buildOrder trims
// it) and numeric text by value, so retyping a value back doesn't count as a change.
function fieldEqual(
  field: keyof OrderFormValues,
  a: unknown,
  b: unknown,
): boolean {
  if (NUMERIC_TEXT_FIELDS.has(field)) {
    return parseMoney(String(a)) === parseMoney(String(b));
  }
  if (typeof a === "string" && typeof b === "string") {
    return a.trim() === b.trim();
  }
  if (a instanceof Date && b instanceof Date) {
    return Object.is(a.getTime(), b.getTime());
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, i) => fieldEqual(field, item, b[i]))
    );
  }
  return a === b;
}

export function areOrderFormValuesEqual(
  a: OrderFormValues,
  b: OrderFormValues,
): boolean {
  return ORDER_FORM_FIELDS.every((field) =>
    fieldEqual(field, a[field], b[field]),
  );
}

function setField<K extends keyof OrderFormValues>(
  target: OrderFormValues,
  key: K,
  value: OrderFormValues[K],
): void {
  target[key] = value;
}

export interface OrderRebaseResult {
  values: OrderFormValues;
  /** Fields changed both by the user and on the server — the user's value was kept. */
  conflicts: (keyof OrderFormValues)[];
}

/**
 * Three-way merge used after an optimistic-lock conflict, so the user's edits
 * survive a reload: `base` is what the form was loaded with, `mine` the current
 * draft, `theirs` the fresh server copy. Fields the user didn't touch take the
 * server's value; fields the user changed keep theirs, and those the server
 * changed too (to something different) are reported as conflicts.
 */
export function rebaseOrderFormValues(
  base: OrderFormValues,
  mine: OrderFormValues,
  theirs: OrderFormValues,
): OrderRebaseResult {
  const values = { ...mine };
  const conflicts: (keyof OrderFormValues)[] = [];

  for (const field of ORDER_FORM_FIELDS) {
    if (fieldEqual(field, mine[field], base[field])) {
      setField(values, field, theirs[field]);
    } else if (
      !fieldEqual(field, theirs[field], base[field]) &&
      !fieldEqual(field, mine[field], theirs[field])
    ) {
      conflicts.push(field);
    }
  }

  return { values, conflicts };
}
