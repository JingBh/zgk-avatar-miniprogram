import compareVersion from '../../utils/compare-version'
import { getPreset, type IPresetDisplay } from '../../utils/images'
import log from '../../utils/log'
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {
    album: null as IPresetDisplay | null,
    nativeMasonry: true
  },

  onLoad(query) {
    this.setData({
      nativeMasonry: compareVersion('2.30.4') !== -1
    })

    if (!query || !query.name) {
      wx.navigateBack()
      return
    }

    getPreset('background', decodeURIComponent(query.name))
      .then((value) => {
        this.setData({
          album: value
        })
        wx.setNavigationBarTitle({
          title: value.name
        })
      })
      .catch(() => {
        wx.showToast({
          title: '加载相册失败',
          icon: 'error'
        })
        wx.navigateBack()
      })
  },

  onReady() {
    this.setNavigationBarState()
  },

  setNavigationBarState() {
    if (this.data.album?.name) {
      wx.setNavigationBarTitle({
        title: this.data.album.name
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

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
