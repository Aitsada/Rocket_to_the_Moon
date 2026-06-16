export const MAX_TRAVEL_SECONDS = 20;

export function displayMultiplier(seconds) {
  const time = Math.max(0, Math.min(Number(seconds), MAX_TRAVEL_SECONDS));

  if (time >= MAX_TRAVEL_SECONDS) {
    return 100;
  }

  return Number((0.2 + Math.pow(time / MAX_TRAVEL_SECONDS, 2.2) * 8.8).toFixed(2));
}
