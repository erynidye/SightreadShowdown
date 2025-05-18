import { useEffect, useState, useRef } from 'react'
import * as Pitchfinder from 'pitchfinder'

// import dotenv from 'dotenv'
// dotenv.config()

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let last = "NA";
let lastTime = 1000000000;

let counter = 0;
let playedNotes = [];

const FMajorScale = [
  {"pitch": "F5", "duration": 0.5},
  {"pitch": "A5", "duration": 0.5},
  {"pitch": "G5", "duration": 0.5},
  {"pitch": "Bb5", "duration": 0.5},
  {"pitch": "A5", "duration": 0.5},
  {"pitch": "C6", "duration": 0.5},
  {"pitch": "Bb5", "duration": 0.5},
  {"pitch": "D6", "duration": 0.5},
  {"pitch": "C6", "duration": 0.5},
  {"pitch": "E6", "duration": 0.5},
  {"pitch": "D6", "duration": 0.5},
  {"pitch": "F6", "duration": 0.5},
  {"pitch": "E6", "duration": 1},
  {"pitch": "F6", "duration": 1},
  {"pitch": "F6", "duration": 0.5},
  {"pitch": "D6", "duration": 0.5},
  {"pitch": "E6", "duration": 0.5},
  {"pitch": "C6", "duration": 0.5},
  {"pitch": "D6", "duration": 0.5},
  {"pitch": "Bb5", "duration": 0.5},
  {"pitch": "C6", "duration": 0.5},
  {"pitch": "A5", "duration": 0.5},
  {"pitch": "Bb5", "duration": 0.5},
  {"pitch": "G5", "duration": 0.5},
  {"pitch": "A5", "duration": 0.5},
  {"pitch": "F5", "duration": 0.5},
  {"pitch": "G5", "duration": 0.5},
  {"pitch": "E5", "duration": 0.5},
  {"pitch": "F5", "duration": 1}
]

const testingNotes = [
  {"pitch": "F5", "duration": 0.56},
  {"pitch": "A5", "duration": 0.29},
  {"pitch": "G5", "duration": 0.28},
  {"pitch": "Bb5", "duration": 0.28},
  {"pitch": "A5", "duration": 0.28},
  {"pitch": "C6", "duration": 0.28},
  {"pitch": "Bb5", "duration": 0.28},
  {"pitch": "D6", "duration": 0.29},
  {"pitch": "C6", "duration": 0.28},
  {"pitch": "E6", "duration": 0.28},
  {"pitch": "D6", "duration": 0.29},
  {"pitch": "F6", "duration": 0.28},
  {"pitch": "E6", "duration": 0.56},
  {"pitch": "F6", "duration": 0.56},
  {"pitch": "F6", "duration": 0.28},
  {"pitch": "D6", "duration": 0.29},
  {"pitch": "E6", "duration": 0.28},
  {"pitch": "C6", "duration": 0.28},
  {"pitch": "D6", "duration": 0.29},
  {"pitch": "Bb5", "duration": 0.28},
  {"pitch": "C6", "duration": 0.28},
  {"pitch": "A5", "duration": 0.28},
  {"pitch": "Bb5", "duration": 0.28},
  {"pitch": "G5", "duration": 0.28},
  {"pitch": "A5", "duration": 0.28},
  {"pitch": "F5", "duration": 0.28},
  {"pitch": "G5", "duration": 0.28},
  {"pitch": "E5", "duration": 0.29},
  {"pitch": "F5", "duration": 0.56}
]

// function Metronome() 
// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({ apiKey });

// export async function evaluatePerf(playedNotes, expectedNotes) {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-pro-preview-05-06",
//     contents: [
//       {
//         role: "system",
//         parts: [
//           {
//             text: "You are an expert rhythm and pitch evaluator. Respond ONLY with an accuracy percent as a number between 0 and 100, no explanation. You will receive two array of maps: the first one will be from what the player played and the second one with the expected note to be played and its duration. The expected notes dictionary will have the duration in 60bpm but it should be converted to 100bpm to be compared with the played notes. Use the criteria of playing the right note at the right time and output the accuracy as a percentage. bpm is expected to be 100, let bpm played = n, if n != 100, score = (100% - (the difference between 100 and n)% * score. if it shows that the player has played a duration of 4s (scalable) but the expected is to be 1 1 1 1 (four quarter notes) - take it with a grain of salt because player probably articulated the individual notes but we don't have the tech to find that. Also note that if the player plays extra notes that are not in the expected notes but falls back in time later on - the later notes should be scored accordingly because they were able to recover"
//           }
//         ]
//       }, {
//         role: "user",
//         parts: [
//           {
//             text: JSON.stringify([playedNotes, expectedNotes])
//           }
//         ]
//       }, {
//         role: "model",
//         parts: [
//           {
//             text: "59.75"
//           }
//         ]
//       }
//     ]
//   });
//   console.log("response:", response);
//   return(response.text);
// }


// function Metronome() {

//   return (
//     <div>
//       <h1>Metronome</h1>
//     </div>
//   );
// }

function Mapping(freq){
  //array of note names in an octave
  const notes = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
  // calculate the number of half steps from reference note (middle C) and the octave
  const steps = Math.round(Math.log2(freq / 261.63) * 12);
  const octave = 4 + Math.floor(steps / 12);
  // return note name and octave
  if(steps < 0){
    const note = 12 - (Math.abs(steps) % 12);
    return notes[note] + octave;
  } else {
    const note= steps % 12;
    return notes[note] + octave;
  }
}

function App() {
  const [pitch, setPitch] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(null);

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
          const detected = detectPitch(input); //Hz
          let current = Mapping(detected); // note name

          if (detected) {
            setPitch(detected); // still Hz
            if (!((current === last) || (current === "N/A"))) {
              let d = new Date();
              let duration = (d.getTime() - lastTime) / 1000;
              if (0.06 < duration < 10 && last !== "N/A") {
                playedNotes.push({
                  pitch: last,
                  duration: duration
                });
              }
              lastTime = d.getTime()
              //console.log(duration);
              last = current;
              //console.log(playedNotes[counter].pitch);
              //console.log(playedNotes[counter].duration);
              counter += 1;
            }
            //console.log(current);
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
      let d = new Date();
      let duration = (d.getTime() - lastTime) / 1000;
      if (0.06 < duration < 10 && last !== "N/A") {
        playedNotes.push({
          pitch: last,
          duration: duration
        });
      }
      console.log("after stopMic:", playedNotes);
      const score = await fetch("http://localhost:3001/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ testingNotes, FMajorScale })
      }).then(res => res.json());
      console.log(testingNotes)
      console.log(FMajorScale)
      console.log("score:", score);      
      // console.log(evaluatePerf(testingNotes, FMajorScale));

      setScore(score);
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
    readyButton.innerHTML = "Start/Stop";
    readyButton.onclick = () => setIsReady(prev => !prev);
    document.body.appendChild(readyButton);
  
    return () => {
      document.body.removeChild(readyButton); // clean up
    };
  }, []);
  

  return (
    <>
      <h1>Sightread Showdown</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
          <div id="data"><h2>Detected frequency: <strong>{pitch ? `${pitch.toFixed(2)} Hz` : 'Waiting…'}</strong><br></br><br></br>
            Detected Note: <strong>{last}</strong></h2></div>
      )}
      {/* <Metronome /> */}

      <h3>{score}</h3>
    </>
  )
}

export default App;
