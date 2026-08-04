const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'image/gif')
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  return transparentGif
})
