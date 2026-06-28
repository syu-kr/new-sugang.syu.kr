import {readLegacyPageDocument} from '~/server/utils/legacy'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') || ''
  const document = await readLegacyPageDocument(name)

  if (!document) {
    throw createError({statusCode: 404, statusMessage: 'Legacy page not found'})
  }

  return document
})
