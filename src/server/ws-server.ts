import { WebSocketServer, WebSocket } from 'ws'
import { createClient } from '@supabase/supabase-js'
import { IncomingMessage } from 'http'

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_MODEL = 'models/gemini-2.5-flash-native-audio'
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`

const REENGAGEMENT_CHECK_INTERVAL = 30_000 // 30 sec
const SILENCE_THRESHOLD = 120_000 // 2 minutes
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY = 500

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Session {
  clientWs: WebSocket
  geminiWs: WebSocket | null
  ariaScript: string
  lastClientAudio: number
  reengagementTimer: ReturnType<typeof setInterval> | null
  reconnectAttempts: number
  closed: boolean
}

const sessions = new Map<string, Session>()

function parseQueryParams(url: string): URLSearchParams {
  const idx = url.indexOf('?')
  return new URLSearchParams(idx >= 0 ? url.slice(idx + 1) : '')
}

async function verifyToken(token: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser(token)
  return !!data?.user
}

function createGeminiSetupMessage(ariaScript: string) {
  return JSON.stringify({
    setup: {
      model: GEMINI_MODEL,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
      systemInstruction: {
        parts: [{ text: ariaScript }],
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
        },
      },
    },
  })
}

function connectToGemini(session: Session, sessionId: string) {
  const geminiWs = new WebSocket(GEMINI_WS_URL)
  session.geminiWs = geminiWs

  geminiWs.on('open', () => {
    console.log(`[${sessionId}] Gemini connected`)
    geminiWs.send(createGeminiSetupMessage(session.ariaScript))
  })

  geminiWs.on('message', (data) => {
    if (session.closed) return

    try {
      const msg = JSON.parse(data.toString())

      // Check for interruption
      if (msg.serverContent?.interrupted) {
        session.clientWs.send(JSON.stringify({ type: 'interrupted' }))
        return
      }

      // Forward audio chunks to client
      const parts = msg.serverContent?.modelTurn?.parts
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            session.clientWs.send(
              JSON.stringify({
                type: 'audio',
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
              })
            )
          }
        }
      }

      // Turn complete signal
      if (msg.serverContent?.turnComplete) {
        session.clientWs.send(JSON.stringify({ type: 'turn_complete' }))
      }
    } catch (err) {
      console.error(`[${sessionId}] Error parsing Gemini message:`, err)
    }
  })

  geminiWs.on('close', () => {
    console.log(`[${sessionId}] Gemini disconnected`)
    if (!session.closed) {
      attemptReconnect(session, sessionId)
    }
  })

  geminiWs.on('error', (err) => {
    console.error(`[${sessionId}] Gemini error:`, err)
  })
}

function attemptReconnect(session: Session, sessionId: string) {
  if (session.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(`[${sessionId}] Max reconnects reached, sending fallback`)
    session.clientWs.send(JSON.stringify({ type: 'fallback' }))
    return
  }

  session.reconnectAttempts++
  const delay = RECONNECT_DELAY * session.reconnectAttempts

  console.log(`[${sessionId}] Reconnecting to Gemini (attempt ${session.reconnectAttempts})...`)

  setTimeout(() => {
    if (!session.closed) {
      connectToGemini(session, sessionId)
    }
  }, delay)
}

function startReengagementTimer(session: Session, sessionId: string) {
  session.reengagementTimer = setInterval(() => {
    if (session.closed) return

    const silenceDuration = Date.now() - session.lastClientAudio
    if (silenceDuration >= SILENCE_THRESHOLD && session.geminiWs?.readyState === WebSocket.OPEN) {
      console.log(`[${sessionId}] 2-min silence, triggering re-engagement`)

      session.geminiWs.send(
        JSON.stringify({
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [
                  {
                    text: '[System: Sharon has been quiet for 2 minutes. Check in with her warmly and naturally, referencing what you were just discussing. Keep it brief and encouraging.]',
                  },
                ],
              },
            ],
            turnComplete: true,
          },
        })
      )

      // Reset timer so we don't spam
      session.lastClientAudio = Date.now()
    }
  }, REENGAGEMENT_CHECK_INTERVAL)
}

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return

  session.closed = true
  if (session.reengagementTimer) clearInterval(session.reengagementTimer)
  if (session.geminiWs?.readyState === WebSocket.OPEN) session.geminiWs.close()
  sessions.delete(sessionId)
  console.log(`[${sessionId}] Session cleaned up`)
}

// --- Server ---

const wss = new WebSocketServer({ port: WS_PORT })

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  const params = parseQueryParams(req.url || '')
  const token = params.get('token')
  const sessionId = params.get('session') || crypto.randomUUID()
  const ariaScript = params.get('ariaScript') || ''

  // Validate auth
  if (!token || !(await verifyToken(token))) {
    ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
    ws.close()
    return
  }

  console.log(`[${sessionId}] Client connected`)

  const session: Session = {
    clientWs: ws,
    geminiWs: null,
    ariaScript: decodeURIComponent(ariaScript),
    lastClientAudio: Date.now(),
    reengagementTimer: null,
    reconnectAttempts: 0,
    closed: false,
  }

  sessions.set(sessionId, session)

  // Connect to Gemini
  connectToGemini(session, sessionId)

  // Start re-engagement timer
  startReengagementTimer(session, sessionId)

  // Handle client messages
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())

      if (msg.type === 'audio' && session.geminiWs?.readyState === WebSocket.OPEN) {
        session.lastClientAudio = Date.now()

        session.geminiWs.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: msg.data,
                },
              ],
            },
          })
        )
      }

      if (msg.type === 'update_script' && session.geminiWs?.readyState === WebSocket.OPEN) {
        // Allow updating Aria's context mid-session (e.g., moving to next stage)
        session.geminiWs.send(
          JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: `[System instruction update: ${msg.script}]` }],
                },
              ],
              turnComplete: true,
            },
          })
        )
      }
    } catch (err) {
      console.error(`[${sessionId}] Error handling client message:`, err)
    }
  })

  ws.on('close', () => {
    console.log(`[${sessionId}] Client disconnected`)
    cleanupSession(sessionId)
  })

  ws.on('error', (err) => {
    console.error(`[${sessionId}] Client error:`, err)
    cleanupSession(sessionId)
  })
})

console.log(`🎤 Miss Aria WebSocket server running on port ${WS_PORT}`)
