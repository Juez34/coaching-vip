export const PERSONAL_RECORD_EXERCISES = [
  { key: "back_squat", label: "Back squat", aliases: ["back squat", "squat"] },
  { key: "front_squat", label: "Front squat", aliases: ["front squat"] },
  { key: "bench_press", label: "Développé couché", aliases: ["developpe couche", "bench press", "bench"] },
  { key: "deadlift", label: "Soulevé de terre", aliases: ["souleve de terre", "deadlift"] },
  { key: "overhead_press", label: "Développé militaire", aliases: ["developpe militaire", "overhead press", "military press"] },
  { key: "pull_up", label: "Tractions", aliases: ["traction", "pull up", "pull-up"] },
  { key: "clean", label: "Clean", aliases: ["clean"] },
  { key: "squat_clean", label: "Squat clean", aliases: ["squat clean", "clean squat"] },
  { key: "snatch", label: "Snatch", aliases: ["snatch"] },
  { key: "squat_snatch", label: "Squat snatch", aliases: ["squat snatch", "snatch squat"] },
];

export function normalizeExerciseName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findPersonalRecord(exerciseName, records = {}) {
  const normalizedName = normalizeExerciseName(exerciseName);
  if (!normalizedName) return null;
  const candidates = PERSONAL_RECORD_EXERCISES.flatMap((lift) => lift.aliases.map((alias) => ({ lift, alias: normalizeExerciseName(alias) })));
  const exact = candidates.find(({ alias }) => normalizedName === alias);
  const match = exact || candidates
    .filter(({ alias }) => normalizedName.includes(alias))
    .sort((left, right) => right.alias.length - left.alias.length)[0];
  const lift = match?.lift;
  const record = lift ? getPersonalRecord(records, lift.key) : null;
  return hasPersonalRecord(record) ? { ...lift, ...record } : null;
}

export function getPersonalRecord(records = {}, key) {
  if (key === "back_squat") return { ...(records?.squat || {}), ...(records?.back_squat || {}) };
  return records?.[key] || null;
}

export function hasPersonalRecord(record) {
  return Boolean(record && (record.weight || record.reps));
}
