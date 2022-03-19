// pages/announcements/announcement.ts
import { buildUrl } from '../../utils/cloud-storage'

export default Page({
  data: {
    title: '',
    author: '',
    htmlSnip: '',
    loading: false
  },

  onLoad(query) {
    try {
      this.setLoading()

      const rawData = query.data || 'null'
      const data = JSON.parse(decodeURIComponent(rawData))

      this.setData({
        title: data.title || '',
        author: data.author || ''
      })

      if (data.path) {
        wx.request({
          url: buildUrl('announcements', data.path),
          responseType: 'text',
          dataType: '其他',
          enableCache: true,
          success: ({ statusCode, data }) => {
            if (statusCode >= 400) {
              console.error(`status code ${statusCode}`)
              this.onLoadFail()
            } else {
              this.setData({
                htmlSnip: data as string
              })
            }
          },
          fail: (error) => {
            console.error(error)
            this.onLoadFail()
          },
          complete: () => {
            this.unsetLoading()
          }
        })
      }
    } catch (e) {
      console.error(e)
      return this.onLoadFail()
    }
  },

  onReady() {
    if (this.data.loading) {
      wx.showNavigationBarLoading()
    }

    wx.setNavigationBarTitle({
      title: this.data.title
    })
  },

  setLoading() {
    this.setData({
      loading: true
    })
    wx.showNavigationBarLoading()
  },

  unsetLoading() {
    this.setData({
      loading: false
    })
    wx.hideNavigationBarLoading()
  },

  onLoadFail() {
    this.unsetLoading()
    wx.navigateBack()
  }
})
