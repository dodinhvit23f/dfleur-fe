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

/** Uploads running at once; browsers allow ~6 per host, keep room for other calls. */
export const UPLOAD_CONCURRENCY = 3;

export interface UploadSampleFilesOptions {
  /** File -> uploaded URL. Cached files are skipped, new results are stored, so a retry only redoes what's missing. */
  cache: WeakMap<File, string>;
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
  /** Injectable for tests; defaults to the real upload. */
  upload?: (file: File) => Promise<string>;
}

/**
 * Uploads `files` concurrently (a pool of `concurrency` workers) and joins:
 * resolves only once every file has an uploaded URL, in the order of `files`
 * (not completion order). On the first failure no new upload is started, the
 * in-flight ones are awaited (their URLs stay cached) and that first error is
 * thrown — so the caller never proceeds with a partial set.
 */
export async function uploadSampleFiles(
  files: File[],
  {
    cache,
    concurrency = UPLOAD_CONCURRENCY,
    onProgress,
    upload = uploadSampleFile,
  }: UploadSampleFilesOptions,
): Promise<string[]> {
  const queue = [...new Set(files)].filter((file) => !cache.has(file));
  const total = queue.length;
  const state: { done: number; failure?: { error: unknown } } = { done: 0 };
  onProgress?.(0, total);

  // Workers never reject: they record the first error and stop taking work.
  const worker = async () => {
    while (!state.failure) {
      const file = queue.shift();
      if (!file) return;
      try {
        cache.set(file, await upload(file));
        state.done += 1;
        onProgress?.(state.done, total);
      } catch (error) {
        state.failure ??= { error };
      }
    }
  };

  const workers = Math.min(Math.max(1, Math.floor(concurrency)), total);
  await Promise.all(Array.from({ length: workers }, worker));

  if (state.failure) throw state.failure.error;
  return files.map((file) => cache.get(file) as string);
}
