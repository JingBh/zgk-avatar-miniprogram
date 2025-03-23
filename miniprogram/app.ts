// app.ts

import log from './utils/log'
import { login } from './utils/service'

App({
  globalData: {},

  onLaunch() {
    login().catch((e) => {
      log.error(e)
      wx.showToast({
        icon: 'error',
        title: '登录失败',
        duration: 2000
      })
    })
  },

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

    if (wx.canIUse('getSkylineInfo')) {
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
