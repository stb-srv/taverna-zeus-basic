const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

/**
 * Maps this repo's `day_of_week` convention (1=Monday..7=Sunday, see
 * `hours.days` i18n keys / `OpeningHours.tsx`) to the day name string
 * expected by schema.org's `OpeningHoursSpecification.dayOfWeek`.
 */
export function schemaOrgDayName(dayOfWeek: number): string {
  const name = DAY_NAMES[dayOfWeek];
  if (!name) throw new Error(`Invalid day_of_week: ${dayOfWeek}`);
  return name;
}
