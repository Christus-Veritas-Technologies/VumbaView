import { readFileSync } from "node:fs";

/// Loads the brand assets every PDF report embeds, once, and caches the
/// base64 strings for the life of the process. Embedding real font files
/// (rather than relying on whatever generic sans Chromium falls back to)
/// is what makes the reports look like VumbaView Academy's own mobile app
/// instead of a default browser printout — and base64-inlining them (via
/// @font-face `url(data:...)` in template.ts) means PDF generation never
/// depends on network access to Google Fonts or anywhere else.
///
/// `import.meta.dir` is Bun's resolved-at-runtime equivalent of `__dirname` —
/// this file always runs from its real location on disk (no bundler moves
/// it), so it's safe to use directly instead of the node:url/path
/// fileURLToPath dance.
const FONTS_DIR = `${import.meta.dir}/../../assets/fonts`;
const IMAGES_DIR = `${import.meta.dir}/../../assets/images`;

function loadBase64(path: string): string {
  return readFileSync(path).toString("base64");
}

let cached: ReportAssets | null = null;

export interface ReportAssets {
  fonts: {
    interRegular: string;
    interMedium: string;
    interSemiBold: string;
    interBold: string;
    jakartaBold: string;
    jakartaExtraBold: string;
  };
  logoBase64: string;
}

export function getReportAssets(): ReportAssets {
  if (cached) {
    return cached;
  }

  cached = {
    fonts: {
      interRegular: loadBase64(`${FONTS_DIR}/Inter_400Regular.ttf`),
      interMedium: loadBase64(`${FONTS_DIR}/Inter_500Medium.ttf`),
      interSemiBold: loadBase64(`${FONTS_DIR}/Inter_600SemiBold.ttf`),
      interBold: loadBase64(`${FONTS_DIR}/Inter_700Bold.ttf`),
      jakartaBold: loadBase64(`${FONTS_DIR}/PlusJakartaSans_700Bold.ttf`),
      jakartaExtraBold: loadBase64(`${FONTS_DIR}/PlusJakartaSans_800ExtraBold.ttf`),
    },
    logoBase64: loadBase64(`${IMAGES_DIR}/logo.png`),
  };

  return cached;
}
