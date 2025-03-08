import { buildUrl } from './cloud-storage'
import log from './log'

interface ICountdown {
  title: string
  target: number | string
  textBefore: string
  textOn?: string | null
  textAfter?: string | null
}

interface ICountdownProcessed extends ICountdown {
  label: string
}

type CountdownManifestRaw = ICountdown[]

export type CountdownManifest = ICountdownProcessed[]

let manifestCache: CountdownManifest | null = null

const day = 1000 * 60 * 60 * 24

const formatString = (format: string, replacements: Record<string, any>): string => {
  for (const key in replacements) {
    format = format.replace(new RegExp(`\{${key}\}`, 'g'), replacements[key])
  }

  return format
}

export function getCountdowns(): Promise<CountdownManifest> {
  return new Promise<CountdownManifest>((resolve, reject) => {
    if (manifestCache != null) {
      resolve(manifestCache)
    } else {
      wx.request<CountdownManifestRaw>({
        url: buildUrl('countdown', 'manifest.json', 'timestamp'),
        responseType: 'text',
        dataType: 'json',
        enableCache: false,
        success: ({ statusCode, data }) => {
          if (statusCode >= 400) {
            log.error(`status code ${statusCode}`)
            reject(data)
          } else {
            const manifest: CountdownManifest = []

            for (const countdown of data) {
              const processed = countdown as ICountdownProcessed

              const now = new Date().getTime()
              const target = new Date(countdown.target).getTime()

              if (isNaN(target)) {
                continue
              }

              const days = Math.ceil((target - now) / day)
              if (days < 0) {
                if (!countdown.textAfter) {
                  continue
                }

                processed.label = formatString(countdown.textAfter, {
                  days: Math.abs(days)
                })
              } else if (days === 0) {
                if (!countdown.textOn) {
                  continue
                }

                processed.label = countdown.textOn
              } else {
                processed.label = formatString(countdown.textBefore, {
                  days
                })
              }

              manifest.push(processed)
            }

            manifestCache = manifest
            resolve(manifest)
          }
        },
        fail: (error) => reject(error)
      })
    }
  })
}
