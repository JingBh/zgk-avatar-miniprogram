import compareVersion from '../../utils/compare-version'
import log from '../../utils/log'

const homeRoute = 'pages/index/index'

let recalculateTimeout: number | null = null

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true
  },
  properties: {
    title: {
      type: String,
      value: ''
    }
  },
  data: {
    hasPrevious: false,
    isHome: false,
    height: 44,
    paddingTop: 6
  },
  lifetimes: {
    attached() {
      this.readRouting()
      this.calculateDimensions()
    },
    detached() {
      if (recalculateTimeout) {
        clearTimeout(recalculateTimeout)
        recalculateTimeout = null
      }
    }
  },
  pageLifetimes: {
    resize() {
      this.calculateDimensions()
    }
  },
  methods: {
    readRouting() {
      const pages = getCurrentPages()
      if (pages?.length) {
        this.setData({
          hasPrevious: pages.length > 1,
          isHome: pages[pages.length - 1].route === homeRoute
        })
      }
    },
    calculateDimensions() {
      if (recalculateTimeout) {
        clearTimeout(recalculateTimeout)
      }
      recalculateTimeout = setTimeout(() => {
        let status = 0
        let menuHeight = 32
        let menuMargin = 8

        try {
          if (compareVersion('2.20.1') < 0) {
            status = wx.getSystemInfoSync().statusBarHeight
          } else {
            status = wx.getWindowInfo().statusBarHeight
          }
          log.debug('status bar height: ', status)
        } catch (error) {
          log.error(error)
        }

        try {
          const menu = wx.getMenuButtonBoundingClientRect()
          log.debug('menu height: ', menu.height)
          log.debug('menu top: ', menu.top)
          menuHeight = Math.max(menu.height, menuHeight)
          menuMargin = Math.max(menu.top - status, menuMargin)
        } catch (error) {
          log.error(error)
        }

        this.setData({
          height: status + menuHeight + menuMargin * 2,
          paddingTop: status
        })
        recalculateTimeout = null
      }, 100)
    },
    handleBack() {
      wx.navigateBack()
    },
    handleHome() {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
})
