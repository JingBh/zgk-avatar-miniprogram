// pages/export/export.ts
import { getImagePath } from '../../utils/images-cache'

export default Page({
  data: {
    complete: false,
    textSize: 0.75,
    _canvas: null as WechatMiniprogram.Canvas | null
  },

  onReady () {
    wx.createSelectorQuery()
    .select('#main')
    .fields({ node: true })
    .exec((res) => {
      const canvas = res[0].node as WechatMiniprogram.Canvas

      canvas.width = 1024
      canvas.height = 1024

      this.setData({
        _canvas: res[0].node as WechatMiniprogram.Canvas
      })

      this.startDrawImages()
    })
  },

  onTextSizeChange(e: StringEvent) {
    this.setData({
      textSize: Number(e.detail)
    })
    this.startDrawImages()
  },

  startDrawImages() {
    if (this.data.complete === false) {
      wx.showLoading({
        title: '处理图片中',
        mask: true,
      })
    } else {
      this.setData({
        complete: false
      })
    }
    this.drawImages().then(() => {
      this.setData({
        complete: true,
      })
    }).catch(() => {
      wx.showToast({
        title: '图片加载失败',
        icon: 'error',
        duration: 5000,
      })
    }).then(() => {
      wx.hideLoading()
    })
  },

  async drawImages() {
    await new Promise<void>((resolve, reject) => {
      wx.getStorage<string>({
        key: 'background',
        success: ({ data }) => {
          const url = data === 'fs'
            ? `${wx.env.USER_DATA_PATH}/background.png`
            : data
          this.drawImage(url).then(resolve).catch(reject)
        },
        fail: reject,
      })
    })

    await new Promise<void>((resolve, reject) => {
      wx.getStorage<string>({
        key: 'foreground',
        success: ({ data }) => {
          const url = data === 'fs'
            ? `${wx.env.USER_DATA_PATH}/foreground.png`
            : data
          this.drawImage(url, this.data.textSize).then(resolve).catch(reject)
        },
        fail: reject,
      })
    })
  },

  drawImage(url: string, scale: number = 1.0): Promise<void> {
    const canvas = this.data._canvas!
    const ctx = canvas.getContext('2d')

    return new Promise<void>((resolve, reject) => {
      getImagePath(url).then((path) => {
        const image = canvas.createImage()
        image.onload = () => {
          const size = 1024 * scale
          const padding = (1024 - size) / 2
          ctx.drawImage(image, padding, padding, size, size)
          resolve()
        }
        image.onerror = reject
        image.src = path
      })
    })
  },

  onSaveImage() {
    wx.getSetting({
      success: ({ authSetting }) => {
        if (authSetting['scope.writePhotosAlbum']) {
          this.saveImage()
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.saveImage()
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '我们需要相应权限才能保存图片。是否前往设置？',
                success: ({ confirm }) => {
                  if (confirm) {
                    wx.openSetting({
                      success: () => {
                        this.onSaveImage()
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
  },

  saveImage() {
    wx.showLoading({
      title: '处理图片中',
      mask: true,
    })

    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      destWidth: 1024,
      destHeight: 1024,
      canvas: this.data._canvas!,
      fileType: 'jpg',
      success: ({ tempFilePath }) => {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存图片成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: () => {
            wx.showToast({
              title: '保存图片失败',
              icon: 'error',
              duration: 2000
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '保存图片失败',
          icon: 'error',
          duration: 2000,
        })
      }
    })
  }
})
