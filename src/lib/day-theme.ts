/** Day color cycling, ported 1:1 from the backend's render_html.py _DAY_THEME. */
const DAY_THEME = [
  { hex: "#f97316", name: "day1", tw: "orange" },
  { hex: "#3b82f6", name: "day2", tw: "blue" },
  { hex: "#22c55e", name: "day3", tw: "green" },
  { hex: "#a855f7", name: "day4", tw: "purple" },
  { hex: "#ec4899", name: "day5", tw: "pink" },
  { hex: "#06b6d4", name: "day6", tw: "cyan" },
] as const;

export function dayTheme(dayNumber: number) {
  return DAY_THEME[(dayNumber - 1) % DAY_THEME.length];
}
