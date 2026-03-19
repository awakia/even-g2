import {
  waitForEvenAppBridge,
  CreateStartUpPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  OsEventTypeList,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import { loadConfig, buildWebSocketUrl } from './config'

// --- State ---
let bridge: EvenAppBridge
let ws: WebSocket | null = null
let recording = false
let audioBuffer: number[] = []
let flushInterval: ReturnType<typeof setInterval> | null = null

// Transcript state
let finalTranscripts: string[] = []
let interimText = ''
const MAX_DISPLAY_CHARS = 400

// --- Display ---

function buildDisplay(): string {
  const status = recording ? '● REC' : '○ STOP'
  const allFinal = finalTranscripts.join('')
  // Show last N chars to fit on screen
  const displayText = allFinal.length > MAX_DISPLAY_CHARS
    ? '...' + allFinal.slice(-MAX_DISPLAY_CHARS + 3)
    : allFinal
  const interim = interimText ? `\n_${interimText}_` : ''
  return `${status}\n\n${displayText}${interim}`
}

async function updateDisplay() {
  const content = buildDisplay()
  await bridge.textContainerUpgrade(
    new TextContainerUpgrade({
      containerID: 1,
      containerName: 'transcript',
      contentOffset: 0,
      contentLength: 2000,
      content,
    })
  )
}

// --- WebSocket ---

function handleTranscriptionMessage(data: string) {
  try {
    const results = JSON.parse(data)
    if (!Array.isArray(results)) return

    for (const result of results) {
      const content = result.transcript?.content
      if (!content) continue

      if (result.is_final) {
        finalTranscripts.push(content)
        interimText = ''
      } else {
        interimText = content
      }
    }
    updateDisplay()
  } catch {
    // Not a transcription message (could be SYN-ACK or control message)
  }
}

async function startRecording() {
  const config = await loadConfig(bridge)
  if (!config || !config.apiKey) {
    finalTranscripts = ['Settings not configured.\nOpen settings page on iPhone.']
    updateDisplay()
    return
  }

  recording = true
  finalTranscripts = []
  interimText = ''
  updateDisplay()

  // Open WebSocket to rimo-backend
  const url = buildWebSocketUrl(config)
  ws = new WebSocket(url)

  ws.onopen = () => {
    // Send header message
    ws!.send(JSON.stringify({
      sampleRate: 16000,
      keepFiller: false,
    }))
  }

  ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
      // Binary SYN-ACK from rimo-rec, start audio capture
      bridge.audioControl(true)
      startAudioFlush()
    } else {
      handleTranscriptionMessage(event.data as string)
    }
  }

  ws.onclose = () => {
    stopRecordingCleanup()
    updateDisplay()
  }

  ws.onerror = () => {
    finalTranscripts.push('[Connection error]')
    stopRecordingCleanup()
    updateDisplay()
  }
}

function startAudioFlush() {
  // Flush buffered audio to WebSocket every 100ms
  flushInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN && audioBuffer.length > 0) {
      ws.send(new Uint8Array(audioBuffer))
      audioBuffer = []
    }
  }, 100)
}

function stopRecordingCleanup() {
  recording = false
  bridge.audioControl(false)
  if (flushInterval) {
    clearInterval(flushInterval)
    flushInterval = null
  }
  audioBuffer = []
}

async function stopRecording() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Send closing message
    ws.send(JSON.stringify({ type: 'CLOSING' }))
    // Wait briefly for CLOSED_COMPLETED, then close
    setTimeout(() => {
      if (ws) {
        ws.close()
        ws = null
      }
    }, 2000)
  }
  stopRecordingCleanup()
  updateDisplay()
}

// --- Event handling ---

let lastScrollTime = 0
const SCROLL_COOLDOWN = 300

function handleEvent(eventType: number | undefined) {
  if (eventType === OsEventTypeList.CLICK_EVENT || eventType === undefined) {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  } else if (eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    // Clear transcript
    stopRecording()
    finalTranscripts = []
    interimText = ''
    updateDisplay()
  } else if (eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT || eventType === OsEventTypeList.SCROLL_TOP_EVENT) {
    const now = Date.now()
    if (now - lastScrollTime < SCROLL_COOLDOWN) return
    lastScrollTime = now
    // Scroll could be used for navigating transcript pages in the future
  }
}

// --- Init ---

async function init() {
  bridge = await waitForEvenAppBridge()

  const textContainer = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 288,
    borderWidth: 0,
    borderColor: 0,
    paddingLength: 4,
    containerID: 1,
    containerName: 'transcript',
    content: buildDisplay(),
    isEventCapture: 1,
  })

  await bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer({
      containerTotalNum: 1,
      textObject: [textContainer],
    })
  )

  // Listen for audio data
  bridge.onEvenHubEvent((event) => {
    // Audio PCM data
    if (event.audioEvent?.audioPcm) {
      const pcm = event.audioEvent.audioPcm
      audioBuffer.push(...Array.from(pcm instanceof Uint8Array ? pcm : new Uint8Array(pcm)))
      return
    }

    // Input events
    const evtType = event.textEvent?.eventType ?? event.sysEvent?.eventType
    handleEvent(evtType)
  })
}

init()
