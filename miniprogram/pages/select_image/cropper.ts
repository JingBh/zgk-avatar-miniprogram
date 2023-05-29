// pages/select_image/cropper.ts
import { shareMsg, shareTimeline } from '../../utils/share'

const { saveFile, unlink } = wx.getFileSystemManager()

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
      // delete old image
      wx.getStorage({
        key: 'background',
        success: ({ data }) => {
          if (data.startsWith('fs:')) {
            unlink({
              filePath: `${wx.env.USER_DATA_PATH}/${data.substring(3)}`
            })
          }
        }
      })

      // save new image
      const filename = `background${Date.now()}.png`
      saveFile({
        tempFilePath: result.url,
        filePath: `${wx.env.USER_DATA_PATH}/${filename}`,
        success: () => {
          wx.setStorage({
            key: 'background',
            data: `fs:${filename}`,
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
          wx.showToast({
            title: '保存图片失败',
            icon: 'error',
            duration: 2000
          })
        }
      })
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
