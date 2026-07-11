import { StyleSheet } from "@react-pdf/renderer";
import { dayTheme } from "@/lib/day-theme";

/**
 * @react-pdf/renderer has its own StyleSheet API — it doesn't read this app's
 * CSS custom properties, so the brand colors are hardcoded here from
 * globals.css's `.dark` block. Uses the same light-on-white direction as the
 * browser print CSS fix (dark backgrounds don't work for a printed/downloaded
 * document) — same reasoning, same primary orange, just redefined for a
 * different rendering engine.
 */
export const colors = {
  background: "#ffffff",
  card: "#f9f9f7",
  foreground: "#171717",
  muted: "#525252",
  border: "#e2e2e2",
  primary: "#c2410c",
  primaryLight: "#fdf1ea",
};

// Built-in Helvetica — no network font-loading step (Google Fonts URL
// registration) needed, so generation can't fail on a flaky request. A
// deliberate v1 simplification, not an oversight: the web app's actual
// Playfair/Plus Jakarta Sans identity doesn't carry over here.
const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: colors.foreground,
    backgroundColor: colors.background,
    padding: 40,
  },
  coverPage: {
    fontFamily: FONT,
    backgroundColor: colors.background,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  coverEyebrow: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  coverTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 32,
    textAlign: "center",
    marginBottom: 10,
    maxWidth: 420,
  },
  coverTagline: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 360,
  },
  coverMetaRow: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  coverMetaChip: {
    fontSize: 9,
    color: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sectionEyebrow: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  dayHeaderRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dayBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dayBadgeText: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
  },
  dayMeta: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dayTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
  },
  daySubtitle: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 1,
  },
  activityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  activityRow: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  activityTime: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    width: 60,
  },
  activityType: {
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 3,
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 10.5,
    marginBottom: 3,
  },
  activityDesc: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.4,
  },
  chipsRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 5,
  },
  chip: {
    fontSize: 7,
    color: colors.muted,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  grid2: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  gridCardLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9.5,
    marginBottom: 3,
  },
  gridCardSub: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 6,
  },
  gridCardAmount: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    color: colors.primary,
  },
  totalBanner: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 16,
    marginTop: 6,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmount: {
    fontFamily: FONT_BOLD,
    fontSize: 22,
  },
  totalSub: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  listItem: {
    fontSize: 9,
    marginBottom: 4,
  },
  quickRefRow: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  quickRefLabel: {
    fontSize: 7.5,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickRefValue: {
    fontFamily: FONT_BOLD,
    fontSize: 9.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: colors.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});

/** react-pdf StyleSheet values must be static — colors keyed by day theme are
 *  built on demand rather than declared in the sheet above. */
export function dayColorStyle(dayNumber: number) {
  const t = dayTheme(dayNumber);
  return {
    badgeBg: `${t.hex}1a`,
    badgeBorder: `${t.hex}55`,
    text: t.hex,
  };
}
