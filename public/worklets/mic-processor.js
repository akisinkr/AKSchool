/**
 * AudioWorklet processor for mic capture.
 * Downsamples to 16kHz, converts Float32 to Int16 PCM,
 * posts base64-encoded chunks every ~100ms.
 */
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = []
    this._targetSampleRate = 16000
    // sampleRate is a global in AudioWorkletGlobalScope
    this._ratio = sampleRate / this._targetSampleRate
    this._samplesPerChunk = 1600 // 100ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channelData = input[0] // mono

    // Downsample by picking nearest sample
    for (let i = 0; i < channelData.length; i++) {
      const targetIndex = Math.floor(this._buffer.length * this._ratio + i)
      const srcIndex = Math.round(i * this._ratio)
      if (srcIndex < channelData.length) {
        this._buffer.push(channelData[Math.min(Math.round(i / this._ratio * (channelData.length / (channelData.length / this._ratio))), channelData.length - 1)])
      }
    }

    // Simple approach: accumulate input, downsample, emit chunks
    // Reset and use cleaner logic
    this._buffer = []

    // Downsample input to 16kHz
    const downsampledLength = Math.floor(channelData.length / this._ratio)
    for (let i = 0; i < downsampledLength; i++) {
      const srcIndex = Math.min(Math.round(i * this._ratio), channelData.length - 1)
      this._pendingBuffer = this._pendingBuffer || []
      this._pendingBuffer.push(channelData[srcIndex])
    }

    // Emit when we have enough samples
    while (this._pendingBuffer && this._pendingBuffer.length >= this._samplesPerChunk) {
      const chunk = this._pendingBuffer.splice(0, this._samplesPerChunk)

      // Convert Float32 to Int16
      const int16 = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      // Convert to base64
      const bytes = new Uint8Array(int16.buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)

      this.port.postMessage({ type: 'audio', data: base64 })
    }

    return true
  }
}

registerProcessor('mic-processor', MicProcessor)
