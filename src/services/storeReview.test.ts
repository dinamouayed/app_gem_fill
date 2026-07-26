import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

vi.mock("expo-store-review", () => ({
  isAvailableAsync: vi.fn(),
  requestReview: vi.fn(),
}));

async function loadStoreReview() {
  return import("./storeReview");
}

describe("requestStoreReviewAfterLevel", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockStorage.clear();
    vi.useFakeTimers();

    const StoreReview = await import("expo-store-review");
    vi.mocked(StoreReview.isAvailableAsync).mockResolvedValue(true);
    vi.mocked(StoreReview.requestReview).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing for levels other than the trigger level", async () => {
    const { requestStoreReviewAfterLevel, STORE_REVIEW_TRIGGER_LEVEL } =
      await loadStoreReview();
    const StoreReview = await import("expo-store-review");

    await requestStoreReviewAfterLevel(STORE_REVIEW_TRIGGER_LEVEL - 1);

    expect(StoreReview.isAvailableAsync).not.toHaveBeenCalled();
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it("requests a review after the trigger level when available", async () => {
    const { requestStoreReviewAfterLevel, STORE_REVIEW_TRIGGER_LEVEL } =
      await loadStoreReview();
    const StoreReview = await import("expo-store-review");

    const promise = requestStoreReviewAfterLevel(STORE_REVIEW_TRIGGER_LEVEL);

    await vi.advanceTimersByTimeAsync(1500);
    await promise;

    expect(StoreReview.isAvailableAsync).toHaveBeenCalledOnce();
    expect(StoreReview.requestReview).toHaveBeenCalledOnce();
    expect(mockStorage.get("@gem_fill_store_review_requested_v1")).toBe("true");
  });

  it("does not request again after it was already shown", async () => {
    const { requestStoreReviewAfterLevel, STORE_REVIEW_TRIGGER_LEVEL } =
      await loadStoreReview();
    const StoreReview = await import("expo-store-review");

    mockStorage.set("@gem_fill_store_review_requested_v1", "true");

    await requestStoreReviewAfterLevel(STORE_REVIEW_TRIGGER_LEVEL);

    expect(StoreReview.isAvailableAsync).not.toHaveBeenCalled();
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it("does not persist when the native review flow is unavailable", async () => {
    const { requestStoreReviewAfterLevel, STORE_REVIEW_TRIGGER_LEVEL } =
      await loadStoreReview();
    const StoreReview = await import("expo-store-review");

    vi.mocked(StoreReview.isAvailableAsync).mockResolvedValue(false);

    await requestStoreReviewAfterLevel(STORE_REVIEW_TRIGGER_LEVEL);

    expect(StoreReview.requestReview).not.toHaveBeenCalled();
    expect(mockStorage.get("@gem_fill_store_review_requested_v1")).toBeUndefined();
  });
});
