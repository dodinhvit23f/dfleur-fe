import { ApiError } from "./client";

const ERROR_MESSAGES: Record<string, string> = {
  LOGIN_FAILED: "Tên đăng nhập hoặc mật khẩu không chính xác.",
  INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không chính xác.",
  OTP_TOKEN_MISSING: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  OTP_GENERATE_FAILED: "Không thể tạo mã QR. Vui lòng thử lại.",
  OTP_VERIFY_FAILED: "Mã OTP không chính xác. Vui lòng thử lại.",
  OTP_LOGIN_FAILED: "Mã OTP không chính xác. Vui lòng thử lại.",
  OTP_INVALID: "Mã OTP không chính xác. Vui lòng thử lại.",
  OTP_EXPIRED: "Mã OTP đã hết hạn. Vui lòng đăng nhập lại.",
  OTP_RATE_LIMITED: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ORDER_LIST_FAILED: "Không thể tải danh sách đơn hàng. Vui lòng thử lại.",
  ORDER_STATUS_FAILED: "Cập nhật trạng thái đơn thất bại.",
  ORDER_CREATE_FAILED: "Tạo đơn hàng thất bại. Vui lòng thử lại.",
  UPLOAD_FAILED: "Tải ảnh lên thất bại. Vui lòng thử lại.",
  UPLOAD_FILE_REJECTED: "File không phù hợp.",
};

const DEFAULT_ERROR_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại.";

export const ErrorMessage = {
  getMessage(code: string, fallback?: string): string {
    return ERROR_MESSAGES[code] ?? fallback ?? DEFAULT_ERROR_MESSAGE;
  },
};

export function getErrorCode(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.code : fallback;
}
