export default defineNuxtConfig({
  compatibilityDate: '2026-06-28',
  app: {
    head: {
      htmlAttrs: {
        lang: 'ko',
      },
      link: [{rel: 'icon', href: '/favicon.ico'}],
    },
  },
})
