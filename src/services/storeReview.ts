import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORE_REVIEW_REQUESTED_KEY = "@gem_fill_store_review_requested_v1";
export const STORE_REVIEW_TRIGGER_LEVEL = 3;

/** Delay after victory before showing the native review dialog (ms). */
const REVIEW_DELAY_MS = 1500;

export async function requestStoreReviewAfterLevel(
  levelId: number,
): Promise<void> {
  if (levelId !== STORE_REVIEW_TRIGGER_LEVEL) {
    return;
  }

  try {
    const alreadyRequested = await AsyncStorage.getItem(
      STORE_REVIEW_REQUESTED_KEY,
    );
    if (alreadyRequested === "true") {
      return;
    }

    const available = await StoreReview.isAvailableAsync();
    if (!available) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, REVIEW_DELAY_MS));
    await StoreReview.requestReview();
    await AsyncStorage.setItem(STORE_REVIEW_REQUESTED_KEY, "true");
  } catch (error) {
    console.warn("Store review request failed:", error);
  }
}
