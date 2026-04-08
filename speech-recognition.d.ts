/**
 * Web Speech API — SpeechRecognition type declarations.
 *
 * These ambient types supplement TypeScript's built-in DOM lib which does not
 * yet ship the Web Speech API interfaces.  They follow the WICG community
 * draft specification at https://wicg.github.io/speech-api/ and MDN docs.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */

// ---------------------------------------------------------------------------
// Grammar
// ---------------------------------------------------------------------------

/** A single grammar used by the speech recogniser. */
interface SpeechGrammar {
  /** The URI of the grammar (SRC attribute). */
  src: string;
  /** The weight / priority of the grammar (0–1). */
  weight: number;
}

/** An ordered collection of {@link SpeechGrammar} objects. */
interface SpeechGrammarList {
  readonly length: number;
  /** Return the grammar at the given index. */
  item(index: number): SpeechGrammar;
  /** Add a grammar from a URI. */
  addFromURI(src: string, weight?: number): void;
  /** Add an inline grammar string. */
  addFromString(string: string, weight?: number): void;
  [index: number]: SpeechGrammar;
}

// ---------------------------------------------------------------------------
// Recognition results
// ---------------------------------------------------------------------------

/** A single recognition hypothesis (transcript + confidence). */
interface SpeechRecognitionAlternative {
  /** Confidence score between 0 and 1. */
  readonly confidence: number;
  /** The recognised text. */
  readonly transcript: string;
}

/** One recognition result, which may contain multiple alternatives. */
interface SpeechRecognitionResult {
  /** Whether this result is final or still interim. */
  readonly isFinal: boolean;
  /** Number of alternative hypotheses. */
  readonly length: number;
  /** Return the alternative at the given index. */
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

/** An ordered list of {@link SpeechRecognitionResult} objects. */
interface SpeechRecognitionResultList {
  /** Number of results in the list. */
  readonly length: number;
  /** Return the result at the given index. */
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Fired when recognition results are available. */
interface SpeechRecognitionEvent extends Event {
  /** Index of the first result that changed since the last event. */
  readonly resultIndex: number;
  /** The full list of current recognition results. */
  readonly results: SpeechRecognitionResultList;
}

/**
 * Standard error codes returned by the speech recognition service.
 *
 * @see https://wicg.github.io/speech-api/#enumdef-speechrecognitionerrorcode
 */
type SpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed";

/** Fired when a speech recognition error occurs. */
interface SpeechRecognitionErrorEvent extends Event {
  /** The error code describing what went wrong. */
  readonly error: SpeechRecognitionErrorCode;
  /** A human-readable message providing additional details. */
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Event maps (used by addEventListener / removeEventListener)
// ---------------------------------------------------------------------------

interface SpeechRecognitionEventMap {
  audioend: Event;
  audiostart: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundend: Event;
  soundstart: Event;
  speechend: Event;
  speechstart: Event;
  start: Event;
}

// ---------------------------------------------------------------------------
// SpeechRecognition
// ---------------------------------------------------------------------------

/** Controller for the speech recognition service. */
interface SpeechRecognition extends EventTarget {
  // -- configuration ---------------------------------------------------------

  /** Grammar list to constrain recognition. */
  grammars: SpeechGrammarList;
  /** Whether to return continuous results or stop after the first final result. */
  continuous: boolean;
  /** Whether to surface interim (non-final) results. */
  interimResults: boolean;
  /** Maximum number of alternative hypotheses per result. */
  maxAlternatives: number;
  /** BCP 47 language tag for recognition (e.g. "en-GB"). */
  lang: string;

  // -- lifecycle -------------------------------------------------------------

  /** Start the speech recognition service. */
  start(): void;
  /** Stop listening and attempt to return a final result. */
  stop(): void;
  /** Immediately stop without returning any pending result. */
  abort(): void;

  // -- event handlers --------------------------------------------------------

  /** Fired when audio capture begins. */
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when audio capture ends. */
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when the recogniser starts. */
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when the recogniser stops. */
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when any sound (possibly not speech) is detected. */
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when sound is no longer detected. */
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when speech is detected. */
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when speech is no longer detected. */
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** Fired when recognition results are available. */
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  /** Fired when the recogniser returns a result with no significant match. */
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  /** Fired when a recognition error occurs. */
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;

  // -- typed addEventListener / removeEventListener --------------------------

  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K],
    ) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K],
    ) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

// ---------------------------------------------------------------------------
// Constructor & Window augmentation
// ---------------------------------------------------------------------------

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  readonly prototype: SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
