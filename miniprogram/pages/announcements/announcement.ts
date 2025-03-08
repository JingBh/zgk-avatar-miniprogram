// pages/announcements/announcement.ts
import type { AnnouncementContent } from '../../utils/announcements'
import { buildUrl } from '../../utils/cloud-storage'
import log from '../../utils/log'

Page({
  data: {
    title: '',
    author: '',
    htmlSnip: '',
    url: ''
  },

  userData: {
    loading: false
  },

  onLoad(query) {
    try {
      this.setLoading(true)

      const rawData = query.data || 'null'
      const data = JSON.parse(decodeURIComponent(rawData)) as AnnouncementContent | null

      if (data) {
        if (data.type === 'page' && data.path) {
          wx.request({
            url: buildUrl('announcements', data.path),
            responseType: 'text',
            dataType: '其他',
            enableCache: true,
            success: ({ statusCode, data }) => {
              if (statusCode >= 400) {
                log.error(`status code ${statusCode}`)
                this.onLoadFail()
              } else {
                this.setData({
                  htmlSnip: data as string
                })
              }
            },
            fail: (error) => {
              log.error(error)
              this.onLoadFail()
            },
            complete: () => {
              this.setLoading(false)
            }
          })
        } else if (data.type === 'webview' && data.url) {
          this.setData({
            url: data.url
          })
        }
      }

    } catch (e) {
      log.error(e)
      return this.onLoadFail()
    }
  },

  onReady() {
    this.setNavigationBarState()
  },

  setLoading(isLoading: boolean) {
    this.userData.loading = isLoading
    this.setNavigationBarState()
  },

  setNavigationBarState() {
    if (this.userData.loading) {
      wx.showNavigationBarLoading()
    } else {
      wx.hideNavigationBarLoading()
    }

    if (this.data.title) {
      wx.setNavigationBarTitle({
        title: this.data.title
      })
    }
  },

  handleWebviewLoad() {
    this.setLoading(false)
  },

  handleLoadFail() {
    this.setLoading(false)
    wx.navigateBack()
  }
})
