import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "@gem_fill_user_progress_v1";
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

async function loadProgressStorage() {
  return import("./progressStorage");
}

async function getAsyncStorageMock() {
  return (await import("@react-native-async-storage/async-storage")).default;
}

function sampleSavedGame() {
  return {
    levelId: 1,
    currentGrid: [
      ["bg", "red", "red", "bg"],
      ["red", "pink", "red", "red"],
      ["red", "red", "red", "red"],
      ["bg", "red", "red", "bg"],
    ],
    reserveGems: Array(12).fill(null),
    moves: 2,
    elapsedTimeSeconds: 15,
    updatedAt: 1_700_000_000_000,
  };
}

describe("progressStorage", () => {
  beforeEach(async () => {
    vi.resetModules();
    mockStorage.clear();
    vi.useFakeTimers();

    const AsyncStorage = await getAsyncStorageMock();
    vi.mocked(AsyncStorage.getItem).mockClear();
    vi.mocked(AsyncStorage.setItem).mockClear();
    vi.mocked(AsyncStorage.removeItem).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default progress when storage is empty", async () => {
    const { getUserProgress } = await loadProgressStorage();
    const progress = await getUserProgress();

    expect(progress.currentUnlockedLevel).toBe(1);
    expect(progress.completedLevels).toEqual({});
    expect(progress.activeSavedGame).toBeNull();
    expect(progress.soundEnabled).toBe(true);
    expect(progress.hapticsEnabled).toBe(true);
  });

  it("uses the in-memory cache after the first load", async () => {
    const { getUserProgress } = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    await getUserProgress();
    await getUserProgress();

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it("invalidates the cache and reloads from storage", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    await storage.getUserProgress();
    storage.invalidateProgressCache();
    await storage.getUserProgress();

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
  });

  it("falls back to default progress when stored JSON is invalid", async () => {
    mockStorage.set(STORAGE_KEY, "{not valid json");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { getUserProgress } = await loadProgressStorage();
    const progress = await getUserProgress();

    expect(progress.currentUnlockedLevel).toBe(1);
    expect(progress.activeSavedGame).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error reading user progress from AsyncStorage:",
      expect.any(SyntaxError),
    );

    errorSpy.mockRestore();
  });

  it("debounces saveActiveGameState writes", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    const savePromise = storage.saveActiveGameState(sampleSavedGame());

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);
    await savePromise;

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    const persisted = JSON.parse(
      (AsyncStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );

    expect(persisted.activeSavedGame).toEqual(sampleSavedGame());
  });

  it("flushPendingProgressSave writes debounced progress immediately", async () => {
    vi.useRealTimers();
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    await storage.getUserProgress();
    void storage.saveActiveGameState(sampleSavedGame());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await storage.flushPendingProgressSave();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it("writes clearActiveGameState immediately", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    mockStorage.set(
      STORAGE_KEY,
      JSON.stringify({
        currentUnlockedLevel: 1,
        completedLevels: {},
        activeSavedGame: sampleSavedGame(),
        soundEnabled: true,
        hapticsEnabled: true,
      }),
    );

    await storage.clearActiveGameState();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    const persisted = JSON.parse(
      (AsyncStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );

    expect(persisted.activeSavedGame).toBeNull();
  });

  it("markLevelCompleted unlocks the next level and keeps best stats", async () => {
    const storage = await loadProgressStorage();

    mockStorage.set(
      STORAGE_KEY,
      JSON.stringify({
        currentUnlockedLevel: 1,
        completedLevels: {
          1: {
            levelId: 1,
            completed: true,
            bestMoves: 20,
            bestTimeSeconds: 90,
            stars: 2,
          },
        },
        activeSavedGame: null,
        soundEnabled: true,
        hapticsEnabled: true,
      }),
    );

    const updated = await storage.markLevelCompleted(1, 15, 60, 3);

    expect(updated.currentUnlockedLevel).toBe(2);
    expect(updated.completedLevels[1]).toMatchObject({
      completed: true,
      bestMoves: 15,
      bestTimeSeconds: 60,
      stars: 3,
    });
  });

  it("markLevelCompleted clears an active save for the same level", async () => {
    const storage = await loadProgressStorage();
    const savedGame = sampleSavedGame();

    mockStorage.set(
      STORAGE_KEY,
      JSON.stringify({
        currentUnlockedLevel: 1,
        completedLevels: {},
        activeSavedGame: savedGame,
        soundEnabled: true,
        hapticsEnabled: true,
      }),
    );

    const updated = await storage.markLevelCompleted(1, 10, 30, 2);

    expect(updated.activeSavedGame).toBeNull();
  });

  it("saveUserProgress writes immediately", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    await storage.saveUserProgress({
      currentUnlockedLevel: 3,
      completedLevels: {},
      activeSavedGame: null,
      soundEnabled: false,
      hapticsEnabled: true,
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    const persisted = JSON.parse(
      (AsyncStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );

    expect(persisted.currentUnlockedLevel).toBe(3);
    expect(persisted.soundEnabled).toBe(false);
  });

  it("resetAllProgress removes storage and returns defaults", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    mockStorage.set(
      STORAGE_KEY,
      JSON.stringify({
        currentUnlockedLevel: 5,
        completedLevels: { 1: { levelId: 1, completed: true } },
        activeSavedGame: sampleSavedGame(),
        soundEnabled: false,
        hapticsEnabled: false,
      }),
    );

    const progress = await storage.resetAllProgress();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(progress.currentUnlockedLevel).toBe(1);
    expect(progress.completedLevels).toEqual({});
    expect(progress.activeSavedGame).toBeNull();
  });

  it("syncs unlocked level when completed levels exceed saved unlock", async () => {
    const storage = await loadProgressStorage();
    const AsyncStorage = await getAsyncStorageMock();

    mockStorage.set(
      STORAGE_KEY,
      JSON.stringify({
        currentUnlockedLevel: 1,
        completedLevels: {
          1: { levelId: 1, completed: true },
          2: { levelId: 2, completed: true },
        },
        activeSavedGame: null,
        soundEnabled: true,
        hapticsEnabled: true,
      }),
    );

    const progress = await storage.getUserProgress();

    expect(progress.currentUnlockedLevel).toBe(3);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
