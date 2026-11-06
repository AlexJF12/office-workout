import { EXERCISES, type Exercise } from './exercises';

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
export const EXERCISE_IDS = EXERCISES.map((e) => e.id);

/** Names of cards that have left the deck, so old History entries still read properly. */
export const RETIRED_NAMES: Record<string, string> = { 'chair-dips': 'Chair Triceps Dips' };

export const exerciseName = (id: string) => EXERCISE_BY_ID[id]?.name ?? RETIRED_NAMES[id] ?? id;
