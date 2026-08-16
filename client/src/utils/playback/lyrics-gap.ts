/**
 * Shared lyric-gap policy for the playback UI.
 *
 * A "lyric gap" is a pause of at least `GAP_THRESHOLD_SEC` between the end of
 * one lyric line and the start of the next. Captions only describe pauses
 * BETWEEN existing lyric blocks, so an extended instrumental intro before the
 * first lyric never shows one. During a long gap the HUD renders a small
 * "Next lyrics in Ns" countdown for the whole gap, while the lyric-side
 * circular bubble counts down the final `BUBBLE_COUNTDOWN_SEC` beside the
 * upcoming line.
 */

import type { Segment } from "@/types/Transcript";

// Timing offsets: lyrics/words appear slightly before their actual start so the
// visual transition feels in sync with the audio.
export const LYRICS_LEAD = 0.15;
/** Word-level highlight lead used by the lyric word renderer. */
export const WORD_HIGHLIGHT_LEAD = 0.25;
/** Grace period after a segment ends before it disappears. */
export const SEGMENT_LINGER = 0.5;
/** A gap at or above this many seconds between lyric lines is a real gap. */
export const GAP_THRESHOLD_SEC = 3.5;
/** Duration of the circular lyric-side countdown bubble at the end of a long gap. */
export const BUBBLE_COUNTDOWN_SEC = 3.0;

/**
 * Finds the segment index that should be displayed at a given `time`.
 * Uses `hint` (the last known index) to skip already-passed segments.
 * Prefers the *next* segment when the current time falls in the lead-in window.
 */
export function findCurrentSegment(segments: Segment[], time: number, hint: number): number {
  const start = hint < segments.length && time >= segments[hint].start - LYRICS_LEAD ? hint : 0;

  for (let i = start; i < segments.length; i++) {
    if (time >= segments[i].end + SEGMENT_LINGER) {
      const next = i + 1;

      // Through a short pause, keep the finished line current until the next
      // line's lead-in begins, so the switch happens when the new line starts
      // rather than when the old one ends.
      if (
        next < segments.length &&
        segments[next].start - segments[i].end < GAP_THRESHOLD_SEC &&
        time < segments[next].start - LYRICS_LEAD
      ) {
        return i;
      }

      continue;
    }

    // If we're already in the lead-in of the next segment, jump ahead
    const next = i + 1;
    if (next < segments.length && time >= segments[next].start - LYRICS_LEAD) {
      return next;
    }

    return i;
  }

  return Math.max(0, segments.length - 1);
}

/**
 * Caption text for the current lyric gap at `time`, or `null` when no caption
 * applies. `segIdx` must be the index returned by `findCurrentSegment` so the
 * "current" segment is the upcoming lyric during a long gap (the finished line
 * is only "current" while it is still active or within its linger, which makes
 * `timeUntil` non-positive and yields no caption).
 *
 * Handles empty segments, the intro before the first lyric (never captioned),
 * short gaps, the preceding line's active/linger window, and the tail after
 * the final line. The caption runs for the whole gap and stops the moment the
 * upcoming lyric actually starts (`timeUntil <= 0`); because the text uses
 * `Math.ceil`, it reads `1s` right up to that boundary rather than showing a
 * separate `0s`. The lyric-side bubble counts down the final
 * `BUBBLE_COUNTDOWN_SEC` in parallel.
 */
export function computeLyricGapCaption(
  segments: Segment[],
  time: number,
  segIdx: number,
): string | null {
  const seg = segments[segIdx];
  if (!seg) {
    return null;
  }

  // Captions only describe pauses between existing lyric blocks: the gap
  // before the very first lyric is an intro, not a between-block break.
  if (segIdx === 0) {
    return null;
  }

  const gapBefore = seg.start - segments[segIdx - 1].end;
  const timeUntil = seg.start - time;
  // Keep the caption until the lyric actually starts: `Math.ceil` holds the
  // text at `1s` right up to the zero crossing, and no `0s` is shown once the
  // lyric is underway.
  const inGap = gapBefore >= GAP_THRESHOLD_SEC && timeUntil > 0;
  if (!inGap) {
    return null;
  }

  return `Next lyrics in ${Math.ceil(timeUntil)}s`;
}
