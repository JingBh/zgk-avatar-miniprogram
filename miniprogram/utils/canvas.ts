const { accessSync, mkdirSync, writeFile } = wx.getFileSystemManager()
const tempDir = `${wx.env.USER_DATA_PATH}/tmp`

export const canvasToTempFilePath = (canvas: WechatMiniprogram.Canvas | WechatMiniprogram.OffscreenCanvas, args: Partial<WechatMiniprogram.CanvasToTempFilePathOption>): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    let platform = ''
    if (wx.canIUse('getDeviceInfo')) {
      platform = wx.getDeviceInfo().platform
    } else {
      platform = wx.getSystemInfoSync().platform
    }

    if (platform === 'mac') {
      const url = (canvas as WechatMiniprogram.Canvas)
        .toDataURL('image/png', 1)
        .replace('data:image/png;base64,', '')

      try {
        accessSync(tempDir)
      } catch (_) {
        mkdirSync(tempDir)
      }

      const filePath = `${tempDir}/${Date.now()}.png`
      writeFile({
        filePath,
        data: url,
        encoding: 'base64',
        success: () => {
          resolve(filePath)
        },
        fail: reject
      })
    } else {
      wx.canvasToTempFilePath(Object.assign({}, args, {
        canvas,
        success: ({ tempFilePath }: WechatMiniprogram.CanvasToTempFilePathSuccessCallbackResult) => {
          resolve(tempFilePath)
        },
        fail: reject
      }) as WechatMiniprogram.CanvasToTempFilePathOption)
    }
  })
}
