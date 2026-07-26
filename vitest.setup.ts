import { vi } from "vitest";

vi.mock("expo-haptics", () => ({
  selectionAsync: vi.fn(),
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

vi.mock("expo-audio", () => ({
  createAudioPlayer: vi.fn(() => ({
    seekTo: vi.fn(),
    play: vi.fn(),
  })),
  setAudioModeAsync: vi.fn(),
}));
