export type SwipeDir = 'left' | 'right';

/** How far (as a fraction of card width, min 90px) the card must be dragged before letting go counts. */
export const COMMIT_FRACTION = 0.4;
const COMMIT_MIN_PX = 90;

export const commitDistance = (cardWidth: number) => Math.max(COMMIT_MIN_PX, cardWidth * COMMIT_FRACTION);

/**
 * Decide a swipe purely from where the card is when the finger lifts: dragging
 * out and back to the middle never counts, however fast it moved.
 */
export function swipeResult(dx: number, cardWidth: number): SwipeDir | null {
  const need = commitDistance(cardWidth);
  if (dx >= need) return 'right';
  if (dx <= -need) return 'left';
  return null;
}
