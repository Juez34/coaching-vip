export const PERSONAL_RECORD_EXERCISES = [
  { key: "squat", label: "Squat", aliases: ["squat", "back squat", "front squat"] },
  { key: "bench_press", label: "Développé couché", aliases: ["developpe couche", "bench press", "bench"] },
  { key: "deadlift", label: "Soulevé de terre", aliases: ["souleve de terre", "deadlift"] },
  { key: "overhead_press", label: "Développé militaire", aliases: ["developpe militaire", "overhead press", "military press"] },
  { key: "pull_up", label: "Tractions", aliases: ["traction", "pull up", "pull-up"] },
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
  const lift = PERSONAL_RECORD_EXERCISES.find((item) =>
    item.aliases.some((alias) => {
      const normalizedAlias = normalizeExerciseName(alias);
      return normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias);
    })
  );
  const record = lift ? records?.[lift.key] : null;
  return hasPersonalRecord(record) ? { ...lift, ...record } : null;
}

export function hasPersonalRecord(record) {
  return Boolean(record && (record.weight || record.reps));
}
