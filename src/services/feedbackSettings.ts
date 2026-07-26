let hapticsEnabled = true;
let soundEnabled = true;

export function syncFeedbackSettings(settings: {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}): void {
  hapticsEnabled = settings.hapticsEnabled;
  soundEnabled = settings.soundEnabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}
