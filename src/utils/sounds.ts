import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { isSoundEnabled } from "../services/feedbackSettings";

type SoundName = "select" | "place" | "success" | "error";

const SOURCES: Record<SoundName, number> = {
  select: require("../../assets/sounds/select.wav"),
  place: require("../../assets/sounds/place.wav"),
  success: require("../../assets/sounds/success.wav"),
  error: require("../../assets/sounds/error.wav"),
};

const players = new Map<SoundName, AudioPlayer>();
let initPromise: Promise<void> | null = null;
let lastPlaceSoundAt = 0;
const PLACE_SOUND_DEBOUNCE_MS = 120;

export function initSounds(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
      });
    } catch {
      // Ignore audio mode errors on unsupported platforms.
    }

    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      if (!players.has(name)) {
        players.set(name, createAudioPlayer(SOURCES[name]));
      }
    });
  })();

  return initPromise;
}

const playSound = (name: SoundName) => {
  if (!isSoundEnabled()) {
    return;
  }

  void initSounds()
    .then(() => {
      const player = players.get(name);
      if (!player) {
        return;
      }

      player.seekTo(0);
      player.play();
    })
    .catch(() => {
      // Ignore playback errors (web, missing hardware…).
    });
};

export const soundSelect = () => playSound("select");
export const soundPlace = () => {
  const now = Date.now();
  if (now - lastPlaceSoundAt < PLACE_SOUND_DEBOUNCE_MS) {
    return;
  }
  lastPlaceSoundAt = now;
  playSound("place");
};
export const soundSuccess = () => playSound("success");
export const soundError = () => playSound("error");
