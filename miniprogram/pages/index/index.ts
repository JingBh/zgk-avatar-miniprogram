// pages/index/index.ts
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'

import { getDaysToGaokao, getDaysToZhongkao } from '../../utils/countdown'
import { shareMsg, shareTimeline } from '../../utils/share'
import { getManifest, AnnouncementManifest } from '../../utils/announcements'

let countdownInterval: number | null = null

export default Page({
  data: {
    countdownGaokao: getDaysToGaokao(),
    countdownZhongkao: getDaysToZhongkao(),
    countdownType: 1, // 1 for gaokao, 2 for zhongkao
    developerPopupShow: false,
    developerPopupShown: false,
    feedbackPopupShow: false,
    announcements: {} as AnnouncementManifest
  },

  onLoad() {
    countdownInterval = setInterval(() => {
      this.setData({
        countdownType: this.data.countdownType === 1 ? 2 : 1
      })
    }, 5000)

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

  loadAnnouncements() {
    getManifest().then(announcements => {
      this.setData({
        announcements
      })
    }).catch((error) => {
      console.error(error)
      Notify({ type: 'danger', message: '公告栏加载失败' })
    })
  },

  onClickAnnouncement(e: WechatMiniprogram.BaseEvent) {
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

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
