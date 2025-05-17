import { useEffect, useState } from 'react'
import * as Pitchfinder from 'pitchfinder'

function App() {
  const [pitch, setPitch] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const detectPitch = Pitchfinder.AMDF()

    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(stream)

        const processor = audioContext.createScriptProcessor(2048, 1, 1)

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0)
          const detectedPitch = detectPitch(input)

          if (detectedPitch) {
            setPitch(detectedPitch)
          }
        }

        source.connect(processor)
        processor.connect(audioContext.destination)
      } catch (err) {
        console.error('Microphone access error:', err)
        setError(err.message)
      }
    }

    startMic()

    return () => {
      // Cleanup logic could go here (e.g., stop tracks or disconnect nodes)
    }
  }, [])

  return (
    <>
      <h1>Microphone Pitch Detection</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <p>Detected pitch: {pitch ? `${pitch.toFixed(2)} Hz` : 'Listening…'}</p>
      )}
    </>
  )
}

export default App
