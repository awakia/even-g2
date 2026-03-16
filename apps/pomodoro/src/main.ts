import {
  waitForEvenAppBridge,
  CreateStartUpPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  OsEventTypeList,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'

// --- Config ---
const WORK_MINUTES = 25
const BREAK_MINUTES = 5
const BAR_WIDTH = 30

// --- State ---
type Phase = 'IDLE' | 'WORK' | 'BREAK'

let phase: Phase = 'IDLE'
let totalSeconds = WORK_MINUTES * 60
let remainingSeconds = totalSeconds
let timerInterval: ReturnType<typeof setInterval> | null = null
let bridge: EvenAppBridge

// --- Display ---

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function buildProgressBar(remaining: number, total: number): string {
  const elapsed = total - remaining
  const filled = Math.round((elapsed / total) * BAR_WIDTH)
  const empty = BAR_WIDTH - filled
  return '\u2501'.repeat(filled) + '\u2500'.repeat(empty)
}

function buildDisplay(): string {
  const label = phase === 'BREAK' ? 'BREAK' : 'WORK'
  const time = formatTime(remainingSeconds)
  const bar = buildProgressBar(remainingSeconds, totalSeconds)
  const running = timerInterval !== null

  let action: string
  if (phase === 'IDLE') {
    action = '> Start'
  } else if (running) {
    action = '|| Pause'
  } else {
    action = '> Resume'
  }

  return `${label}  ${time}\n${bar}\n\n${action}`
}

async function updateDisplay() {
  const content = buildDisplay()
  await bridge.textContainerUpgrade(
    new TextContainerUpgrade({
      containerID: 1,
      containerName: 'timer',
      contentOffset: 0,
      contentLength: 2000,
      content,
    })
  )
}

// --- Timer logic ---

function startTimer() {
  if (timerInterval) return
  if (phase === 'IDLE') {
    phase = 'WORK'
    totalSeconds = WORK_MINUTES * 60
    remainingSeconds = totalSeconds
  }
  timerInterval = setInterval(async () => {
    remainingSeconds--
    if (remainingSeconds <= 0) {
      stopTimer()
      if (phase === 'WORK') {
        phase = 'BREAK'
        totalSeconds = BREAK_MINUTES * 60
      } else {
        phase = 'WORK'
        totalSeconds = WORK_MINUTES * 60
      }
      remainingSeconds = totalSeconds
      startTimer()
    }
    await updateDisplay()
  }, 1000)
  updateDisplay()
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function reset() {
  stopTimer()
  phase = 'IDLE'
  totalSeconds = WORK_MINUTES * 60
  remainingSeconds = totalSeconds
  updateDisplay()
}

function handleClick() {
  if (timerInterval) {
    stopTimer()
    updateDisplay()
  } else {
    startTimer()
  }
}

// --- Scroll cooldown ---
let lastScrollTime = 0
const SCROLL_COOLDOWN = 300

function adjustTime(delta: number) {
  if (phase !== 'IDLE' && timerInterval) return
  const now = Date.now()
  if (now - lastScrollTime < SCROLL_COOLDOWN) return
  lastScrollTime = now

  remainingSeconds = Math.max(60, remainingSeconds + delta)
  totalSeconds = remainingSeconds
  updateDisplay()
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
    paddingLength: 8,
    containerID: 1,
    containerName: 'timer',
    content: buildDisplay(),
    isEventCapture: 1,
  })

  await bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer({
      containerTotalNum: 1,
      textObject: [textContainer],
    })
  )

  bridge.onEvenHubEvent((event) => {
    const textEvt = event.textEvent
    const sysEvt = event.sysEvent
    const evtType = textEvt?.eventType ?? sysEvt?.eventType

    if (evtType === OsEventTypeList.CLICK_EVENT || evtType === undefined) {
      handleClick()
    } else if (evtType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      reset()
    } else if (evtType === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
      adjustTime(-5 * 60)
    } else if (evtType === OsEventTypeList.SCROLL_TOP_EVENT) {
      adjustTime(5 * 60)
    }
  })
}

init()
