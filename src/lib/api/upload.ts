import { requireAccessToken } from "./auth";
import { ApiError, postFormData, requireEnv } from "./client";

// POST multipart `file` -> { data: <uploaded file url> }, Bearer accessToken.
export const uploadSampleFile = async (file: File): Promise<string> => {
  const accessToken = requireAccessToken();
  const url = requireEnv(
    "NEXT_PUBLIC_UPLOAD_FILE",
    process.env.NEXT_PUBLIC_UPLOAD_FILE,
  );
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await postFormData<{ data: string }>(url, formData, {
      authorization: `Bearer ${accessToken}`,
      fallbackErrorCode: "UPLOAD_FAILED",
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      throw new ApiError("UPLOAD_FILE_REJECTED", 400);
    }
    throw error;
  }
};
