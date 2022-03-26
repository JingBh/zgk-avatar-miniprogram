// pages/select_image/cropper.ts
import { shareMsg, shareTimeline } from '../../utils/share'

const { saveFile } = wx.getFileSystemManager()

Page({
  data: {
    imageSrc: ''
  },

  onLoad(query) {
    if (!query || !query.src) {
      wx.navigateBack()
      return
    }
    wx.showLoading({
      title: '加载图片中',
      mask: true
    })
    this.setData({
      imageSrc: decodeURIComponent(query.src)
    })
  },

  onImageLoad() {
    this.selectComponent("#cropper").imgReset()
    wx.hideLoading()
  },

  saveImage() {
    wx.showLoading({
      title: '处理图片中',
      mask: true
    })
    const cropper = this.selectComponent("#cropper")
    cropper.setData({
      export_scale: 1024 / cropper.data.width
    })
    cropper.getImg((result: {
      url: string,
      width: number,
      height: number
    }) => {
      const path = `${wx.env.USER_DATA_PATH}/background.png`

      saveFile({
        tempFilePath: result.url,
        filePath: path,
        success: () => {
          wx.setStorage({
            key: 'background',
            data: 'fs',
            success: () => {
              wx.redirectTo({
                url: '/pages/select_image/foreground'
              })
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({
                title: '保存图片失败',
                icon: 'error',
                duration: 2000
              })
            }
          })
        },
        fail: () => {
          wx.hideLoading()
        }
      })
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
