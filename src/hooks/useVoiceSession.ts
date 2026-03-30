'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createAudioPlayer, type AudioPlayer } from '@/lib/audio/playback'

type VoiceStatus = 'idle' | 'connecting' | 'active' | 'reconnecting' | 'fallback' | 'error'

interface UseVoiceSessionReturn {
  status: VoiceStatus
  start: (sessionId: string, ariaScript: string) => Promise<void>
  stop: () => void
  updateScript: (script: string) => void
  error: string | null
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

export function useVoiceSession(): UseVoiceSessionReturn {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)

  const cleanup = useCallback(() => {
    if (workletRef.current) {
      workletRef.current.disconnect()
      workletRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (playerRef.current) {
      playerRef.current.stop()
      playerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const start = useCallback(
    async (sessionId: string, ariaScript: string) => {
      try {
        setStatus('connecting')
        setError(null)

        // Get auth token
        const tokenRes = await fetch('/api/voice-token', { method: 'POST' })
        if (!tokenRes.ok) throw new Error('Failed to get voice token')
        const { token } = await tokenRes.json()

        // Request mic
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: { ideal: 16000 },
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        streamRef.current = stream

        // Set up AudioWorklet for mic capture
        const audioCtx = new AudioContext({ sampleRate: stream.getAudioTracks()[0].getSettings().sampleRate || 48000 })
        audioCtxRef.current = audioCtx

        await audioCtx.audioWorklet.addModule('/worklets/mic-processor.js')

        const source = audioCtx.createMediaStreamSource(stream)
        const worklet = new AudioWorkletNode(audioCtx, 'mic-processor')
        workletRef.current = worklet

        source.connect(worklet)
        worklet.connect(audioCtx.destination) // needed to keep processing alive

        // Set up audio player for Gemini responses
        playerRef.current = createAudioPlayer()

        // Connect WebSocket
        const encodedScript = encodeURIComponent(ariaScript)
        const ws = new WebSocket(`${WS_URL}?token=${token}&session=${sessionId}&ariaScript=${encodedScript}`)
        wsRef.current = ws

        ws.onopen = () => {
          setStatus('active')
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)

            if (msg.type === 'audio' && playerRef.current) {
              playerRef.current.enqueue(msg.data)
            }

            if (msg.type === 'interrupted' && playerRef.current) {
              playerRef.current.stop()
            }

            if (msg.type === 'fallback') {
              setStatus('fallback')
            }

            if (msg.type === 'error') {
              setError(msg.message)
              setStatus('error')
            }
          } catch {
            // Ignore parse errors
          }
        }

        ws.onclose = () => {
          if (status === 'active') {
            setStatus('idle')
          }
        }

        ws.onerror = () => {
          setError('WebSocket connection failed')
          setStatus('error')
        }

        // Forward mic audio chunks to WebSocket
        worklet.port.onmessage = (event) => {
          if (event.data.type === 'audio' && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', data: event.data.data }))
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start voice session')
        setStatus('error')
        cleanup()
      }
    },
    [cleanup, status]
  )

  const stop = useCallback(() => {
    cleanup()
    setStatus('idle')
    setError(null)
  }, [cleanup])

  const updateScript = useCallback((script: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'update_script', script }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return { status, start, stop, updateScript, error }
}
