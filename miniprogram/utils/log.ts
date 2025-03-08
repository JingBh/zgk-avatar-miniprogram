const logManager = wx.getRealtimeLogManager()

export const debug = (...args: any[]) => {
  console.debug(...args)
}

export const log = (...args: any[]) => {
  console.log(...args)
  logManager.info(...args)
}

export const info = (...args: any[]) => {
  console.info(...args)
  logManager.info(...args)
}

export const warn = (...args: any[]) => {
  console.warn(...args)
  logManager.warn(...args)
}

export const error = (...args: any[]) => {
  console.error(...args)
  logManager.error(...args)
}

export default {
  debug,
  log,
  info,
  warn,
  error
}
