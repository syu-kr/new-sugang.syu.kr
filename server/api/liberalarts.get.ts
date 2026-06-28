import {getLiberalArtsFilePath, readRequiredJsonFromPath} from '~/server/utils/data'

export default defineEventHandler(async () => {
  return readRequiredJsonFromPath(getLiberalArtsFilePath())
})
