import React, { useEffect, useState } from "react";

const SpeechRecognitionComponent: React.FC = () => {
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if the SpeechRecognition API is available in the browser
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      // Use the standard API if available, otherwise use the prefixed version for Chrome/Safari
      const recognition: SpeechRecognition =
        "SpeechRecognition" in window
          ? new window.SpeechRecognition()
          : new (window as any).webkitSpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 2; // Limit to two alternatives

      recognition.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        console.log("Speech recognition result:", event.results);
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            console.log("Final result:", event.results[i][0].transcript);
            setTranscript(
              (prevTranscript) =>
                prevTranscript + event.results[i][0].transcript
            );
          } else {
            console.log("Interim result:", event.results[i].length);
            for (let j = 0; j < event.results[i].length; j++) {
              interimTranscript += event.results[i][j].transcript + "/";
            }
          }
        }
        // You can handle interim transcripts separately if needed
        console.log("Interim Transcript:", interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended");
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error, event.message);
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    } else {
      console.error("Speech Recognition API is not supported in this browser.");
    }

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      if (speechRecognition) {
        speechRecognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (speechRecognition && !isListening) {
      speechRecognition.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        Start Listening
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Stop Listening
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  );
};

export default SpeechRecognitionComponent;
