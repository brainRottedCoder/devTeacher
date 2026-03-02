import { useState, useCallback, useRef, useEffect } from 'react';
import {
    startContinuousRecognition,
    startSpeechRecognition,
    stopSpeechRecognition,
    speakText,
    stopSpeaking,
    isSpeaking as checkIsSpeaking,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    SpeechRecognitionResult,
    VoiceConfig,
    ContinuousRecognitionHandler,
} from '@/lib/interview/voice';

interface UseVoiceInterviewOptions {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onAIResponse?: (text: string) => void;
    language?: string;
    autoSpeak?: boolean;
    continuousMode?: boolean;
}

export function useVoiceInterview(options: UseVoiceInterviewOptions = {}) {
    const {
        onTranscript,
        onAIResponse,
        language = 'en-US',
        autoSpeak = true,
        continuousMode = true,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState({
        recognition: false,
        synthesis: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const recognitionCleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        setIsSupported({
            recognition: isSpeechRecognitionSupported(),
            synthesis: isSpeechSynthesisSupported(),
        });
    }, []);

    const startListening = useCallback(async () => {
        if (!isSupported.recognition) {
            setError('Speech recognition is not supported in this browser');
            return;
        }

        setError(null);
        setIsListening(true);
        setInterimTranscript('');
        setFinalTranscript('');

        try {
            const config: VoiceConfig = {
                language,
                continuous: continuousMode,
                interimResults: true,
            };

            if (continuousMode) {
                // Use continuous recognition for interview mode
                const handler: ContinuousRecognitionHandler = {
                    onInterimResult: (result: SpeechRecognitionResult) => {
                        if (!result.isFinal) {
                            setInterimTranscript(result.transcript);
                        }
                        onTranscript?.(result.transcript, result.isFinal);
                    },
                    onFinalResult: (transcript: string) => {
                        setFinalTranscript(prev => prev + ' ' + transcript);
                        setInterimTranscript('');
                    },
                    onError: (errorMsg: string) => {
                        setError(errorMsg);
                        setIsListening(false);
                    },
                    onEnd: () => {
                        setIsListening(false);
                    },
                };

                recognitionCleanupRef.current = startContinuousRecognition(config, handler);
            } else {
                // Use single-shot recognition
                const transcript = await startSpeechRecognition(config, (result: SpeechRecognitionResult) => {
                    if (!result.isFinal) {
                        setInterimTranscript(result.transcript);
                    }
                    onTranscript?.(result.transcript, result.isFinal);
                });

                setInterimTranscript('');
                setFinalTranscript(transcript);
                setIsListening(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Speech recognition failed');
            setIsListening(false);
        }
    }, [isSupported.recognition, language, continuousMode, onTranscript]);

    const stopListening = useCallback(() => {
        if (recognitionCleanupRef.current) {
            recognitionCleanupRef.current();
            recognitionCleanupRef.current = null;
        }
        stopSpeechRecognition();
        setIsListening(false);
        setInterimTranscript('');
    }, []);

    const speak = useCallback(async (text: string) => {
        if (!isSupported.synthesis) {
            setError('Speech synthesis is not supported in this browser');
            return false;
        }

        setError(null);
        setIsSpeaking(true);

        try {
            await speakText(text, { language });
            setIsSpeaking(false);
            onAIResponse?.(text);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Speech synthesis failed');
            setIsSpeaking(false);
            return false;
        }
    }, [isSupported.synthesis, language, onAIResponse]);

    const stopSpeakingNow = useCallback(() => {
        stopSpeaking();
        setIsSpeaking(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsSpeaking(checkIsSpeaking());
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return {
        isListening,
        isSpeaking,
        isSupported,
        error,
        interimTranscript,
        finalTranscript,
        startListening,
        stopListening,
        speak,
        stopSpeaking: stopSpeakingNow,
        toggleListening,
    };
}

export function useVoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            
            chunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start recording');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const clearRecording = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
        chunksRef.current = [];
    }, [audioUrl]);

    return {
        isRecording,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        clearRecording,
    };
}
