import React, { useState, useRef } from "react";

// Declare the SpeechRecognition interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Declare SpeechRecognition
declare var SpeechRecognition: any;

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<typeof SpeechRecognition | null>(null);
  const isListeningRef = useRef(false); // Ref to track listening state

  const startListening = () => {
    console.log("Starting speech recognition...");
    setIsListening(true);
    isListeningRef.current = true; // Update ref value

    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = true; // Keep recognition active during pauses

      recognition.onresult = (event: any) => {
        console.log("Speech recognition result:", event);
        const speechToText = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(".");
        setTranscript(speechToText); // Replace instead of appending
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        if (isListeningRef.current) {
          console.log("Restarting recognition...");
          recognitionRef.current?.start(); // Restart if still listening
        }
      };

      recognitionRef.current = recognition;
    }
    recognitionRef.current.start();
  };

  const stopListening = () => {
    setIsListening(false);
    isListeningRef.current = false; // Update ref value
    recognitionRef.current?.stop();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Speech Recognition App</h1>
      <div className="flex gap-4">
        <button
          onClick={startListening}
          className={`px-4 py-2 rounded ${
            isListening ? "bg-gray-400" : "bg-blue-500 text-white"
          }`}
          disabled={isListening}
        >
          Start Listening
        </button>
        <button
          onClick={stopListening}
          className="px-4 py-2 rounded bg-red-500 text-white"
          disabled={!isListening}
        >
          Stop Listening
        </button>
      </div>
      <p className="mt-4 text-lg">{transcript || "Say something..."}</p>
    </div>
  );
}
