/**
 * WebRTC Voice Recording Hook
 * 
 * Provides audio recording and playback capabilities for:
 * - Voice-based AI interviews
 * - Audio response recording
 * - Voice feedback capture
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecordingState {
    isRecording: boolean;
    isPaused: boolean;
    isPlaying: boolean;
    duration: number;
    audioUrl: string | null;
    error: string | null;
}

export interface UseVoiceRecordingOptions {
    onRecordingComplete?: (blob: Blob) => void;
    onError?: (error: Error) => void;
    maxDuration?: number; // in seconds
    audioFormat?: 'audio/webm' | 'audio/mp4' | 'audio/wav';
}

const DEFAULT_OPTIONS: UseVoiceRecordingOptions = {
    maxDuration: 300, // 5 minutes
    audioFormat: 'audio/webm',
};

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };

    const [state, setState] = useState<VoiceRecordingState>({
        isRecording: false,
        isPaused: false,
        isPlaying: false,
        duration: 0,
        audioUrl: null,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Check permissions
    const checkPermission = useCallback(async (): Promise<boolean> => {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            return permission.state === 'granted';
        } catch {
            // Fallback for browsers that don't support permission query
            return true;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, error: null }));

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                }
            });

            streamRef.current = stream;
            chunksRef.current = [];

            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: config.audioFormat || 'audio/webm',
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: config.audioFormat });
                const url = URL.createObjectURL(blob);

                setState(prev => ({
                    ...prev,
                    audioUrl: url,
                    isRecording: false,
                    isPaused: false,
                }));

                config.onRecordingComplete?.(blob);
            };

            mediaRecorder.onerror = (event) => {
                const error = new Error('Recording failed');
                setState(prev => ({ ...prev, error: error.message }));
                config.onError?.(error);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Collect data every 100ms

            startTimeRef.current = Date.now();

            // Start duration timer
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setState(prev => ({ ...prev, duration: elapsed }));

                // Auto-stop at max duration
                if (config.maxDuration && elapsed >= config.maxDuration) {
                    stopRecording();
                }
            }, 100);

            setState(prev => ({
                ...prev,
                isRecording: true,
                duration: 0,
            }));

        } catch (error: any) {
            const message = error.name === 'NotAllowedError'
                ? 'Microphone permission denied'
                : 'Failed to start recording';
            setState(prev => ({ ...prev, error: message }));
            config.onError?.(new Error(message));
        }
    }, [config]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isRecording: false,
            isPaused: false,
        }));
    }, []);

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setState(prev => ({ ...prev, isPaused: true }));
        }
    }, []);

    // Resume recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume();
            timerRef.current = setInterval(() => {
                setState(prev => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);
            setState(prev => ({ ...prev, isPaused: false }));
        }
    }, []);

    // Play audio
    const playAudio = useCallback(() => {
        if (!state.audioUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(state.audioUrl);
        }

        audioRef.current.onended = () => {
            setState(prev => ({ ...prev, isPlaying: false }));
        };

        audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
    }, [state.audioUrl]);

    // Pause audio
    const pauseAudio = useCallback(() => {
        audioRef.current?.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
    }, []);

    // Stop audio
    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setState(prev => ({ ...prev, isPlaying: false }));
    }, []);

    // Delete recording
    const deleteRecording = useCallback(() => {
        stopAudio();
        if (audioRef.current) {
            URL.revokeObjectURL(audioRef.current.src);
            audioRef.current = null;
        }
        setState({
            isRecording: false,
            isPaused: false,
            isPlaying: false,
            duration: 0,
            audioUrl: null,
            error: null,
        });
    }, [stopAudio]);

    // Get audio blob
    const getAudioBlob = useCallback((): Blob | null => {
        if (chunksRef.current.length === 0) return null;
        return new Blob(chunksRef.current, { type: config.audioFormat });
    }, [config.audioFormat]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        playAudio,
        pauseAudio,
        stopAudio,
        deleteRecording,
        getAudioBlob,
        checkPermission,
    };
}

/**
 * Voice Analysis Hook
 * Analyzes recorded audio for various metrics
 */
export function useVoiceAnalysis() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<{
        clarity: number;
        pace: number;
        fillerWords: number;
        sentiment: 'positive' | 'neutral' | 'negative';
    } | null>(null);

    const analyzeAudio = useCallback(async (blob: Blob): Promise<typeof analysis> => {
        setIsAnalyzing(true);

        try {
            // In production, this would call an API to analyze the audio
            // For now, return simulated analysis
            await new Promise(resolve => setTimeout(resolve, 1500));

            const result = {
                clarity: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
                pace: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
                fillerWords: Math.floor(Math.random() * 5),
                sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
            };

            setAnalysis(result);
            return result;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        isAnalyzing,
        analysis,
        analyzeAudio,
    };
}
