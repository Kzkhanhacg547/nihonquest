import os, io, base64, json
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
OUTPUT_TS = os.path.join(BASE_DIR, 'lib', 'assets', 'base64Images.ts')

def optimize_and_encode(rel_path, max_dim=1200, quality=78, target_format='WEBP'):
    full_path = os.path.join(PUBLIC_DIR, rel_path.replace('/', os.sep))
    if not os.path.exists(full_path):
        print(f"Warning: File not found: {full_path}")
        return None
    
    if rel_path.endswith('.svg'):
        with open(full_path, 'rb') as f:
            data = f.read()
        b64 = base64.b64encode(data).decode('ascii')
        return f"data:image/svg+xml;base64,{b64}"
    
    try:
        im = Image.open(full_path)
        orig_sz = os.path.getsize(full_path)
        
        # Preserve alpha channel for RGBA / P modes
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            im = im.convert('RGBA')
        else:
            im = im.convert('RGB')
            
        im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        
        buf = io.BytesIO()
        im.save(buf, format=target_format, quality=quality, method=6)
        opt_data = buf.getvalue()
        
        if len(opt_data) < orig_sz:
            with open(full_path, 'wb') as fp:
                fp.write(opt_data)
            print(f"Compressed {rel_path}: {orig_sz//1024}KB -> {len(opt_data)//1024}KB")
        else:
            print(f"Kept {rel_path}: {orig_sz//1024}KB")
            
        b64 = base64.b64encode(opt_data).decode('ascii')
        mime = f"image/{target_format.lower()}"
        return f"data:{mime};base64,{b64}"
    except Exception as e:
        print(f"Error processing {rel_path}: {e}")
        return None

def main():
    os.makedirs(os.path.dirname(OUTPUT_TS), exist_ok=True)
    
    core_items = {
        'heroJapan': ('images/hero-japan.webp', 1280, 75),
        'footerJapan': ('images/footer-japan.webp', 1280, 75),
        'loginBg': ('images/auth/login-bg.jpg', 1280, 75),
        'registerBg': ('images/auth/register-bg.png', 1280, 75),
        'fujiHero': ('images/dashboard/fuji-hero.webp', 1280, 75),
        'fujiDash': ('images/dashboard/fuji-dash.webp', 1000, 75),
        'footerSakura': ('images/dashboard/footer-sakura.webp', 1200, 75),
        'manekiNeko': ('images/dashboard/maneki-neko.webp', 500, 80),
        'catHand': ('cat_hand.png', 400, 80),
        'catKanji': ('images/cat_kanji.png', 400, 80),
        'cangHocCangGioi': ('images/cang-hoc-cang-gioi.webp', 600, 78),
        'grammar': ('images/grammar.jpeg', 800, 75),
        'dashLight': ('dash/light.png', 800, 75),
        'dashDark': ('dash/dark.png', 800, 75),
        'japanProfileHero': ('images/profile/japan-profile-hero.svg', 1000, 80),
        
        # Sensei
        'aoiPortrait': ('sensei/aoi-portrait.webp', 300, 80),
        'aoi': ('sensei/aoi.webp', 600, 78),
        'renPortrait': ('sensei/ren-portrait.webp', 300, 80),
        'ren': ('sensei/ren.webp', 600, 78),
        
        # Learn
        'promoDay': ('learn/promo-day.jpg', 800, 75),
        'promoNight': ('learn/promo-night.jpg', 800, 75),
        'heroFuji': ('learn/hero-fuji.jpg', 900, 75),
        'kanaCard': ('learn/kana-card.jpg', 600, 75),
        'learnBanner': ('learn/banner.jpg', 900, 75),
        'learnFooter': ('learn/footer.jpg', 800, 75),
        
        # SRS
        'srsHeader': ('images/SRS_card/header.png', 1000, 75),
        
        # Survival
        'survivalHero': ('images/survival/hero-banner.webp', 1000, 75),
        'survivalLoadingGirl': ('images/survival/loading-girl.webp', 800, 75),
        
        # Journey heroes
        'journeyHero': ('images/journey/hero.png', 1000, 75),
        'journeyMascot': ('images/journey/mascot.png', 600, 78),
    }

    result = {}
    for key, (path, max_dim, q) in core_items.items():
        data_uri = optimize_and_encode(path, max_dim, q)
        if data_uri:
            result[key] = data_uri

    # Journey landmark cities
    journey_cities = ['tokyo', 'kyoto', 'nara', 'osaka', 'hokkaido', 'okinawa', 'hiroshima', 'nagoya']
    journey_map = {}
    for city in journey_cities:
        uri = optimize_and_encode(f'images/journey/{city}.png', 600, 78)
        if uri:
            journey_map[city] = uri

    # Survival lessons
    survival_slugs = ['akihabara-anime', 'hakone-ryokan', 'japanese-pharmacy', 'konbini-shopping', 'kyoto-taxi', 'ordering-ramen', 'shinjuku-station']
    survival_lessons = {}
    for slug in survival_slugs:
        uri = optimize_and_encode(f'images/survival/lesson/{slug}.png', 800, 75)
        if uri:
            survival_lessons[slug] = uri

    # Survival characters
    survival_characters = {}
    for slug in survival_slugs:
        uri = optimize_and_encode(f'images/survival/character/{slug}.png', 600, 78)
        if uri:
            survival_characters[slug] = uri

    # SRS card backs
    srs_backs = []
    for f in ['1.png', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg']:
        uri = optimize_and_encode(f'images/SRS_card/back/{f}', 800, 75)
        if uri:
            srs_backs.append(uri)

    # Levels 1..8
    levels = []
    for i in range(1, 9):
        uri = optimize_and_encode(f'images/level/{i}.jpeg', 600, 75)
        if uri:
            levels.append(uri)

    # Output TypeScript code
    ts_code = [
        "/* eslint-disable max-len */",
        "/**",
        " * Optimized Base64 Image Assets for Nihon Quest",
        " * Pre-compressed with high-efficiency WebP/SVG for zero latency and instant rendering.",
        " */",
        "",
        "export const BASE64_IMAGES = {",
    ]

    for k, v in result.items():
        ts_code.append(f'  {k}: "{v}",')

    ts_code.append("} as const;")
    ts_code.append("")

    ts_code.append(f"export const JOURNEY_LANDMARKS: Record<string, string> = {json.dumps(journey_map, indent=2)};")
    ts_code.append("")
    ts_code.append(f"export const SURVIVAL_LESSONS: Record<string, string> = {json.dumps(survival_lessons, indent=2)};")
    ts_code.append("")
    ts_code.append(f"export const SURVIVAL_CHARACTERS: Record<string, string> = {json.dumps(survival_characters, indent=2)};")
    ts_code.append("")
    ts_code.append(f"export const SRS_CARD_BACKS: string[] = {json.dumps(srs_backs, indent=2)};")
    ts_code.append("")
    ts_code.append(f"export const LEVEL_IMAGES: string[] = {json.dumps(levels, indent=2)};")
    ts_code.append("")
    ts_code.append("""
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
""")

    with open(OUTPUT_TS, 'w', encoding='utf-8') as f:
        f.write("\n".join(ts_code))

    ts_size = os.path.getsize(OUTPUT_TS)
    print(f"\nGenerated {OUTPUT_TS}: {ts_size//1024} KB")

if __name__ == '__main__':
    main()

