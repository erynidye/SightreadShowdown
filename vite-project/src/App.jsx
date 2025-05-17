import { useEffect, useState, useRef } from 'react'
import * as Pitchfinder from 'pitchfinder'

function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const handleStartStop = () => {
    setPlaying(!playing);
  };

  const handleBpmChange = (e) => {
    setBpm(parseInt(e.target.value));
  };

  // Calculate the interval in milliseconds based on BPM
  const interval = 60000 / bpm;

  useEffect(() => {
    // Clear previous interval when BPM or playing state changes
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Set a new interval when playing state is true
    if (playing) {
      const newIntervalId = setInterval(() => {
        setActiveBeat((prevActiveBeat) => (prevActiveBeat + 1) % 4);
      }, interval);
      setIntervalId(newIntervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [playing, interval]);

  return (
    <div>
      <h1>Metronome</h1>
      <div>
        <label htmlFor="bpm">BPM:</label>
        <input
          type="number"
          id="bpm"
          value={bpm}
          onChange={handleBpmChange}
        />
      </div>
      <button onClick={handleStartStop}>{playing ? 'Stop' : 'Start'}</button>
    </div>
  );
}

function App() {
  const [pitch, setPitch] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const detectPitch = Pitchfinder.AMDF();
  
    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
  
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
  
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
  
        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;
  
        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          const detected = detectPitch(input);
          if (detected) {
            setPitch(detected);
            console.log("pitch:", detected)
          }
        };
  
        source.connect(processor);
        processor.connect(audioContext.destination);
      } catch (err) {
        console.error("Microphone access error:", err);
        setError(err.message);
      }
    }
  
    async function stopMic() {
      // stop tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
  
      // disconnect processor
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }
  
      // disconnect source
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
  
      // close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
  
      setPitch(null);
    }
  
    // Only allow one startMic to run
    let didCancel = false;
  
    if (isReady) {
      stopMic().then(() => {
        if (!didCancel) {
          startMic();
        }
      });
    } else {
      stopMic();
    }
  
    return () => {
      didCancel = true;
      stopMic();
    };
  }, [isReady]);
  
  useEffect(() => {
    const readyButton = document.createElement("BUTTON");
    readyButton.setAttribute("type", "button");
    readyButton.innerHTML = "Click Me";
    readyButton.onclick = () => setIsReady(prev => !prev);
    document.body.appendChild(readyButton);
  
    return () => {
      document.body.removeChild(readyButton); // clean up
    };
  }, []);
  

  return (
    <>
      <h1>Microphone Pitch Detection</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <p>Detected pitch: {pitch ? `${pitch.toFixed(2)} Hz` : 'Listening…'}</p>
      )}
      <Metronome />
    </>
  )
}

export default App;
