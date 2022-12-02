// app.ts

App({
  globalData: {},

  // the type definition doesn't support this yet.
  onShow(options: Record<string, any>) {
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
