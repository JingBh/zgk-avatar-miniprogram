const { existsSync } = require('fs')

const { Font, load: loadFont } = require('opentype.js')

const { oss } = require('./cloud.js')

/**
 * @type {Font | null}
 */
let font = null

/**
 * @return {Promise<Font>}
 */
async function getFont() {
  if (!font) {
    const fontPath = '/tmp/font.ttf'
    if (!existsSync(fontPath)) {
      console.log('Font not found, downloading...')
      await oss.get('fonts/默陌狂傲手迹.ttf', fontPath)
    }

    font = await loadFont(fontPath)
  }

  return font
}

module.exports = {
  getFont
}
