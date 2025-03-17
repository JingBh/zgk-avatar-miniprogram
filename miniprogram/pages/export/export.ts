// pages/export/export.ts
import { checkCustomSupported } from '../../utils/custom-supported'
import { getManifest, type IImageForeground } from '../../utils/images'
import { keyBackground } from '../../utils/local-storage'
import log from '../../utils/log'
import { clearGenerated, generate, listGenerated } from '../../utils/service'
import { applySaveImage } from '../../utils/settings'
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {
    step: 0,
    bgSrc: null as string | null,
    fgImage: null as IImageForeground | null,
    fgShadow: false,
    fgScale: 0.75,
    fgPreset: [] as IImageForeground[],
    fgCustom: [] as IImageForeground[],
    customPopupShow: false,
    customOuterText: '清华附中',
    customOuterError: '',
    customInnerText: '',
    customInnerError: ''
  },

  onLoad() {
    this.loadPreset()
  },

  onShow() {
    this.loadImages()
    this.loadCustom()
  },

  loadPreset() {
    getManifest().then((manifest) => {
      this.setData({
        fgPreset: manifest.foreground.images
      })
      if (!this.data.fgImage && manifest.foreground.images.length) {
        this.setData({
          fgImage: manifest.foreground.images[0]
        })
      }
    }).catch((e) => {
      log.error(e)
      // TODO: replace with custom notify
      wx.showToast({
        icon: 'error',
        title: '加载相册失败',
        duration: 2000
      })
      this.setData({
        fgPreset: []
      })
    })
  },

  loadImages() {
    wx.getStorage<string>({
      key: keyBackground,
      success: ({ data }) => {
        if (data) {
          if (data.startsWith('fs:')) {
            this.setData({
              bgSrc: `${wx.env.USER_DATA_PATH}/${data.substring(3)}`
            })
          } else {
            this.setData({
              bgSrc: data
            })
          }
          if (!this.data.step) {
            this.setData({
              step: 1
            })
          }
        }
      },
      fail: this.handleBackgroundFail
    })
  },

  async loadCustom() {
    try {
      this.setData({
        fgCustom: await listGenerated()
      })
    } catch (e) {
      log.error(e)
      this.setData({
        fgCustom: []
      })
    }
  },

  validateCustom(): boolean {
    this.setData({
      customOuterError: '',
      customInnerError: ''
    })

    if (!this.data.customOuterText) {
      this.setData({
        customOuterError: '请输入外圈文字'
      })
    } else if (this.data.customOuterText.length < 3) {
      this.setData({
        customOuterError: '外圈文字过短'
      })
    } else if (this.data.customOuterText.length > 4) {
      this.setData({
        customOuterError: '外圈文字过长'
      })
    } else {
      const res = checkCustomSupported(this.data.customOuterText)
      if (res !== true) {
        this.setData({
          customOuterError: `不支持字符“${res}”，请只输入汉字`
        })
      }
    }

    if (!this.data.customInnerText) {
      this.setData({
        customInnerError: '请输入中心文字'
      })
    } else if (this.data.customInnerText.length < 4) {
      this.setData({
        customInnerError: '中心文字过短'
      })
    } else if (this.data.customInnerText.length > 8) {
      this.setData({
        customInnerError: '中心文字过长'
      })
    } else {
      const res = checkCustomSupported(this.data.customInnerText)
      if (res !== true) {
        this.setData({
          customInnerError: `不支持字符“${res}”，请只输入汉字`
        })
      }
    }

    return !this.data.customOuterError && !this.data.customInnerError
  },

  handleBackgroundFail(e: WechatMiniprogram.CustomEvent<WechatMiniprogram.GeneralCallbackResult> | WechatMiniprogram.GeneralCallbackResult) {
    log.error('detail' in e ? e.detail : e)
    this.setData({
      step: 0,
      bgSrc: null
    })
    wx.showModal({
      title: '注意',
      content: '图片加载失败，请重新选择',
      showCancel: false,
      success: () => {
        wx.navigateBack()
      }
    })
  },

  handleForegroundFail(e: WechatMiniprogram.CustomEvent<WechatMiniprogram.GeneralCallbackResult> | WechatMiniprogram.GeneralCallbackResult) {
    log.error('detail' in e ? e.detail : e)
    this.setData({
      step: 1,
      fgImage: null
    })
  },

  handleChooseForeground(e: WechatMiniprogram.TouchEvent) {
    this.setData({
      fgImage: e.currentTarget.dataset.image
    })
  },

  handleCustomGenerate() {
    if (this.validateCustom()) {
      for (const image of [...this.data.fgPreset, ...this.data.fgCustom]) {
        if (image.outerText === this.data.customOuterText && image.innerText === this.data.customInnerText) {
          wx.showModal({
            title: '注意',
            content: '已存在相同的自定义图片，无需重复生成',
            showCancel: false
          })
          return this.setData({
            fgImage: image,
            customPopupShow: false
          })
        }
      }

      wx.showLoading({
        title: '生成中',
        mask: true
      })
      generate(this.data.customOuterText, this.data.customInnerText).then((image) => {
        this.setData({
          fgImage: image,
          customPopupShow: false
        })
        this.loadCustom().finally(() => {
          wx.hideLoading()
        })
      }).catch((e) => {
        wx.hideLoading()
        wx.showModal({
          title: '注意',
          content: e,
          showCancel: false
        })
      })
    }
  },

  handleCustomClear() {
    wx.showModal({
      title: '注意',
      content: '确定要清除所有自定义图片吗？',
      showCancel: true,
      success: ({ confirm }) => {
        if (confirm) {
          wx.showLoading({
            title: '处理中',
            mask: true
          })
          clearGenerated().then(() => {
            this.loadCustom()
            wx.hideLoading()
          }).catch((e) => {
            log.error(e)
            this.loadCustom()
            wx.hideLoading()
            wx.showToast({
              icon: 'error',
              title: '清除失败',
              duration: 2000
            })
          }).finally(() => {
            this.setData({
              fgImage: this.data.fgPreset.length ? this.data.fgPreset[0] : null
            })
          })
        }
      }
    })
  },

  handleChooseFg() {
    if (this.data.fgImage) {
      this.setData({
        step: 2
      })
    }
  },

  handleReChooseFg() {
    this.setData({
      step: 1
    })
  },

  handleChangeShadow(e: WechatMiniprogram.SwitchChange) {
    this.setData({
      fgShadow: e.detail.value
    })
  },

  handleChangeScale(e: WechatMiniprogram.SliderChange) {
    this.setData({
      fgScale: e.detail.value
    })
  },

  handleShowPopup() {
    this.setData({
      customPopupShow: true,
      customOuterText: '清华附中',
      customOuterError: '',
      customInnerText: '',
      customInnerError: ''
    })
  },

  handleHidePopup() {
    this.setData({
      customPopupShow: false
    })
  },

  handleOuterChange(e: WechatMiniprogram.Input) {
    this.setData({
      customOuterText: e.detail.value
    })
    this.validateCustom()
  },

  handleInnerChange(e: WechatMiniprogram.Input) {
    this.setData({
      customInnerText: e.detail.value
    })
    this.validateCustom()
  },

  handleExport() {
    if (!this.data.fgImage) {
      return this.setData({
        step: 1
      })
    }

    if (!this.data.bgSrc) {
      this.setData({
        step: 0
      })
      return this.loadImages()
    }

    applySaveImage(() => {
      wx.showLoading({
        title: '处理图片中',
        mask: true
      })

      const size = 1024
      const offscreenCanvas = wx.createOffscreenCanvas({
        type: '2d',
        width: size,
        height: size
      })
      const ctx = offscreenCanvas.getContext('2d') as WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D
      ctx.clearRect(0, 0, size, size)

      const bgPromise = new Promise<WechatMiniprogram.Image>((resolve, reject) => {
        if (!this.data.bgSrc) {
          return reject('background image not found')
        }

        const bgImg = offscreenCanvas.createImage()
        bgImg.referrerPolicy = 'origin'
        bgImg.onload = () => {
          resolve(bgImg)
        }
        bgImg.onerror = (e) => {
          reject(e)
        }
        bgImg.src = this.data.bgSrc
      })
      const fgPromise = new Promise<WechatMiniprogram.Image>((resolve, reject) => {
        if (!this.data.fgImage) {
          return reject('foreground image not found')
        }

        const fgImg = offscreenCanvas.createImage()
        fgImg.referrerPolicy = 'origin'
        fgImg.onload = () => {
          resolve(fgImg)
        }
        fgImg.onerror = (e) => {
          reject(e)
        }
        fgImg.src = this.data.fgShadow ? this.data.fgImage.shadowPath : this.data.fgImage.noShadowPath
      })

      bgPromise.then((bgImg) => {
        fgPromise.then((fgImg) => {
          ctx.drawImage(bgImg, 0, 0, size, size)
          ctx.drawImage(fgImg,
            size * (1 - this.data.fgScale) / 2,
            size * (1 - this.data.fgScale) / 2,
            size * this.data.fgScale,
            size * this.data.fgScale)

          wx.canvasToTempFilePath({
            canvas: offscreenCanvas,
            success: ({ tempFilePath }) => {
              wx.saveImageToPhotosAlbum({
                filePath: tempFilePath,
                success: () => {
                  wx.hideLoading()
                  wx.showToast({
                    title: '保存成功',
                    icon: 'success',
                    duration: 2000
                  })
                },
                fail: (e) => {
                  log.error(e)
                  wx.hideLoading()
                }
              })
            },
            fail: (e) => {
              log.error(e)
              wx.hideLoading()
              wx.showToast({
                title: '导出图片失败',
                icon: 'error',
                duration: 2000
              })
            }
          })
        }).catch((e) => {
          log.error(e || 'failed to load foreground image')
          wx.hideLoading()
          wx.showToast({
            title: '加载图片失败',
            icon: 'error',
            duration: 2000
          })
        })
      }).catch((e) => {
        log.error(e || 'failed to load background image')
        wx.hideLoading()
        wx.showToast({
          title: '加载图片失败',
          icon: 'error',
          duration: 2000
        })
      })
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
