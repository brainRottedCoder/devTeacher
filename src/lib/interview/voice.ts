/**
 * Web Speech API wrapper for voice input/output in interviews
 * Provides speech-to-text and text-to-speech functionality with graceful fallbacks
 */

export interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

export interface VoiceConfig {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    rate?: number; // TTS speech rate (0.1 - 10)
    pitch?: number; // TTS pitch (0 - 2)
    volume?: number; // TTS volume (0 - 1)
}

export interface ContinuousRecognitionHandler {
    onInterimResult?: (result: SpeechRecognitionResult) => void;
    onFinalResult?: (transcript: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
}

const DEFAULT_CONFIG: VoiceConfig = {
    language: "en-US",
    continuous: false,
    interimResults: true,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
};

/**
 * Check if the Web Speech API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );
}

/**
 * Check if Speech Synthesis (TTS) is supported
 */
export function isSpeechSynthesisSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis;
}

let activeRecognition: any = null;

/**
 * Start continuous speech recognition for interview mode
 * This allows the user to speak multiple times without restarting
 */
export function startContinuousRecognition(
    config: VoiceConfig = {},
    handler: ContinuousRecognitionHandler
): () => void {
    if (!isSpeechRecognitionSupported()) {
        handler.onError?.("Speech recognition is not supported in this browser");
        return () => {};
    }

    const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    recognition.lang = mergedConfig.language!;
    recognition.continuous = true;
    recognition.interimResults = mergedConfig.interimResults!;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript + " ";
                handler.onFinalResult?.(result[0].transcript);
            } else {
                interimTranscript += result[0].transcript;
                handler.onInterimResult?.({
                    transcript: result[0].transcript,
                    confidence: result[0].confidence,
                    isFinal: false,
                });
            }
        }
    };

    recognition.onerror = (event: any) => {
        const errorMessages: Record<string, string> = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'No microphone found. Please check your audio settings.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Browser speech services blocked (common in Brave/strict privacy settings). Please use text input or standard Chrome.',
        };
        const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        handler.onError?.(errorMessage);
    };

    recognition.onend = () => {
        handler.onEnd?.();
    };

    recognition.start();
    activeRecognition = recognition;

    // Return cleanup function
    return () => {
        if (activeRecognition) {
            activeRecognition.stop();
            activeRecognition = null;
        }
    };
}

/**
 * Start speech recognition (speech-to-text)
 * Returns a promise that resolves with the final transcript
 */
export function startSpeechRecognition(
    config: VoiceConfig = {},
    onInterimResult?: (result: SpeechRecognitionResult) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!isSpeechRecognitionSupported()) {
            reject(new Error("Speech recognition is not supported in this browser"));
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        recognition.lang = mergedConfig.language!;
        recognition.continuous = mergedConfig.continuous!;
        recognition.interimResults = mergedConfig.interimResults!;

        let finalTranscript = "";

        recognition.onresult = (event: any) => {
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }

                if (onInterimResult) {
                    onInterimResult({
                        transcript: result[0].transcript,
                        confidence: result[0].confidence,
                        isFinal: result.isFinal,
                    });
                }
            }
        };

        recognition.onerror = (event: any) => {
            const errorMessages: Record<string, string> = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'No microphone found. Please check your audio settings.',
                'not-allowed': 'Microphone permission denied. Please allow microphone access.',
                'network': 'Browser speech services blocked (common in Brave/strict privacy settings). Please use text input or standard Chrome.',
            };
            const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
            reject(new Error(errorMessage));
        };

        recognition.onend = () => {
            resolve(finalTranscript);
        };

        recognition.start();

        // Store reference for stopping
        (window as any).__activeRecognition = recognition;
    });
}

/**
 * Stop active speech recognition
 */
export function stopSpeechRecognition(): void {
    if (typeof window !== "undefined" && (window as any).__activeRecognition) {
        (window as any).__activeRecognition.stop();
        (window as any).__activeRecognition = null;
    }
    if (activeRecognition) {
        activeRecognition.stop();
        activeRecognition = null;
    }
}

/**
 * Speak text aloud using Speech Synthesis (TTS)
 */
export function speakText(
    text: string,
    config: VoiceConfig = {}
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!isSpeechSynthesisSupported()) {
            reject(new Error("Speech synthesis is not supported in this browser"));
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        utterance.lang = mergedConfig.language!;
        utterance.rate = mergedConfig.rate!;
        utterance.pitch = mergedConfig.pitch!;
        utterance.volume = mergedConfig.volume!;

        // Try to use a natural-sounding voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
            (v) =>
                v.lang.startsWith("en") &&
                (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (event) =>
            reject(new Error(`Speech synthesis error: ${event.error}`));

        window.speechSynthesis.speak(utterance);

        // Store reference for stopping
        (window as any).__activeUtterance = utterance;
    });
}

/**
 * Stop active speech synthesis
 */
export function stopSpeaking(): void {
    if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
    if (typeof window === "undefined") return false;
    return window.speechSynthesis?.speaking ?? false;
}
