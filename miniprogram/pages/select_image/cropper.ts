// pages/select_image/cropper.ts
import compareVersion from '../../utils/compare-version'
import { shareMsg, shareTimeline } from '../../utils/share'

const { saveFile, unlink } = wx.getFileSystemManager()

Page({
  data: {
    hasNative: true,
    imageSrc: ''
  },

  onLoad(query) {
    if (!query || !query.src) {
      wx.navigateBack()
      return
    }
    const imageSrc = decodeURIComponent(query.src)

    wx.showLoading({
      title: '加载图片中',
      mask: true
    })

    // check for native cropping
    if (wx.cropImage && compareVersion(wx.getSystemInfoSync().SDKVersion, '2.28.1') >= 0) {
      wx.cropImage({
        src: imageSrc,
        cropScale: '1:1',
        success: ({ tempFilePath }) => this.saveImage(tempFilePath),
        fail: (error) => {
          console.error(error)
          wx.navigateBack()
        },
        complete: () => wx.hideLoading()
      })
    } else {
      this.setData({
        hasNative: false
      })
    }

    this.setData({
      imageSrc
    })
  },

  onImageLoad() {
    this.selectComponent("#cropper").imgReset()
    wx.hideLoading()
  },

  onCropFinish() {
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
    }) => this.saveImage(result.url))
  },

  saveImage(url: string) {
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
      tempFilePath: url,
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
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
