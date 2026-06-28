import {listAvailableTermDetails} from '~/server/utils/data'

export default defineEventHandler(async () => {
  return listAvailableTermDetails()
})
