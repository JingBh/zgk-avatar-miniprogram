export const applySaveImage = (cb: () => void) => {
  wx.getSetting({
    success: ({ authSetting }) => {
      if (authSetting['scope.writePhotosAlbum']) {
        cb()
      } else {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            cb()
          },
          fail: () => {
            wx.showModal({
              title: '提示',
              content: '我们需要相应权限才能保存图片。是否前往设置？',
              success: ({ confirm }) => {
                if (confirm) {
                  wx.openSetting({
                    success: () => {
                      applySaveImage(cb)
                    }
                  })
                }
              }
            })
          }
        })
      }
    }
  })
}
