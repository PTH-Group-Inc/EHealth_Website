'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================
// Web Speech API types augmentation
// ============================================

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInstance;
}

type SpeechRecognitionWindow = Window & typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

// ============================================
// Options
// ============================================

interface UseVoiceInputOptions {
    lang?: string;
    continuous?: boolean;
}

// ============================================
// Return type
// ============================================

interface UseVoiceInputReturn {
    isListening: boolean;
    transcript: string;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
}

// ============================================
// Hook
// ============================================

export function useVoiceInput(options?: UseVoiceInputOptions): UseVoiceInputReturn {
    const lang = options?.lang ?? 'vi-VN';
    const continuous = options?.continuous ?? false;
    const speechWindow = typeof window === 'undefined' ? null : (window as SpeechRecognitionWindow);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    // Detect support
    const isSupported = !!(speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) return;

        const SpeechRecognition = speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition: SpeechRecognitionInstance = new SpeechRecognition();

        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = true;

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let fullTranscript = '';
            for (let i = 0; i < e.results.length; i++) {
                fullTranscript += e.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setTranscript('');
    }, [continuous, isSupported, lang, speechWindow]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return { isListening, transcript, isSupported, startListening, stopListening };
}
