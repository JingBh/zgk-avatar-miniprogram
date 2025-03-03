import compareVersion from '../../utils/compare-version'
import { getPreset, type IPresetDisplay } from '../../utils/images'

Page({
  data: {
    album: null as IPresetDisplay | null,
    loading: false,
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

    this.setLoading(true)
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
      .finally(() => {
        this.setLoading(false)
      })
  },

  onReady() {
    this.setNavigationBarState()
  },

  setLoading(isLoading: boolean) {
    this.setData({
      loading: isLoading
    })
    this.setNavigationBarState()
  },

  setNavigationBarState() {
    if (this.data.loading) {
      wx.showNavigationBarLoading()
    } else {
      wx.hideNavigationBarLoading()
    }

    if (this.data.album?.name) {
      wx.setNavigationBarTitle({
        title: this.data.album.name
      })
    }
  }
})
