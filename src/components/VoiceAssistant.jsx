import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, MessageSquare, Volume2, Loader2 } from 'lucide-react';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(new Audio());

    const toggleAssistant = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            stopAssistant();
        }
    };

    const stopAssistant = () => {
        if (isRecording) stopRecording();
        audioRef.current.pause();
        audioRef.current.src = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Check for supported mime types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
                ? 'audio/webm' 
                : 'audio/ogg';
                
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = handleRecordingStop;
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError('');
            setTranscript('Listening...');
            setResponse('');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Stop all tracks in the stream
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendToAssistant(audioBlob);
    };

    const sendToAssistant = async (audioBlob) => {
        setIsProcessing(true);
        setTranscript('Transcribing...');

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        try {
            const res = await fetch(`http://localhost:8000/api/v1/assistant/voice-chat?t=${Date.now()}`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            
            if (data.error) {
                setError(data.error);
            } else {
                setTranscript(data.user_text);
                setResponse(data.ai_response);
                
                if (data.ai_audio) {
                    playAudio(data.ai_audio);
                }
            }
        } catch (err) {
            console.error("Error connecting to assistant:", err);
            setError("Connection failed. Is the AI Engine running?");
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudio = (base64Audio) => {
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    };

    return (
        <div className={`voice-assistant-wrapper ${isOpen ? 'open' : ''}`}>
            {/* The Floating UI Panel */}
            {isOpen && (
                <div className="voice-panel animate-in">
                    <div className="voice-header">
                        <div className="voice-status">
                            <div className={`status-dot ${isRecording ? 'recording' : isProcessing ? 'processing' : 'idle'}`}></div>
                            <span>AI Guide</span>
                        </div>
                        <button className="close-btn" onClick={toggleAssistant}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="voice-content">
                        {transcript && (
                            <div className="chat-bubble user">
                                <MessageSquare size={14} className="bubble-icon" />
                                <p>{transcript}</p>
                            </div>
                        )}
                        
                        {isProcessing && (
                            <div className="processing-indicator">
                                <Loader2 className="spin" size={20} />
                                <span>Thinking...</span>
                            </div>
                        )}

                        {response && (
                            <div className="chat-bubble ai">
                                <Volume2 size={14} className="bubble-icon" />
                                <p>{response}</p>
                            </div>
                        )}

                        {error && <div className="voice-error">{error}</div>}
                        
                        {!transcript && !isProcessing && !response && (
                            <div className="voice-prompt">
                                <p>Ask me anything about the college portal!</p>
                            </div>
                        )}
                    </div>

                    <div className="voice-footer">
                        <button 
                            className={`mic-trigger ${isRecording ? 'active' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                        >
                            {isRecording ? <Square size={24} fill="white" /> : <Mic size={24} />}
                            <div className="mic-rings">
                                <div></div>
                                <div></div>
                            </div>
                        </button>
                        <p className="mic-hint">
                            {isRecording ? 'Click to stop' : 'Click to start'}
                        </p>
                    </div>
                </div>
            )}

            {/* The Floating Button */}
            <button 
                className={`voice-fab ${isOpen ? 'active' : ''}`} 
                onClick={toggleAssistant}
                id="voice-assistant-trigger"
            >
                {isOpen ? <X size={28} /> : <Mic size={28} />}
            </button>
        </div>
    );
};

export default VoiceAssistant;
