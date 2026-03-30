const OUTPUT_SAMPLE_RATE = 24000

export interface AudioPlayer {
  enqueue(pcmBase64: string): void
  stop(): void
}

export function createAudioPlayer(): AudioPlayer {
  const ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
  let nextStartTime = 0
  let scheduledNodes: AudioBufferSourceNode[] = []

  function enqueue(pcmBase64: string) {
    // Decode base64 to Int16 PCM
    const binary = atob(pcmBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const int16 = new Int16Array(bytes.buffer)

    // Convert Int16 to Float32
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff)
    }

    // Create AudioBuffer
    const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    // Schedule playback
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const now = ctx.currentTime
    if (nextStartTime < now) {
      nextStartTime = now
    }

    source.start(nextStartTime)
    scheduledNodes.push(source)

    source.onended = () => {
      const idx = scheduledNodes.indexOf(source)
      if (idx >= 0) scheduledNodes.splice(idx, 1)
    }

    nextStartTime += buffer.duration
  }

  function stop() {
    for (const node of scheduledNodes) {
      try {
        node.stop()
      } catch {
        // Already stopped
      }
    }
    scheduledNodes = []
    nextStartTime = 0
  }

  return { enqueue, stop }
}
