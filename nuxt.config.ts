export default defineNuxtConfig({
  compatibilityDate: '2026-06-28',
  app: {
    head: {
      htmlAttrs: {
        lang: 'ko',
      },
      link: [{rel: 'icon', href: '/favicon.ico'}],
      script: [
        {
          key: 'google-analytics-src',
          async: true,
          src: 'https://www.googletagmanager.com/gtag/js?id=G-13FLHMGH10',
        },
        {
          key: 'google-analytics-inline',
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-13FLHMGH10');
          `,
        },
      ],
    },
  },
})
