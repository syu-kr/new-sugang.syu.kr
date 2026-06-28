import {getSnapshotFilePath, readOptionalJsonFromPath} from '~/server/utils/data'

export default defineEventHandler(async () => {
  return readOptionalJsonFromPath(getSnapshotFilePath('warning'))
})
