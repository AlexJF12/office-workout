import { EXERCISES, type Exercise } from './exercises';

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
export const EXERCISE_IDS = EXERCISES.map((e) => e.id);
