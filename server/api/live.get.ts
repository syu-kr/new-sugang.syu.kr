import {getExternalLiveFilePath, readOptionalJsonFromPath} from '~/server/utils/data'

export default defineEventHandler(async () => {
  return readOptionalJsonFromPath(getExternalLiveFilePath())
})
