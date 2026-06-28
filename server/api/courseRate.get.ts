import {getCourseRateFilePath, readRequiredJsonFromPath} from '~/server/utils/data'

export default defineEventHandler(async () => {
  return readRequiredJsonFromPath(getCourseRateFilePath())
})
