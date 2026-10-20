/* eslint-disable max-len */
/**
 * Optimized Base64 Image Assets for Nihon Quest
 * Pre-compressed with high-efficiency WebP/SVG for zero latency and instant rendering.
 */

export const BASE64_IMAGES = {
  heroJapan: "/images/generated/heroJapan_1.webp",
  footerJapan: "/images/generated/footerJapan_2.webp",
  loginBg: "/images/generated/loginBg_3.webp",
  registerBg: "/images/generated/registerBg_4.webp",
  fujiHero: "/images/generated/fujiHero_5.webp",
  fujiDash: "/images/generated/fujiDash_6.webp",
  footerSakura: "/images/generated/footerSakura_7.webp",
  manekiNeko: "/images/generated/manekiNeko_8.webp",
  catHand: "/images/generated/catHand_9.webp",
  catKanji: "/images/generated/catKanji_10.webp",
  cangHocCangGioi: "/images/generated/cangHocCangGioi_11.webp",
  grammar: "/images/generated/grammar_12.webp",
  dashLight: "/images/generated/dashLight_13.webp",
  dashDark: "/images/generated/dashDark_14.webp",
  japanProfileHero: "/images/generated/japanProfileHero_15.svg",
  aoiPortrait: "/images/generated/aoiPortrait_16.webp",
  aoi: "/images/generated/aoi_17.webp",
  renPortrait: "/images/generated/renPortrait_18.webp",
  ren: "/images/generated/ren_19.webp",
  promoDay: "/images/generated/promoDay_20.webp",
  promoNight: "/images/generated/promoNight_21.webp",
  heroFuji: "/images/generated/heroFuji_22.webp",
  kanaCard: "/images/generated/kanaCard_23.webp",
  learnBanner: "/images/generated/learnBanner_24.webp",
  learnFooter: "/images/generated/learnFooter_25.webp",
  srsHeader: "/images/generated/srsHeader_26.webp",
  survivalHero: "/images/generated/survivalHero_27.webp",
  survivalLoadingGirl: "/images/generated/survivalLoadingGirl_28.webp",
  journeyHero: "/images/generated/journeyHero_29.webp",
  journeyMascot: "/images/generated/journeyMascot_30.webp",
} as const;

export const JOURNEY_LANDMARKS: Record<string, string> = {
  "tokyo": "/images/generated/asset_31.webp",
  "kyoto": "/images/generated/asset_32.webp",
  "nara": "/images/generated/asset_33.webp",
  "osaka": "/images/generated/asset_34.webp",
  "hokkaido": "/images/generated/asset_35.webp",
  "okinawa": "/images/generated/asset_36.webp",
  "hiroshima": "/images/generated/asset_37.webp",
  "nagoya": "/images/generated/asset_38.webp",
  "fuji": "/images/journey/fuji.png"
};

export const SURVIVAL_LESSONS: Record<string, string> = {
  "akihabara-anime": "/images/generated/asset_39.webp",
  "hakone-ryokan": "/images/generated/asset_40.webp",
  "japanese-pharmacy": "/images/generated/asset_41.webp",
  "konbini-shopping": "/images/generated/asset_42.webp",
  "kyoto-taxi": "/images/generated/asset_43.webp",
  "ordering-ramen": "/images/generated/asset_44.webp",
  "shinjuku-station": "/images/generated/asset_45.webp"
};

export const SURVIVAL_CHARACTERS: Record<string, string> = {
  "akihabara-anime": "/images/generated/asset_46.webp",
  "hakone-ryokan": "/images/generated/asset_47.webp",
  "japanese-pharmacy": "/images/generated/asset_48.webp",
  "konbini-shopping": "/images/generated/asset_49.webp",
  "kyoto-taxi": "/images/generated/asset_50.webp",
  "ordering-ramen": "/images/generated/asset_51.webp",
  "shinjuku-station": "/images/generated/asset_52.webp"
};

export const SRS_CARD_BACKS: string[] = [
  "/images/generated/asset_53.webp",
  "/images/generated/asset_54.webp",
  "/images/generated/asset_55.webp",
  "/images/generated/asset_56.webp",
  "/images/generated/asset_57.webp"
];

export const LEVEL_IMAGES: string[] = [
  "/images/generated/asset_58.webp",
  "/images/generated/asset_59.webp",
  "/images/generated/asset_60.webp",
  "/images/generated/asset_61.webp",
  "/images/generated/asset_62.webp",
  "/images/generated/asset_63.webp",
  "/images/generated/asset_64.webp",
  "/images/generated/asset_65.webp"
];


export function getJourneyImage(slug: string): string | null {
  if (slug === 'hero') return BASE64_IMAGES.journeyHero;
  if (slug === 'mascot') return BASE64_IMAGES.journeyMascot;
  return JOURNEY_LANDMARKS[slug] || null;
}

export function getSurvivalLessonImage(slug: string): string {
  return SURVIVAL_LESSONS[slug] || BASE64_IMAGES.survivalHero;
}

export function getSurvivalCharacterImage(slug: string): string {
  return SURVIVAL_CHARACTERS[slug] || BASE64_IMAGES.manekiNeko;
}

export function getSrsCardBack(index: number): string {
  if (SRS_CARD_BACKS.length === 0) return '';
  return SRS_CARD_BACKS[index % SRS_CARD_BACKS.length];
}

export function getLevelImage(index: number): string {
  if (LEVEL_IMAGES.length === 0) return '';
  return LEVEL_IMAGES[index % LEVEL_IMAGES.length];
}
