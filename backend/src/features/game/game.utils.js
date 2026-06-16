export const MAX_TRAVEL_SECONDS = 20;

export function generateCrashTime() {
  const roll = Math.random();

  if (roll < 0.08) {
    return MAX_TRAVEL_SECONDS;
  }

  const minCrashSeconds = 0.4;
  const skewed = Math.pow(Math.random(), 1.45);
  return Number((minCrashSeconds + skewed * (MAX_TRAVEL_SECONDS - minCrashSeconds)).toFixed(2));
}

export function multiplierForTime(seconds) {
  const time = Math.max(0, Math.min(Number(seconds), MAX_TRAVEL_SECONDS));

  if (time >= MAX_TRAVEL_SECONDS) {
    return 100;
  }

  const multiplier = 0.2 + Math.pow(time / MAX_TRAVEL_SECONDS, 2.2) * 8.8;
  return Number(multiplier.toFixed(2));
}

export function nowElapsedSeconds(createdAt) {
  return Number(((Date.now() - new Date(createdAt).getTime()) / 1000).toFixed(2));
}
