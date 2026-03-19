import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'

export interface TranscribeConfig {
  serverUrl: string
  apiKey: string
  userId: string
  userSecret: string
}

const STORAGE_KEY = 'transcribe_config'

export async function loadConfig(bridge: EvenAppBridge): Promise<TranscribeConfig | null> {
  const raw = await bridge.getLocalStorage(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TranscribeConfig
  } catch {
    return null
  }
}

export async function saveConfig(bridge: EvenAppBridge, config: TranscribeConfig): Promise<void> {
  await bridge.setLocalStorage(STORAGE_KEY, JSON.stringify(config))
}

export function buildWebSocketUrl(config: TranscribeConfig): string {
  const base = config.serverUrl.replace(/\/$/, '')
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    userId: config.userId,
    userSecret: config.userSecret,
    engine: 'soniox',
    locale: 'ja',
  })
  return `${base}/thirdparty/api/v1/realtime-transcribe?${params.toString()}`
}
