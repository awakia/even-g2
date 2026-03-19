// Settings page logic (runs in iPhone WebView only)
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import { loadConfig, saveConfig, type TranscribeConfig } from './config'

async function initSettings() {
  let bridge: Awaited<ReturnType<typeof waitForEvenAppBridge>> | null = null
  try {
    bridge = await waitForEvenAppBridge()
  } catch {
    // Not in Even App WebView - settings page still works for display
  }

  const serverUrlInput = document.getElementById('serverUrl') as HTMLInputElement
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement
  const userIdInput = document.getElementById('userId') as HTMLInputElement
  const userSecretInput = document.getElementById('userSecret') as HTMLInputElement
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement
  const statusEl = document.getElementById('status') as HTMLDivElement

  if (!serverUrlInput || !saveBtn) return

  // Load existing config
  if (bridge) {
    const config = await loadConfig(bridge)
    if (config) {
      serverUrlInput.value = config.serverUrl
      apiKeyInput.value = config.apiKey
      userIdInput.value = config.userId
      userSecretInput.value = config.userSecret
    }
  }

  // Default server URL
  if (!serverUrlInput.value) {
    serverUrlInput.value = 'wss://rimo-backend.rimo.app'
  }

  saveBtn.addEventListener('click', async () => {
    const config: TranscribeConfig = {
      serverUrl: serverUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      userId: userIdInput.value.trim(),
      userSecret: userSecretInput.value.trim(),
    }

    if (!config.apiKey || !config.userId || !config.userSecret) {
      statusEl.textContent = 'All fields are required.'
      return
    }

    if (bridge) {
      await saveConfig(bridge, config)
      statusEl.textContent = 'Saved. Open on G2 glasses to use.'
    } else {
      statusEl.textContent = 'Not connected to Even App. Settings not saved.'
    }
  })
}

initSettings()
