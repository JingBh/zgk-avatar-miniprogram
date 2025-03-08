// app.ts

import compareVersion from './utils/compare-version'
import log from './utils/log'

App({
  globalData: {},

  onShow(options) {
    switch (options.scene) {
      case 1173:
        if (options.forwardMaterials) {
          const src = options.forwardMaterials[0].path
          log.log(`selected image src: ${src}`)
          wx.redirectTo({
            url: `/pages/select_image/cropper?src=${encodeURIComponent(src)}`
          })
        }
        break
    }

    if (compareVersion('2.26.2') === 1) {
      wx.getSkylineInfo({
        success: ({ reason }) => {
          if (reason) {
            log.info('not using skyline because: ', reason)
          }
        }
      })
    } else {
      log.info('not using skyline because: lib version')
    }
  }
})
