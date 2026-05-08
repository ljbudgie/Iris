"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type VoiceInputProps = {
  onTranscript: (text: string) => void;
  setInput: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
};

function PureVoiceInput({
  onTranscript,
  setInput,
  disabled,
  className,
  iconClassName,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionApi =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-GB";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
          onTranscript(finalTranscript.trim());
        } else {
          interim += transcript;
        }
      }
      // Show interim results in the input
      setInput(finalTranscript + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        toast.error(
          "Microphone access was denied. Please allow microphone access in your browser settings."
        );
      } else if (event.error !== "aborted") {
        toast.error("Voice input error. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, isSupported, onTranscript, setInput]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      className={cn(
        "h-7 w-7 rounded-lg border p-1 transition-all duration-200",
        isListening
          ? "border-[rgba(15,118,110,0.5)] bg-[rgba(15,118,110,0.16)] text-[#5eead4] animate-pulse"
          : "border-[#27272a] text-[#52525b] hover:text-[#a1a1aa]",
        className
      )}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        toggleListening();
      }}
      title={isListening ? "Stop listening" : "Voice input"}
      type="button"
      variant="ghost"
    >
      {isListening ? (
        <MicOffIcon className={cn("size-4", iconClassName)} />
      ) : (
        <MicIcon className={cn("size-4", iconClassName)} />
      )}
    </Button>
  );
}

export const VoiceInput = memo(PureVoiceInput);
