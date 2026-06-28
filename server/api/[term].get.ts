import {getTermFilePath, isKnownTerm, readRequiredJsonFromPath} from '~/server/utils/data'

export default defineEventHandler(async (event) => {
  const term = getRouterParam(event, 'term') || ''

  if (!(await isKnownTerm(term))) {
    throw createError({statusCode: 404, statusMessage: 'Unknown dataset'})
  }

  return readRequiredJsonFromPath(getTermFilePath(term))
})
