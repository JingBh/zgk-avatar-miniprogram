// pages/index/index.ts
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'

import { AnnouncementManifest, getAnnouncements } from '../../utils/announcements'
import { buildUrl } from '../../utils/cloud-storage'
import { CountdownManifest, getCountdowns } from '../../utils/countdown'
import { shareMsg, shareTimeline } from '../../utils/share'

let countdownInterval: number | null = null

export default Page({
  data: {
    countdownIndex: 0,
    developerPopupShow: false,
    developerPopupShown: false,
    feedbackPopupShow: false,
    countdowns: [] as CountdownManifest,
    announcements: {} as AnnouncementManifest,
    noAnnouncements: true,
    adClosed: false
  },

  onLoad() {
    this.loadCountdowns()
    this.loadAnnouncements()
  },

  onUnload() {
    if (countdownInterval != null) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  },

  beforeShowDeveloperPopup() {
    this.setData({
      developerPopupShown: true
    })
  },

  showDeveloperPopup() {
    this.setData({
      developerPopupShow: true
    })
  },

  hideDeveloperPopup() {
    this.setData({
      developerPopupShow: false
    })
  },

  afterHideDeveloperPopup() {
    this.setData({
      developerPopupShown: false
    })
  },

  showFeedbackPopup() {
    this.setData({
      feedbackPopupShow: true
    })
  },

  hideFeedbackPopup() {
    this.setData({
      feedbackPopupShow: false
    })
  },

  loadCountdowns() {
    getCountdowns().then((countdowns) => {
      this.setData({
        countdowns,
        noAnnouncements: this.data.noAnnouncements && !countdowns.length
      })

      if (this.data.countdowns.length) {
        countdownInterval = setInterval(() => {
          this.setData({
            countdownIndex: (this.data.countdownIndex + 1) % this.data.countdowns.length,
          })
        }, 5000)
      }
    }).catch((error) => {
      console.error(error)
      Notify({ type: 'danger', message: '倒计时加载失败' })
    })
  },

  loadAnnouncements() {
    getAnnouncements().then((announcements) => {
      this.setData({
        announcements,
        noAnnouncements: this.data.noAnnouncements && !Object.keys(announcements).length
      })
    }).catch((error) => {
      console.error(error)
      Notify({ type: 'danger', message: '公告栏加载失败' })
    })
  },

  onClickAnnouncement(e: WechatMiniprogram.BaseEvent) {
    wx.reportEvent('view_announcement', {
      'announcement_id': e.target.id
    })

    const content = this.data.announcements[e.target.id].content
    switch (content.type) {
      case 'page':
        wx.navigateTo({
          url: '/pages/announcements/announcement?data=' + encodeURIComponent(JSON.stringify(content))
        })
        break

      case 'navigatePage':
        wx.navigateTo({
          url: content.url
        })
        break

      case 'navigateMiniProgram':
        wx.navigateToMiniProgram(Object.assign(content.config, {}))
        break
    }
  },

  onClickSelectImage() {
    wx.navigateTo({
      url: '/pages/select_image/background'
    })
  },

  onAdClose() {
    this.setData({ adClosed: true })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline(),

  onShowQrPersonal: () => wx.previewImage({
    urls: [buildUrl('assets', 'qr-personal.jpg')],
    showmenu: true
  }),

  onShowQrOfficial: () => wx.previewImage({
    urls: [buildUrl('assets', 'qr-official.jpg')],
    showmenu: true
  })
})
