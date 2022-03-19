const baseUrl = "https://zgk-avatar.oss-cn-beijing.aliyuncs.com/"

export const buildUrl = (...parts: string[]) => {
  let addTimestamp = false
  if (parts[parts.length - 1] === "timestamp") {
    parts.pop()
    addTimestamp = true
  }

  parts.unshift(baseUrl)
  let url = parts.map((part) => {
    while (part.substring(0, 1) === '/') {
      part = part.substring(1)
    }
    while (part.substring(part.length - 1) === '/') {
      part = part.substring(0, part.length - 1)
    }
    return part
  }).filter((part) => {
    return part.length > 0
  }).join('/')

  if (addTimestamp) {
    url += `?timestamp=${Date.now()}`
  }

  return url
}
