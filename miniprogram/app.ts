// app.ts

App({
  globalData: {},

  onShow(options) {
    switch (options.scene) {
      case 1173:
        if (options.forwardMaterials) {
          const src = options.forwardMaterials[0].path
          console.log(`selected image src: ${src}`)
          wx.redirectTo({
            url: `/pages/select_image/cropper?src=${encodeURIComponent(src)}`
          })
        }
        break
    }
  }
})
