export type LegacySitemapChangefreq = 'hourly' | 'daily' | 'weekly' | 'monthly'

export type LegacyPageDefinition = {
  fileName: string
  path: string
  title: string
  description: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  robots?: string
  indexable: boolean
  changefreq: LegacySitemapChangefreq
  priority: number
  promoteTitleToHeading?: boolean
}

export const siteUrl = 'https://sugang.syu.kr'
export const defaultOgImage = 'https://www.syu.kr/assets/img/banner.png'

export const legacyPages = {
  basket: {
    fileName: 'basket.html',
    path: '/basket',
    title: '삼육대학교 수강신청 장바구니 경쟁률 현황',
    description: '삼육대학교 수강신청 장바구니 경쟁률을 실시간으로 확인할 수 있습니다.',
    keywords: '삼육대학교, 수강신청, 장바구니, 경쟁률, 실시간',
    ogTitle: '삼육대학교 수강신청 장바구니 경쟁률 현황',
    ogDescription: '삼육대학교 수강신청 장바구니 경쟁률을 실시간으로 확인할 수 있습니다.',
    indexable: true,
    changefreq: 'hourly',
    priority: 1,
    promoteTitleToHeading: true,
  },
  closed: {
    fileName: 'closed.html',
    path: '/closed',
    title: '삼육대학교 수강신청 폐강위기 현황',
    description: '삼육대학교 수강신청 폐강위기 과목 현황을 확인할 수 있습니다.',
    keywords: '삼육대학교, 수강신청, 폐강위기, 폐강, 강의 현황',
    ogTitle: '삼육대학교 수강신청 폐강위기 현황',
    ogDescription: '삼육대학교 수강신청 폐강위기 과목 현황을 확인할 수 있습니다.',
    indexable: true,
    changefreq: 'daily',
    priority: 0.8,
    promoteTitleToHeading: true,
  },
  liberalarts: {
    fileName: 'liberalarts.html',
    path: '/liberalarts',
    title: '교양 학기별 수강신청 장바구니 경쟁률',
    description: '공통 교양 과목의 학기별 장바구니 경쟁률을 과목별로 확인할 수 있습니다.',
    keywords: '공통 교양, 교양, 수강신청, 장바구니, 경쟁률, 삼육대학교',
    ogTitle: '공통 교양 과목별 경쟁률 - 삼육대학교',
    ogDescription: '공통 교양 과목의 학기별 장바구니 경쟁률을 과목별로 확인할 수 있습니다.',
    indexable: true,
    changefreq: 'daily',
    priority: 0.9,
    promoteTitleToHeading: true,
  },
  test1: {
    fileName: 'test1.html',
    path: '/test1',
    title: '삼육대학교 모의 수강신청 세션',
    description: '삼육대학교 모의 수강신청 내부 세션 페이지입니다.',
    robots: 'noindex, nofollow, noarchive',
    indexable: false,
    changefreq: 'monthly',
    priority: 0.1,
  },
  test2: {
    fileName: 'test2.html',
    path: '/test2',
    title: '삼육대학교 모의 수강신청 세션',
    description: '삼육대학교 모의 수강신청 내부 세션 페이지입니다.',
    robots: 'noindex, nofollow, noarchive',
    indexable: false,
    changefreq: 'monthly',
    priority: 0.1,
  },
  testlogin: {
    fileName: 'testLogin.html',
    path: '/testLogin',
    title: '삼육대학교 모의 수강신청',
    description: '삼육대학교 모의 수강신청 페이지에서 수강신청 흐름을 미리 연습할 수 있습니다.',
    keywords: '삼육대학교, 모의 수강신청, 수강신청 연습',
    ogTitle: '삼육대학교 모의 수강신청',
    ogDescription: '삼육대학교 모의 수강신청 페이지에서 수강신청 흐름을 미리 연습할 수 있습니다.',
    indexable: true,
    changefreq: 'weekly',
    priority: 0.7,
  },
  warning: {
    fileName: 'warning.html',
    path: '/warning',
    title: '삼육대학교 수강신청 안내',
    description: '삼육대학교 수강신청 관련 안내 페이지입니다.',
    robots: 'noindex, nofollow, noarchive',
    indexable: false,
    changefreq: 'monthly',
    priority: 0.1,
  },
} as const satisfies Record<string, LegacyPageDefinition>

export type LegacyPageName = keyof typeof legacyPages

export const legacyPageFiles = Object.fromEntries(
  Object.entries(legacyPages).map(([name, page]) => [name, page.fileName]),
) as Record<LegacyPageName, string>

export function getLegacyPageDefinition(name: LegacyPageName) {
  return legacyPages[name]
}

export function listIndexableLegacyPages() {
  return (Object.entries(legacyPages) as [LegacyPageName, (typeof legacyPages)[LegacyPageName]][]).filter(
    ([, page]) => page.indexable,
  )
}

export function resolveLegacyPageName(name: string) {
  const normalized = name.trim().toLowerCase()
  if (normalized in legacyPages) {
    return normalized as LegacyPageName
  }

  return null
}
