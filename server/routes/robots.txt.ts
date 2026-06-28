import {setResponseHeader} from 'h3'

import {siteUrl} from '~/shared/legacy-pages'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return ['User-agent: *', 'Allow: /', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n')
})
