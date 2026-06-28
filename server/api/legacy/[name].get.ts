import {setResponseHeader} from 'h3'

import {readLegacyPage} from '~/server/utils/legacy'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') || ''
  const html = await readLegacyPage(name)

  if (!html) {
    throw createError({statusCode: 404, statusMessage: 'Legacy page not found'})
  }

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')

  return html
})
