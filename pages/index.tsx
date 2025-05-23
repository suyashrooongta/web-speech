import React, { useState, useRef } from "react";
import axios from "axios";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [fixedTranscript, setFixedTranscript] = useState("");
  const [context, setContext] = useState("");
  const isListeningRef = useRef(false); // Ref to track listening state
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Ref for SpeechRecognition instance

  const startListening = () => {
    console.log("Starting speech recognition...");
    setIsListening(true);
    setTranscript(""); // Clear previous transcript
    setFixedTranscript(""); // Clear previous fixed transcript
    isListeningRef.current = true; // Update ref value

    // Get SpeechRecognition from window (cross-browser)
    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? window.SpeechRecognition || (window as any).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionClass) {
      alert("Speech Recognition API is not supported in this browser.");
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true; // Keep recognition active during pauses

      const SpeechGrammarListClass =
        typeof window !== "undefined"
          ? window.SpeechGrammarList || (window as any).webkitSpeechGrammarList
          : undefined;

      if (!SpeechGrammarListClass) {
        console.warn(
          "Speech Grammar List API is not supported in this browser."
        );
      } else {
        const grammarList = new SpeechGrammarListClass();
        grammarList.addFromString(
          "#JSGF V1.0; grammar phrases; public <phrase> = OpenAI | SkyForge ;",
          10
        );
        console.log("Grammar list added:", grammarList);
        recognition.grammars = grammarList;
      }

      recognition.onresult = (event: any) => {
        console.log("Speech recognition result:", event.results);
        const speechToText = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(".");
        setTranscript(speechToText);
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

  const stopListening = async () => {
    setIsListening(false);
    isListeningRef.current = false; // Update ref value
    recognitionRef.current?.stop();
    const fixedTranscript = await axios
      .post("/api/fixtranscription", { context, transcript })
      .then((res: { data: { response: string } }) => res.data.response);
    setFixedTranscript(fixedTranscript);
    setContext(""); // Clear context after fixing
    console.log("Fixed transcript:", fixedTranscript);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Speech Recognition App</h1>
      <input
        type="text"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Enter context here"
        className="px-4 py-2 border rounded w-full"
      />
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
      <p className="mt-2 text-lg text-green-600">
        {fixedTranscript && `Fixed Transcript: ${fixedTranscript}`}
      </p>
    </div>
  );
}
