import compareVersion from '../../utils/compare-version'
import { keyBackground } from '../../utils/local-storage'
import log from '../../utils/log'
import { shareMsg, shareTimeline } from '../../utils/share'

const { saveFile, unlink } = wx.getFileSystemManager()

const ratio1 = 1 / 3
const ratio2 = 2 / 3

Page({
  userData: {
    pixelRatio: 1,

    canvas: null as WechatMiniprogram.Canvas | null,
    canvasScale: 1,
    canvasWidth: 0,
    canvasHeight: 0,
    canvasCropAreaOffsetX: 0,
    canvasCropAreaOffsetY: 0,
    canvasCropAreaSize: 0,

    imageSrc: '',
    imageResolved: null as WechatMiniprogram.Image | null,
    imageWidth: 0,
    imageHeight: 0,
    imageScale: 0,
    imageOffsetX: 0,
    imageOffsetY: 0,

    touching: false,
    touchId1: -1,
    touchStartX1: 0,
    touchStartY1: 0,
    touchId2: -1,
    touchStartX2: 0,
    touchStartY2: 0,
    touchStartScale: 0,
    touchStartOffsetX: 0,
    touchStartOffsetY: 0,

    transitionStartTime: 0,
    transitionStartScale: 0,
    transitionStartOffsetX: 0,
    transitionStartOffsetY: 0,
    transitionTargetScale: 0,
    transitionTargetOffsetX: 0,
    transitionTargetOffsetY: 0,

    frameUpToDate: false
  },

  onLoad(query) {
    if (!query || !query.src) {
      wx.navigateBack()
      return
    }
    this.userData.imageSrc = decodeURIComponent(query.src)
    log.debug('cropping image src: ', this.userData.imageSrc)
  },

  onReady() {
    if (compareVersion('2.20.1') === 1) {
      this.userData.pixelRatio = wx.getWindowInfo().pixelRatio
    } else {
      this.userData.pixelRatio = wx.getSystemInfoSync().pixelRatio
    }

    this.updateNode().then(() => {
      this.resolveImage().then(() => {
        this.drawFrame()
      }).catch(() => {
        wx.showToast({
          title: '加载图片失败',
          icon: 'error'
        })
      })
    }).catch(() => {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    })
  },

  onResize() {
    this.updateNode()
  },

  onUnload() {
    this.userData.canvas = null
    this.userData.imageResolved = null
  },

  drawFrame() {
    const canvas = this.userData.canvas
    if (!canvas) {
      return
    }

    if (this.userData.transitionStartTime) {
      this.transitionFrame()
    }

    if (!this.userData.frameUpToDate) {
      this.userData.frameUpToDate = false

      const ctx = canvas.getContext('2d')
      this.drawFrameBackground(ctx)
      this.drawFrameImage(ctx)
      this.drawFrameCroppingBackground(ctx)
      this.drawFrameBorder(ctx)
      // this.drawFrameBorderCorner(ctx)
      if (this.userData.touching) {
        this.drawFrameRatio(ctx)
      }

      this.userData.frameUpToDate = true
    }

    canvas.requestAnimationFrame(this.drawFrame)
  },

  drawFrameBackground(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.userData.canvasWidth, this.userData.canvasHeight)
  },

  drawFrameImage(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    if (this.userData.imageResolved) {
      ctx.drawImage(
        this.userData.imageResolved,
        this.userData.canvasCropAreaOffsetX + this.userData.imageOffsetX,
        this.userData.canvasCropAreaOffsetY + this.userData.imageOffsetY,
        this.userData.imageWidth * this.userData.imageScale,
        this.userData.imageHeight * this.userData.imageScale)
    } else {
      log.warn('image not resolved yet')
    }
  },

  drawFrameCroppingBackground(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, this.userData.canvasWidth, this.userData.canvasHeight)
    ctx.rect(
      this.userData.canvasCropAreaOffsetX,
      this.userData.canvasCropAreaOffsetY,
      this.userData.canvasCropAreaSize,
      this.userData.canvasCropAreaSize)
    ctx.closePath()
    ctx.clip('evenodd')
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, this.userData.canvasWidth, this.userData.canvasHeight)
    ctx.restore()
  },

  drawFrameBorder(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    const borderWidth = 1 * this.userData.canvasScale
    const borderOffset = borderWidth / 2
    ctx.lineWidth = this.userData.canvasScale
    ctx.strokeStyle = 'white'
    ctx.strokeRect(
      this.userData.canvasCropAreaOffsetX - borderOffset,
      this.userData.canvasCropAreaOffsetY - borderOffset,
      this.userData.canvasCropAreaSize + borderOffset,
      this.userData.canvasCropAreaSize + borderOffset)
  },

  drawFrameBorderCorner(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    const borderWidthBold = 3 * this.userData.canvasScale
    const borderOffsetBold = borderWidthBold / 2
    const borderLengthCorner = 16 * this.userData.canvasScale
    ctx.lineWidth = 3 * this.userData.canvasScale
    ctx.beginPath()
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold + borderLengthCorner,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold + borderLengthCorner)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold - borderLengthCorner,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold,
      this.userData.canvasCropAreaOffsetY - borderOffsetBold + borderLengthCorner)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold + borderLengthCorner,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX - borderOffsetBold,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold - borderLengthCorner)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold - borderLengthCorner,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize + borderOffsetBold,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize + borderOffsetBold - borderLengthCorner)
    ctx.stroke()
  },

  drawFrameRatio(ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D) {
    ctx.lineWidth = 1 * this.userData.canvasScale
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize * ratio1,
      this.userData.canvasCropAreaOffsetY)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize * ratio1,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize * ratio2,
      this.userData.canvasCropAreaOffsetY)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize * ratio2,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize * ratio1)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize * ratio1)
    ctx.moveTo(
      this.userData.canvasCropAreaOffsetX,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize * ratio2)
    ctx.lineTo(
      this.userData.canvasCropAreaOffsetX + this.userData.canvasCropAreaSize,
      this.userData.canvasCropAreaOffsetY + this.userData.canvasCropAreaSize * ratio2)
    ctx.stroke()
  },

  transitionStart() {
    // calculate whether to scale
    const imageShorter = Math.min(this.userData.imageWidth, this.userData.imageHeight)
    const minScale = this.userData.canvasCropAreaSize / imageShorter
    const maxScale = minScale * 10
    const targetScale = Math.min(maxScale, Math.max(minScale, this.userData.imageScale))

    // calculate whether to shift
    let scaleChange = 1
    if (targetScale !== this.userData.imageScale) {
      scaleChange = targetScale / this.userData.imageScale
    }
    let scaledX1 = this.userData.imageOffsetX
    let scaledY1 = this.userData.imageOffsetY
    if (scaleChange !== 1) {
      [scaledX1, scaledY1] = this.scaledOffsets(
        this.userData.imageOffsetX,
        this.userData.imageOffsetY,
        scaleChange)
    }
    const scaledX2 = scaledX1 + this.userData.imageWidth * targetScale
    const scaledY2 = scaledY1 + this.userData.imageHeight * targetScale
    if (scaledX1 > 0) {
      scaledX1 = 0
    } else if (scaledX2 < this.userData.canvasCropAreaSize) {
      scaledX1 = this.userData.canvasCropAreaSize - this.userData.imageWidth * targetScale
    }
    if (scaledY1 > 0) {
      scaledY1 = 0
    } else if (scaledY2 < this.userData.canvasCropAreaSize) {
      scaledY1 = this.userData.canvasCropAreaSize - this.userData.imageHeight * targetScale
    }

    this.userData.transitionStartTime = Date.now()
    this.userData.transitionStartScale = this.userData.imageScale
    this.userData.transitionStartOffsetX = this.userData.imageOffsetX
    this.userData.transitionStartOffsetY = this.userData.imageOffsetY
    this.userData.transitionTargetScale = targetScale
    this.userData.transitionTargetOffsetX = scaledX1
    this.userData.transitionTargetOffsetY = scaledY1
    log.debug('transition started')
  },

  transitionFrame() {
    const timeNow = Date.now()
    const timeElapsed = timeNow - this.userData.transitionStartTime
    const transitionTime = 300

    if (timeElapsed >= transitionTime) {
      this.userData.transitionStartTime = 0
      this.userData.imageScale = this.userData.transitionTargetScale
      this.userData.imageOffsetX = this.userData.transitionTargetOffsetX
      this.userData.imageOffsetY = this.userData.transitionTargetOffsetY
      this.userData.frameUpToDate = false
      return log.debug('transition ended')
    } else {
      // use ease-out function
      const progress = 1 - Math.pow(1 - timeElapsed / transitionTime, 3)
      this.userData.imageScale = this.userData.transitionStartScale +
        (this.userData.transitionTargetScale - this.userData.transitionStartScale) * progress
      this.userData.imageOffsetX = this.userData.transitionStartOffsetX +
        (this.userData.transitionTargetOffsetX - this.userData.transitionStartOffsetX) * progress
      this.userData.imageOffsetY = this.userData.transitionStartOffsetY +
        (this.userData.transitionTargetOffsetY - this.userData.transitionStartOffsetY) * progress
      this.userData.frameUpToDate = false
    }
  },

  scaledOffsets(offsetX: number, offsetY: number, scaleChange: number): [number, number] {
    const frameCenterX = this.userData.canvasWidth / 2
    const frameCenterY = this.userData.canvasHeight / 2
    const offsetRefX = this.userData.canvasCropAreaOffsetX
    const offsetRefY = this.userData.canvasCropAreaOffsetY
    const absOffsetX = offsetRefX + offsetX
    const absOffsetY = offsetRefY + offsetY
    const scaledAbsOffsetX = frameCenterX + (absOffsetX - frameCenterX) * scaleChange
    const scaledAbsOffsetY = frameCenterY + (absOffsetY - frameCenterY) * scaleChange
    return [scaledAbsOffsetX - offsetRefX, scaledAbsOffsetY - offsetRefY]
  },

  resolveImage(): Promise<WechatMiniprogram.Image> {
    return new Promise((resolve, reject) => {
      if (!this.userData.canvas) {
        return reject('canvas not found')
      }

      if (this.userData.imageResolved) {
        return resolve(this.userData.imageResolved)
      }

      const image = this.userData.canvas.createImage()
      image.onload = () => {
        log.debug('image original size: ', image.width, image.height)
        this.userData.imageResolved = image
        this.userData.imageWidth = image.width
        this.userData.imageHeight = image.height

        if (this.userData.canvasCropAreaSize) {
          const scale = this.userData.canvasCropAreaSize / Math.min(image.width, image.height)
          const offsetX = (this.userData.canvasCropAreaSize - image.width * scale) / 2
          const offsetY = (this.userData.canvasCropAreaSize - image.height * scale) / 2
          log.debug('image initial scale: ', scale)
          log.debug('image initial offset: ', offsetX, offsetY)

          this.userData.imageScale = scale
          this.userData.imageOffsetX = offsetX
          this.userData.imageOffsetY = offsetY
        }

        resolve(image)
      }
      image.onerror = reject
      image.src = this.userData.imageSrc
    })
  },

  updateNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .select('#cropper')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            return reject('canvas node not found')
          }

          const canvas = res[0].node as WechatMiniprogram.Canvas

          let canvasScale = this.userData.pixelRatio
          let width = res[0].width * canvasScale
          let height = res[0].height * canvasScale
          log.debug('canvas original size: ', width, height)

          // Canvas 2D 需要显式设置画布宽高，默认：300*150，最大：1365*1365
          // https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html
          const maxSize = 1365
          const longer = Math.max(width, height)
          if (longer > maxSize) {
            const scale = maxSize / longer
            canvasScale *= scale
            width = Math.floor(width * scale)
            height = Math.floor(height * scale)
          }
          log.debug('canvas resized size: ', width, height)
          log.debug('canvas scale: ', canvasScale)

          // create a square crop area in the center
          const shorter = Math.min(width, height)
          const cropAreaSize = Math.floor(0.9 * shorter)
          const cropAreaOffsetX = (width - cropAreaSize) / 2
          const cropAreaOffsetY = (height - cropAreaSize) / 2
          log.debug('crop area size: ', cropAreaSize)
          log.debug('crop area offset: ', cropAreaOffsetX, cropAreaOffsetY)

          this.userData.canvas = canvas
          this.userData.canvasScale = canvasScale
          this.userData.canvasWidth = canvas.width = width
          this.userData.canvasHeight = canvas.height = height
          this.userData.canvasCropAreaSize = cropAreaSize
          this.userData.canvasCropAreaOffsetX = cropAreaOffsetX
          this.userData.canvasCropAreaOffsetY = cropAreaOffsetY

          resolve()
        })
    })
  },

  handleTouchStart(e: WechatMiniprogram.TouchEvent) {
    if (!this.userData.touching) {
      this.userData.touching = true
      this.userData.touchId1 = -1
      this.userData.touchId2 = -1
      if (this.userData.transitionStartTime) {
        this.userData.transitionStartTime = 0
        log.debug('transition interrupted')
      }
      log.debug('touch started')
    }

    let changed = false
    for (const touch of e.changedTouches) {
      if (this.userData.touchId1 === -1) {
        this.userData.touchId1 = touch.identifier
        log.debug('touch 1 started, id: ', touch.identifier)
        changed = true
      } else if (this.userData.touchId2 === -1) {
        this.userData.touchId2 = touch.identifier
        log.debug('touch 2 started, id: ', touch.identifier)
        changed = true
      }
    }

    if (changed) {
      this.handleTouchChange(e)
    }
  },

  handleTouchMove(e: WechatMiniprogram.TouchEvent) {
    let x1 = this.userData.touchStartX1
    let y1 = this.userData.touchStartY1
    let x2 = this.userData.touchStartX2
    let y2 = this.userData.touchStartY2
    for (const touch of e.touches) {
      if (touch.identifier === this.userData.touchId1) {
        x1 = touch.clientX * this.userData.canvasScale
        y1 = touch.clientY * this.userData.canvasScale
      } else if (touch.identifier === this.userData.touchId2) {
        x2 = touch.clientX * this.userData.canvasScale
        y2 = touch.clientY * this.userData.canvasScale
      }
    }

    if (this.userData.touchId1 !== -1 && this.userData.touchId2 !== -1) {
      const originalDistance =
        Math.pow(this.userData.touchStartX1 - this.userData.touchStartX2, 2) +
        Math.pow(this.userData.touchStartY1 - this.userData.touchStartY2, 2)
      const currentDistance =
        Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
      const scaleChange = Math.sqrt(currentDistance / originalDistance)
      log.debug('scale change: ', scaleChange)

      const originalCenterX = (this.userData.touchStartX1 + this.userData.touchStartX2) / 2
      const originalCenterY = (this.userData.touchStartY1 + this.userData.touchStartY2) / 2
      const currentCenterX = (x1 + x2) / 2
      const currentCenterY = (y1 + y2) / 2
      const centerShiftX = currentCenterX - originalCenterX
      const centerShiftY = currentCenterY - originalCenterY
      log.debug('center shift: ', centerShiftX, centerShiftY)

      const [imageOffsetX, imageOffsetY] = this.scaledOffsets(
        this.userData.touchStartOffsetX + centerShiftX,
        this.userData.touchStartOffsetY + centerShiftY,
        scaleChange)

      this.userData.imageScale = this.userData.touchStartScale * scaleChange
      this.userData.imageOffsetX = imageOffsetX
      this.userData.imageOffsetY = imageOffsetY
      this.userData.frameUpToDate = false

    } else if (this.userData.touchId1 !== -1) {
      const offsetX = x1 - this.userData.touchStartX1
      const offsetY = y1 - this.userData.touchStartY1
      log.debug('offset change: ', offsetX, offsetY)

      this.userData.imageOffsetX = this.userData.touchStartOffsetX + offsetX
      this.userData.imageOffsetY = this.userData.touchStartOffsetY + offsetY
      this.userData.frameUpToDate = false

    } else if (this.userData.touchId2 !== -1) {
      const offsetX = x2 - this.userData.touchStartX2
      const offsetY = y2 - this.userData.touchStartY2
      log.debug('offset change: ', offsetX, offsetY)

      this.userData.imageOffsetX = this.userData.touchStartOffsetX + offsetX
      this.userData.imageOffsetY = this.userData.touchStartOffsetY + offsetY
      this.userData.frameUpToDate = false
    }
  },

  handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
    let changed = false
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.userData.touchId1) {
        this.userData.touchId1 = -1
        log.debug('touch 1 ended')
        changed = true
      } else if (touch.identifier === this.userData.touchId2) {
        this.userData.touchId2 = -1
        log.debug('touch 2 ended')
        changed = true
      }
    }

    if (this.userData.touchId1 === -1 && this.userData.touchId2 === -1) {
      this.userData.touching = false
      log.debug('touch ended')
      this.transitionStart()
    } else if (changed) {
      this.handleTouchChange(e)
    }
  },

  handleTouchChange(e: WechatMiniprogram.TouchEvent) {
    for (const touch of e.touches) {
      if (touch.identifier === this.userData.touchId1) {
        this.userData.touchStartX1 = touch.clientX * this.userData.canvasScale
        this.userData.touchStartY1 = touch.clientY * this.userData.canvasScale
      } else if (touch.identifier === this.userData.touchId2) {
        this.userData.touchStartX2 = touch.clientX * this.userData.canvasScale
        this.userData.touchStartY2 = touch.clientY * this.userData.canvasScale
      }
    }

    this.userData.touchStartScale = this.userData.imageScale
    this.userData.touchStartOffsetX = this.userData.imageOffsetX
    this.userData.touchStartOffsetY = this.userData.imageOffsetY
  },

  handleTouchCancel(_: WechatMiniprogram.TouchEvent) {
    log.debug('touch canceled')
    this.userData.touching = false
    this.userData.touchId1 = -1
    this.userData.touchId2 = -1
    this.transitionStart()
  },

  handleFinish() {
    if (!this.userData.canvas || !this.userData.imageResolved) {
      return
    }

    wx.showLoading({
      title: '处理图片中',
      mask: true
    })

    if (this.userData.transitionStartTime) {
      this.userData.imageScale = this.userData.transitionTargetScale
      this.userData.imageOffsetX = this.userData.transitionTargetOffsetX
      this.userData.imageOffsetY = this.userData.transitionTargetOffsetY
      this.userData.transitionStartTime = 0
    }

    const x = -this.userData.imageOffsetX / this.userData.imageScale
    const y = -this.userData.imageOffsetY / this.userData.imageScale
    const width = this.userData.canvasCropAreaSize / this.userData.imageScale
    const height = this.userData.canvasCropAreaSize / this.userData.imageScale
    log.debug('cropped image: ', x, y, width, height)

    const offscreenCanvas = wx.createOffscreenCanvas({
      type: '2d',
      width: 1024,
      height: 1024
    })
    const ctx = offscreenCanvas.getContext('2d') as WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D
    ctx.clearRect(0, 0, 1024, 1024)
    ctx.drawImage(
      this.userData.imageResolved,
      x, y, width, height,
      0, 0, 1024, 1024)
    wx.canvasToTempFilePath({
      canvas: offscreenCanvas,
      success: ({ tempFilePath }) => {
        // delete old image
        wx.getStorage({
          key: keyBackground,
          success: ({ data }) => {
            if (data.startsWith('fs:')) {
              unlink({
                filePath: `${wx.env.USER_DATA_PATH}/${data.substring(3)}`
              })
            }
          }
        })

        // save new image
        const filename = `background${Date.now()}.png`
        saveFile({
          tempFilePath,
          filePath: `${wx.env.USER_DATA_PATH}/${filename}`,
          success: () => {
            wx.setStorage({
              key: keyBackground,
              data: `fs:${filename}`,
              success: () => {
                wx.hideLoading()
                wx.redirectTo({
                  url: '/pages/export/export'
                })
              },
              fail: () => {
                wx.hideLoading()
                wx.showToast({
                  title: '保存图片失败',
                  icon: 'error',
                  duration: 2000
                })
              }
            })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({
              title: '保存图片失败',
              icon: 'error',
              duration: 2000
            })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '导出图片失败',
          icon: 'error'
        })
      }
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
