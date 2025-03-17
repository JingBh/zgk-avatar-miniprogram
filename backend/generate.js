const { createHash } = require('crypto')
const { existsSync } = require('fs')
const { readFile, writeFile } = require('fs/promises')

const { createCanvas, loadImage } = require('@napi-rs/canvas')

const { errorToResponse } = require('./errors.js')
const { getFont } = require('./font.js')
const { audit, log } = require('./cloud.js')

class Canvas {
  /**
   * @param {number?} size
   * Size of the canvas in pixels,
   * default value is 1024
   */
  constructor(size) {
    this.size = Number(size) || 1024
    this.canvas = createCanvas(this.size, this.size)
    this.ctx = this.canvas.getContext('2d')
  }

  clearContent() {
    this.ctx.filter = 'none'
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.clearRect(0, 0, this.size, this.size)
  }

  /**
   * The first step,
   * must be called before `drawTextInner` and `drawTextOuter`
   *
   * @param {string?} filter
   */
  async prepare(filter) {
    const mojiImg = await loadImage('./assets/moji.png')

    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.filter = filter || 'none'
    this.ctx.drawImage(mojiImg, 0, 0, this.size, this.size)
  }

  drawGlyph(glyph, start, baseline, size) {
    const path = glyph.getPath(start, baseline, size)
    path.fill = '#fff'
    path.draw(this.ctx)
  }

  /**
   * Draw outer text
   *
   * @param {string} text 3-4 Chinese characters
   * @return {Promise<void>}
   */
  async drawTextOuter(text) {
    if (text.length < 3 || text.length > 4) {
      throw new IllegalArgumentError(
        IllegalArgumentError.errors.TEXT_3_TO_4
      )
    }

    const font = await getFont()
    const fontSize = 331

    const glyphs = []
    for (const char of text) {
      const glyph = font.charToGlyph(char)
      if (glyph == null) {
        throw new CharacterNotFoundError(char)
      }
      glyphs.push(glyph)
    }

    const line1Baseline = this.size * 0.375
    const line2Baseline = this.size * 0.765
    const char1Start = this.size * 0.185
    const char2Start = this.size * 0.525

    if (glyphs.length === 3) {
      const line1charMStart = this.size * 0.355
      this.drawGlyph(glyphs[0], line1charMStart, line1Baseline, fontSize)
      this.drawGlyph(glyphs[1], char1Start, line2Baseline, fontSize)
      this.drawGlyph(glyphs[2], char2Start, line2Baseline, fontSize)
    } else {
      this.drawGlyph(glyphs[0], char1Start, line1Baseline, fontSize)
      this.drawGlyph(glyphs[1], char2Start, line1Baseline, fontSize)
      this.drawGlyph(glyphs[2], char1Start, line2Baseline, fontSize)
      this.drawGlyph(glyphs[3], char2Start, line2Baseline, fontSize)
    }
  }

  /**
   * Draw inner text
   *
   * @param {string} text 4-8 Chinese characters
   * @return {Promise<void>}
   */
  async drawTextInner(text) {
    if (text.length < 4 || text.length > 8) {
      throw new IllegalArgumentError(
        IllegalArgumentError.errors.TEXT_4_TO_8
      )
    }

    const font = await getFont()
    const fontSize = 72

    const baseline = this.size * 0.505
    const charFirstStart = this.size * 0.222
    const charLastStart = this.size * 0.735

    for (let i = 0, l = text.length; i < l; i++) {
      const char = text[i]
      const glyph = font.charToGlyph(char)
      if (glyph == null) {
        throw new CharacterNotFoundError(char)
      }

      const start = (charLastStart - charFirstStart) / (l - 1) * i + charFirstStart
      this.drawGlyph(glyph, start, baseline, fontSize)
    }
  }

  async encode() {
    const data = await this.canvas.encode('png')
    return data.toString('base64')
  }
}

const handleGenerate = async (openid, body) => {
  if (!body.innerText) {
    return errorToResponse(new Error('解析请求失败'), 400)
  }

  const outerText = '清华附中' // does not allow changing for now
  const innerText = body.innerText.trim()

  let data = {
    outerText,
    innerText,
    shadow: null,
    noShadow: null
  }

  const cacheKey = `${outerText}-${innerText}`
  const cachePath = `/tmp/${createHash('md5').update(cacheKey).digest('hex')}.json`

  if (existsSync(cachePath)) {
    data = JSON.parse(await readFile(cachePath, {
      encoding: 'utf-8'
    }))
  } else {
    await log.writeLog({
      openid,
      outerText: body.outerText,
      innerText: body.innerText
    }, 'generate')

    try {
      if (!await audit.scanText(innerText)) {
        return errorToResponse(new Error('包含敏感词'), 451)
      }
    } catch (e) {
      if (e?.code === 'Throttling') {
        return errorToResponse(new Error('请求过于频繁'), 429)
      }

      throw e
    }

    const canvas = new Canvas()
    for (const useShadow of [false, true]) {
      canvas.clearContent()

      await canvas.prepare(useShadow ? 'drop-shadow(0px 0px 10px #222)' : 'none')
      await canvas.drawTextOuter(outerText)
      await canvas.drawTextInner(innerText)

      data[useShadow ? 'shadow' : 'noShadow'] = await canvas.encode()
    }

    await writeFile(cachePath, JSON.stringify(data), {
      encoding: 'utf-8'
    })
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      success: true,
      data
    },
    isBase64Encoded: false
  }
}

module.exports = {
  handleGenerate
}
