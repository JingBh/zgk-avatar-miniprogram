import compareVersion from '../../utils/compare-version'
import { getBackgroundAlbum, type IImageAlbumBackground } from '../../utils/images'
import { keyAlbumSaveImageConsent } from '../../utils/local-storage'
import log from '../../utils/log'
import { applySaveImage } from '../../utils/settings'
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {
    album: null as IImageAlbumBackground | null,
    nativeMasonry: true
  },

  userData: {
    saveImageConsent: false
  },

  onLoad(query) {
    this.setData({
      nativeMasonry: compareVersion('2.30.4') !== -1
    })

    if (!query || !query.name) {
      wx.navigateBack()
      return
    }

    getBackgroundAlbum(decodeURIComponent(query.name))
      .then((value) => {
        this.setData({
          album: value
        })
        wx.setNavigationBarTitle({
          title: value.title
        })
      })
      .catch(() => {
        wx.showToast({
          title: '加载相册失败',
          icon: 'error'
        })
        wx.navigateBack()
      })

    wx.getStorage({
      key: keyAlbumSaveImageConsent,
      success: () => {
        this.userData.saveImageConsent = true
      }
    })
  },

  onReady() {
    this.setNavigationBarState()
  },

  setNavigationBarState() {
    if (this.data.album?.title) {
      wx.setNavigationBarTitle({
        title: this.data.album.title
      })
    }
  },

  cropImage(src: string) {
    log.log(`selected image src: ${src}`)
    wx.navigateTo({
      url: `/pages/cropper/cropper?src=${encodeURIComponent(src)}`
    })
  },

  handleSelectImage(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url

    wx.showLoading({
      title: '下载图片中',
      mask: true
    })

    wx.reportEvent('bg_preset', {
      image_url: url
    })

    wx.getImageInfo({
      src: url,
      complete: () => wx.hideLoading(),
      success: ({ path }) => {
        this.cropImage(path)
      },
      fail: () => {
        wx.showToast({
          title: '下载图片失败',
          icon: 'error',
          duration: 2000
        })
      },
    })
  },

  handleSaveImage(e: WechatMiniprogram.TouchEvent) {
    if (!e.currentTarget.dataset.originalUrl) {
      return
    }

    if (!this.userData.saveImageConsent) {
      return wx.showModal({
        title: '恭喜你发现了隐藏功能！',
        content: '谁不喜欢附中的美景呢？长按图片即可将原图保存到相册！你要保存这张照片吗？',
        confirmText: '好的',
        cancelText: '不要',
        showCancel: true,
        success: ({ confirm }) => {
          if (confirm) {
            this.userData.saveImageConsent = true
            wx.setStorage({
              key: keyAlbumSaveImageConsent,
              data: true
            })
            this.handleSaveImage(e)
          }
        }
      })
    }

    applySaveImage(() => {
      const url = e.currentTarget.dataset.originalUrl
      wx.showLoading({
        title: '下载照片中',
        mask: true
      })
      wx.getImageInfo({
        src: url,
        success: ({ path }) => {
          wx.saveImageToPhotosAlbum({
            filePath: path,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              })
            },
            fail: (e) => {
              log.error(e)
              wx.showToast({
                title: '保存失败',
                icon: 'error',
                duration: 2000
              })
            }
          })
        },
        fail: (e) => {
          log.error(e)
          wx.showToast({
            title: '下载失败',
            icon: 'error',
            duration: 2000
          })
        }
      })
    })
  },

  handleShowPreview(e: WechatMiniprogram.TouchEvent) {
    const urls = this.data.album?.images.map((image) => {
      return image.path
    }) ?? []
    const current = urls.findIndex((url) => {
      return url === e.currentTarget.dataset.originalUrl
    })

    const start = Math.min(Math.max(0, current - 25), Math.max(0, urls.length - 50))
    const end = Math.min(urls.length, start + 50)

    if (urls.length) {
      wx.previewMedia({
        sources: urls.slice(start, end).map((url) => ({
          type: 'image',
          url
        })),
        current: current >= 0 ? current - start : 0,
        showmenu: true,
        referrerPolicy: 'origin',
        fail: console.error
      })
    }
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
