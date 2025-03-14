// pages/index/index.ts
import { type AnnouncementManifest, getAnnouncements } from '../../utils/announcements'
import { buildUrl } from '../../utils/cloud-storage'
import { type CountdownManifest, getCountdowns } from '../../utils/countdown'
import log from '../../utils/log'
import { shareMsg, shareTimeline } from '../../utils/share'

let countdownTimeout: number | null = null

Page({
  data: {
    countdownIndex: 0,
    developerPopupShow: false,
    feedbackPopupShow: false,
    countdowns: [] as CountdownManifest,
    announcements: {} as AnnouncementManifest,
    noAnnouncements: true,
    version: ''
  },

  onLoad() {
    this.loadVersion()
    this.loadCountdowns()
    this.loadAnnouncements()
  },

  onUnload() {
    if (countdownTimeout != null) {
      clearInterval(countdownTimeout)
      countdownTimeout = null
    }
  },

  loadVersion() {
    const info = wx.getAccountInfoSync()
    this.setData({
      version: info.miniProgram.version || info.miniProgram.envVersion
    })
  },

  loadCountdowns() {
    getCountdowns().then((countdowns) => {
      this.setData({
        countdowns,
        noAnnouncements: this.data.noAnnouncements && !countdowns.length
      })

      if (this.data.countdowns.length) {
        countdownTimeout = setTimeout(() => {
          this.handleSwitchCountdown()
        }, 5000)
      }
    }).catch((error) => {
      log.error(error)
      // TODO: replace with custom notify
      wx.showToast({
        icon: 'error',
        title: '倒计时加载失败',
        duration: 2000
      })
    })
  },

  loadAnnouncements() {
    getAnnouncements().then((announcements) => {
      this.setData({
        announcements,
        noAnnouncements: this.data.noAnnouncements && !Object.keys(announcements).length
      })
    }).catch((error) => {
      log.error(error)
      // TODO: replace with custom notify
      wx.showToast({
        icon: 'error',
        title: '公告栏加载失败',
        duration: 2000
      })
    })
  },

  handleClickSelectImage() {
    wx.navigateTo({
      url: '/pages/select_image/select_image'
    })
  },

  handleSwitchCountdown() {
    this.setData({
      countdownIndex: (this.data.countdownIndex + 1) % this.data.countdowns.length,
    })

    if (countdownTimeout !== null) {
      clearTimeout(countdownTimeout)
    }
    countdownTimeout = setTimeout(() => {
      this.handleSwitchCountdown()
    }, 5000)
  },

  handleClickAnnouncement(e: WechatMiniprogram.BaseEvent) {
    wx.reportEvent('view_announcement', {
      'announcement_id': e.target.id
    })

    const content = this.data.announcements[e.target.id].content
    switch (content.type) {
      case 'navigatePage':
        wx.navigateTo({
          url: content.url
        })
        break

      case 'navigateMiniProgram':
        wx.navigateToMiniProgram(Object.assign(content.config, {}))
        break

      default:
        wx.navigateTo({
          url: '/pages/announcements/announcement?data=' + encodeURIComponent(JSON.stringify(content))
        })
    }
  },

  handleShowDeveloperPopup() {
    this.setData({
      developerPopupShow: true
    })
  },

  handleShowFeedbackPopup() {
    this.setData({
      feedbackPopupShow: true
    })
  },

  handleHidePopup() {
    this.setData({
      developerPopupShow: false,
      feedbackPopupShow: false
    })
  },

  handleShowQrPersonal() {
    wx.previewImage({
      urls: [buildUrl('assets', 'qr-personal.jpg')],
      showmenu: true
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
