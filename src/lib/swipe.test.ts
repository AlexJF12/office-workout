import { describe, expect, it } from 'vitest';
import { swipeResult } from './swipe';

describe('swipeResult', () => {
  const width = 360; // commit line at 144px

  it('counts only when released past the commit line', () => {
    expect(swipeResult(150, width)).toBe('right');
    expect(swipeResult(-150, width)).toBe('left');
  });

  it('ignores drags released short of the line, including ones brought back to the middle', () => {
    expect(swipeResult(100, width)).toBeNull();
    expect(swipeResult(-100, width)).toBeNull();
    expect(swipeResult(0, width)).toBeNull();
    expect(swipeResult(12, width)).toBeNull();
  });

  it('keeps a sensible minimum distance on narrow cards', () => {
    expect(swipeResult(80, 150)).toBeNull();
    expect(swipeResult(95, 150)).toBe('right');
  });
});
