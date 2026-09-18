import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
  OrdersApiResponse,
} from "@/components/admin/orderUtils";
import { requireAccessToken } from "./auth";
import { ApiError, getJson, postJson, putJson, requireEnv } from "./client";

export interface OrderListParams {
  /** 0-based, like the backend and the DataGrid. */
  page: number;
  size: number;
  search: string;
  startDate: Date | null;
  endDate: Date | null;
  statuses: OrderStatus[];
  saleAccounts: string[];
  floristAccounts: string[];
  sort?: string;
}

export interface OrderStatusUpdate {
  code: string;
  status: OrderStatus;
  version: number;
}

export interface OrdersPage {
  orders: Order[];
  rowCount: number;
}

// The backend uses the same lowercase values as OrderStatus ("pending", …).
// If that ever changes, these two are the only places to convert.
const toApiStatus = (status: OrderStatus): string => status;
const fromApiStatus = (status: string): OrderStatus =>
  String(status).toLowerCase() as OrderStatus;

const STALE_ORDER_CODES = ["record_have_been_updated", "ERROR_OPT_001"];

/** Optimistic-lock conflict: someone else changed the order (version mismatch). */
export function isStaleOrderError(error: unknown): boolean {
  return error instanceof ApiError && STALE_ORDER_CODES.includes(error.code);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatQueryDate(date: Date): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * Query string for the order list: `startDate` = DD-MM-YYYY, `endDate` = end of
 * that day as "DD-MM-YYYY HH:mm:ss", multi-value filters comma-joined, empty
 * filters omitted.
 */
export function buildOrderQuery(params: OrderListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.search) query.set("search", params.search);
  if (params.startDate) {
    query.set("startDate", formatQueryDate(params.startDate));
  }
  if (params.endDate) {
    query.set("endDate", `${formatQueryDate(params.endDate)} 23:59:59`);
  }
  if (params.statuses.length > 0) {
    query.set("statuses", params.statuses.map(toApiStatus).join(","));
  }
  if (params.saleAccounts.length > 0) {
    query.set("saleAccount", params.saleAccounts.join(","));
  }
  if (params.floristAccounts.length > 0) {
    query.set("floristAccount", params.floristAccounts.join(","));
  }

  query.set("sort", "sort=status,desc");

  return `?${query.toString()}`;
}

// Same rule as florist-fe: anything that isn't a link is shown as "None".
function normalizeSocialLink(link: string | null | undefined): string {
  if (
    link &&
    (link.toLowerCase().startsWith("http") || /\.[A-Za-z]{0,10}/.test(link))
  ) {
    return link;
  }
  return "None";
}

function normalizeOrder(raw: Order): Order {
  return {
    ...raw,
    status: fromApiStatus(raw.status),
    socialLink: normalizeSocialLink(raw.socialLink),
    samplePictureLink: raw.samplePictureLink ?? [],
  };
}

const bearer = () => `Bearer ${requireAccessToken()}`;

export const getOrders = async (
  params: OrderListParams,
): Promise<OrdersPage> => {
  const url = requireEnv(
    "NEXT_PUBLIC_API_ADMIN_ORDER_LIST",
    process.env.NEXT_PUBLIC_API_ADMIN_ORDER_LIST,
  );
  const response = await getJson<OrdersApiResponse>(
    `${url}${buildOrderQuery(params)}`,
    { authorization: bearer(), fallbackErrorCode: "ORDER_LIST_FAILED" },
  );
  const { list, pageSize, totalPage } = response.data;
  return {
    orders: list.map(normalizeOrder),
    // The response has no total count; this overstates it on the last page.
    rowCount: pageSize * totalPage,
  };
};

export const createOrderApi = async (
  payload: CreateOrderPayload,
): Promise<Order> => {
  const url = requireEnv(
    "NEXT_PUBLIC_API_ADMIN_ORDER_CREATE",
    process.env.NEXT_PUBLIC_API_ADMIN_ORDER_CREATE,
  );
  const response = await postJson<{ data: Order }>(url, payload, {
    authorization: bearer(),
    fallbackErrorCode: "ORDER_CREATE_FAILED",
  });
  return normalizeOrder(response.data);
};

export const updateOrderStatusApi = async (
  update: OrderStatusUpdate,
): Promise<void> => {
  const url = requireEnv(
    "NEXT_PUBLIC_API_ADMIN_ORDER_STATUS",
    process.env.NEXT_PUBLIC_API_ADMIN_ORDER_STATUS,
  );
  await putJson<unknown>(
    url,
    { ...update, status: toApiStatus(update.status) },
    { authorization: bearer(), fallbackErrorCode: "ORDER_STATUS_FAILED" },
  );
};

// Fails soft (empty list) so a broken staff endpoint only empties the dropdown.
async function getEmployeesByRole(role: string): Promise<string[]> {
  const base = requireEnv(
    "NEXT_PUBLIC_API_ADMIN_EMPLOYEES_BY_ROLE",
    process.env.NEXT_PUBLIC_API_ADMIN_EMPLOYEES_BY_ROLE,
  );
  try {
    const response = await getJson<{
      data?: { employees?: { userName: string }[] };
    }>(`${base}/${role}`, {
      authorization: bearer(),
      fallbackErrorCode: "STAFF_LIST_FAILED",
    });
    return (response.data?.employees ?? []).map((e) => e.userName);
  } catch {
    return [];
  }
}

/** Admins can be assigned as the salesperson too, so ADMIN + SALE are merged. */
export async function getSaleUsernames(): Promise<string[]> {
  const [admins, sales] = await Promise.all([
    getEmployeesByRole("ADMIN"),
    getEmployeesByRole("SALE"),
  ]);
  return Array.from(new Set([...admins, ...sales])).sort();
}

export async function getFloristUsernames(): Promise<string[]> {
  return (await getEmployeesByRole("FLORIST")).sort();
}
