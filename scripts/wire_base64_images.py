import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for target, repl in replacements:
        content = content.replace(target, repl)
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
    else:
        print(f"No change or already updated: {filepath}")

# 1. app/login/page.tsx
replace_in_file('app/login/page.tsx', [
    (
        'import { useState } from "react";',
        'import { useState } from "react";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'style={{ backgroundImage: "url(/images/auth/login-bg.jpg)" }}',
        'style={{ backgroundImage: `url(${BASE64_IMAGES.loginBg})` }}'
    )
])

# 2. app/register/page.tsx
replace_in_file('app/register/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/auth/register-bg.png"',
        'src={BASE64_IMAGES.registerBg} unoptimized'
    )
])

# 3. app/page.tsx (Landing)
replace_in_file('app/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/hero-japan.webp"',
        'src={BASE64_IMAGES.heroJapan} unoptimized'
    ),
    (
        'src="/images/footer-japan.webp"',
        'src={BASE64_IMAGES.footerJapan} unoptimized'
    )
])

# 4. app/app/page.tsx (Dashboard)
replace_in_file('app/app/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/dashboard/footer-sakura.webp"',
        'src={BASE64_IMAGES.footerSakura} unoptimized'
    ),
    (
        'src="/images/dashboard/maneki-neko.webp"',
        'src={BASE64_IMAGES.manekiNeko} unoptimized'
    ),
    (
        'src="/images/dashboard/fuji-dash.webp"',
        'src={BASE64_IMAGES.fujiDash} unoptimized'
    ),
    (
        'src="/dash/light.png"',
        'src={BASE64_IMAGES.dashLight}'
    ),
    (
        'src="/dash/dark.png"',
        'src={BASE64_IMAGES.dashDark}'
    )
])

# 5. app/app/grammar/GrammarClient.tsx
replace_in_file('app/app/grammar/GrammarClient.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/grammar.jpeg"',
        'src={BASE64_IMAGES.grammar} unoptimized'
    )
])

# 6. app/app/grammar/page.tsx
replace_in_file('app/app/grammar/page.tsx', [
    (
        'import { prisma } from "@/lib/prisma";',
        'import { prisma } from "@/lib/prisma";\nimport { BASE64_IMAGES, LEVEL_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/dashboard/fuji-hero.webp"',
        'src={BASE64_IMAGES.fujiHero} unoptimized'
    ),
    (
        'result[lv] = files.length ? `/images/level/${encodeURIComponent(files[i % files.length])}` : null;',
        'result[lv] = LEVEL_IMAGES[i % LEVEL_IMAGES.length] || null;'
    )
])

# 7. app/app/vocabulary/VocabKanjiClient.tsx
replace_in_file('app/app/vocabulary/VocabKanjiClient.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/cang-hoc-cang-gioi.webp"',
        'src={BASE64_IMAGES.cangHocCangGioi}'
    ),
    (
        'src="/images/cat_kanji.png"',
        'src={BASE64_IMAGES.catKanji}'
    )
])

# 8. app/app/practice/page.tsx
replace_in_file('app/app/practice/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/dashboard/fuji-hero.webp"',
        'src={BASE64_IMAGES.fujiHero} unoptimized'
    ),
    (
        'src="/cat_hand.png"',
        'src={BASE64_IMAGES.catHand} unoptimized'
    )
])

# 9. app/app/path/page.tsx
replace_in_file('app/app/path/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/dashboard/fuji-hero.webp"',
        'src={BASE64_IMAGES.fujiHero} unoptimized'
    )
])

# 10. app/app/test/page.tsx
replace_in_file('app/app/test/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/dashboard/fuji-hero.webp"',
        'src={BASE64_IMAGES.fujiHero} unoptimized'
    )
])

# 11. app/app/profile/page.tsx
replace_in_file('app/app/profile/page.tsx', [
    (
        'import { panel } from "./parts";',
        'import { panel } from "./parts";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/profile/japan-profile-hero.svg"',
        'src={BASE64_IMAGES.japanProfileHero}'
    )
])

# 12. app/app/survival/loading.tsx
replace_in_file('app/app/survival/loading.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/survival/loading-girl.webp"',
        'src={BASE64_IMAGES.survivalLoadingGirl} unoptimized'
    )
])

# 13. app/app/survival/page.tsx
replace_in_file('app/app/survival/page.tsx', [
    (
        'import Image from "next/image";',
        'import Image from "next/image";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/images/survival/hero-banner.webp"',
        'src={BASE64_IMAGES.survivalHero} unoptimized'
    )
])

