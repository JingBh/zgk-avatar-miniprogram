const cache = {} as Record<string, string>

export const getImagePath = async (url: string) => {
  if (cache[url]) return cache[url]

  return await new Promise<string>((resolve, reject) => {
    wx.getImageInfo({
      src: url,
      success: ({ path }) => {
        cache[url] = path
        resolve(path)
      },
      fail: reject,
    })
  })
}