# 14. app/app/survival/SurvivalClient.tsx
replace_in_file('app/app/survival/SurvivalClient.tsx', [
    (
        'import { useSoundAndTheme } from "@/components/SoundAndThemeContext";',
        'import { useSoundAndTheme } from "@/components/SoundAndThemeContext";\nimport { getSurvivalLessonImage, getSurvivalCharacterImage } from "@/lib/assets/base64Images";'
    ),
    (
        'const lessonImg = (slug: string) => `${IMG_BASE}/lesson/${slug}.png`;',
        'const lessonImg = (slug: string) => getSurvivalLessonImage(slug);'
    ),
    (
        'const characterImg = (slug: string) => `${IMG_BASE}/character/${slug}.png`;',
        'const characterImg = (slug: string) => getSurvivalCharacterImage(slug);'
    )
])

# 15. app/app/journey/JourneyClient.tsx
replace_in_file('app/app/journey/JourneyClient.tsx', [
    (
        'import { useSoundAndTheme } from "@/components/SoundAndThemeContext";',
        'import { useSoundAndTheme } from "@/components/SoundAndThemeContext";\nimport { BASE64_IMAGES, getJourneyImage } from "@/lib/assets/base64Images";'
    ),
    (
        'const [src, setSrc] = useState<string | null>(`${IMG_BASE}/${slug}.png`);',
        'const [src, setSrc] = useState<string | null>(getJourneyImage(slug) || `${IMG_BASE}/${slug}.png`);'
    ),
    (
        'return <img src={`${IMG_BASE}/${slug}.png`} alt="" onError={(e) => ((e.currentTarget.style.display = "none"))} />;',
        'const b64 = getJourneyImage(slug);\n  return <img src={b64 || `${IMG_BASE}/${slug}.png`} alt="" onError={(e) => ((e.currentTarget.style.display = "none"))} />;'
    ),
    (
        'style={{ backgroundImage: `url(${IMG_BASE}/hero.png)` }}',
        'style={{ backgroundImage: `url(${BASE64_IMAGES.journeyHero})` }}'
    ),
    (
        'src={`${IMG_BASE}/mascot.png`}',
        'src={BASE64_IMAGES.journeyMascot}'
    )
])

# 16. app/app/learn/CulturePromo.tsx
replace_in_file('app/app/learn/CulturePromo.tsx', [
    (
        'import Link from "next/link";',
        'import Link from "next/link";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/learn/promo-day.jpg"',
        'src={BASE64_IMAGES.promoDay}'
    ),
    (
        'src="/learn/promo-night.jpg"',
        'src={BASE64_IMAGES.promoNight}'
    )
])

# 17. app/app/learn/page.tsx
replace_in_file('app/app/learn/page.tsx', [
    (
        'import Link from "next/link";',
        'import Link from "next/link";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'src="/learn/footer.jpg"',
        'src={BASE64_IMAGES.learnFooter}'
    )
])

# 18. lib/senseiCharacters.ts
replace_in_file('lib/senseiCharacters.ts', [
    (
        'import type { SenseiCharacter } from "@/types/sensei";',
        'import type { SenseiCharacter } from "@/types/sensei";\nimport { BASE64_IMAGES } from "@/lib/assets/base64Images";'
    ),
    (
        'portrait: "/sensei/aoi-portrait.webp",',
        'portrait: BASE64_IMAGES.aoiPortrait,'
    ),
    (
        'src: "/sensei/aoi.webp",',
        'src: BASE64_IMAGES.aoi,'
    ),
    (
        'portrait: "/sensei/ren-portrait.webp",',
        'portrait: BASE64_IMAGES.renPortrait,'
    ),
    (
        'src: "/sensei/ren.webp",',
        'src: BASE64_IMAGES.ren,'
    )
])

# 19. app/app/review/page.tsx
replace_in_file('app/app/review/page.tsx', [
    (
        'import { prisma } from "@/lib/prisma";',
        'import { prisma } from "@/lib/prisma";\nimport { SRS_CARD_BACKS } from "@/lib/assets/base64Images";'
    ),
    (
        'const files = fs.readdirSync(dir);\n    return files\n      .filter((f) => /\\.(png|jpe?g|webp)$/i.test(f))\n      .map((f) => `/images/SRS_card/back/${encodeURIComponent(f)}`);',
        'return SRS_CARD_BACKS;'
    )
])

