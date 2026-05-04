import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
    Send, 
    Mic, 
    MicOff, 
    Upload, 
    FileText, 
    BrainCircuit, 
    Sparkles, 
    BookOpen, 
    PlayCircle,
    X,
    ChevronRight,
    MessageSquare,
    Zap,
    Cpu,
    CheckCircle
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { getAIResponse } from '../utils/ai';
import './Admin.css';

export default function StudyAssistant() {
    const { user } = useAuthContext();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Same College AI Study Assistant powered by Groq & Ollama. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [useOllama, setUseOllama] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [workspaceResources, setWorkspaceResources] = useState([]);
    const [attachedContext, setAttachedContext] = useState(null);
    const [attachedFileName, setAttachedFileName] = useState("");
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    // Fetch workspace resources
    useEffect(() => {
        const resourcesRef = ref(database, 'resources/notes');
        const unsubscribe = onValue(resourcesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setWorkspaceResources(list);
            }
        });
        return () => unsubscribe();
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare context
            const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
            let fullInput = input;
            if (attachedContext) {
                fullInput = `Context from document "${attachedFileName}":\n${attachedContext}\n\nUser Question: ${input}`;
            }

            const response = await getAIResponse([...history, { role: 'user', content: fullInput }], useOllama);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setAttachedFileName(file.name);
        setIsUploading(true);
        
        // Simulate extraction (In real app, use PDF.js)
        setTimeout(() => {
            setAttachedContext(`Summary of uploaded PDF (${file.name}): This document appears to be related to academic notes. It contains key terms like "Engineering", "Syllabus", and "Learning Modules".`);
            setIsUploading(false);
            setMessages(prev => [...prev, { role: 'assistant', content: `I've indexed "${file.name}". You can now ask questions specifically about its content!` }]);
        }, 1500);
    };

    const attachWorkspaceResource = (res) => {
        setAttachedFileName(res.title);
        setAttachedContext(`Content from Workspace Resource "${res.title}": ${res.description || ''}. File type: ${res.type}. Subject: ${res.subject}.`);
        setMessages(prev => [...prev, { role: 'assistant', content: `Linked with "${res.title}" from your resources. I'm grounding my answers in this material.` }]);
    };

    const toggleListening = () => {
        setIsListening(!isListening);
        // In a real app, integrate Web Speech API here
    };

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '5rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                
                {/* Chat Area */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BrainCircuit size={28} color="var(--accent-color)" />
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>AI Study Assistant</h2>
                                <span style={{ fontSize: '0.75rem', color: isTyping ? 'var(--accent-color)' : '#22c55e', fontWeight: '700' }}>
                                    {isTyping ? '● AI is thinking...' : '● Online & Ready'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Model Selector */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button 
                                onClick={() => setUseOllama(false)}
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', background: !useOllama ? 'var(--accent-color)' : 'transparent', color: !useOllama ? 'black' : 'var(--text-muted)', border: 'none', transition: 'all 0.2s' }}
                            >
                                GROQ
                            </button>
                            <button 
                                onClick={() => setUseOllama(true)}
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', background: useOllama ? 'var(--accent-color)' : 'transparent', color: useOllama ? 'black' : 'var(--text-muted)', border: 'none', transition: 'all 0.2s' }}
                            >
                                OLLAMA
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }} className="custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                color: msg.role === 'user' ? 'black' : 'white',
                                padding: '1rem 1.25rem',
                                borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Ask about concepts, request a quiz, or summarize notes..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem 3.5rem 1rem 1.25rem', color: 'white', fontSize: '0.95rem' }}
                            />
                            <button 
                                onClick={toggleListening}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isListening ? '#ef4444' : 'var(--text-muted)' }}
                            >
                                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                        </div>
                        <button className="btn-primary" onClick={handleSend} style={{ borderRadius: '16px', padding: '1rem' }}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>

                {/* Sidebar Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Material Upload */}
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <Upload size={18} color="var(--accent-color)" />
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0 }}>Knowledge Base</h3>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileUpload}
                        />
                        {attachedFileName ? (
                            <div style={{ background: 'rgba(253, 224, 71, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                    <CheckCircle size={16} color="var(--accent-color)" />
                                    <span style={{ fontSize: '0.8rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachedFileName}</span>
                                </div>
                                <button onClick={() => { setAttachedFileName(""); setAttachedContext(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div 
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer' }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <FileText size={24} color="rgba(255,255,255,0.2)" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Click to upload PDF/Notes</p>
                            </div>
                        )}
                    </div>

                    {/* Workspace Resources */}
                    <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0 }}>Workspace Resources</h3>
                        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="custom-scrollbar">
                            {workspaceResources.length > 0 ? workspaceResources.map(res => (
                                <div 
                                    key={res.id} 
                                    onClick={() => attachWorkspaceResource(res)}
                                    style={{ 
                                        padding: '0.75rem', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        borderRadius: '12px', 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s'
                                    }}
                                    className="tool-item-hover"
                                >
                                    {res.title}
                                </div>
                            )) : (
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>No resources found</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '1.25rem' }}>Quick Study Tools</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <ToolItem icon={<Sparkles size={16} />} title="Generate Mock Test" />
                            <ToolItem icon={<BookOpen size={16} />} title="Syllabus Breakdown" />
                            <ToolItem icon={<PlayCircle size={16} />} title="Concept Visualizer" />
                        </div>
                    </div>

                    {/* Active Topics */}
                    <div className="admin-card" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '1.25rem' }}>Active Learning Topics</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span className="premium-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>Normalization</span>
                            <span className="premium-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)' }}>SQL Joins</span>
                            <span className="premium-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>ER Modeling</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal Overlay */}
            {isUploading && (
                <div className="test-modal-overlay" onClick={() => setIsUploading(false)}>
                    <div className="test-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <button className="test-modal-close" onClick={() => setIsUploading(false)}><X size={20} /></button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Upload Study Material</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Our AI will index your PDF/Text notes to provide accurate, source-grounded answers.</p>
                        
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed var(--accent-color)', borderRadius: '20px', padding: '3rem 1rem', textAlign: 'center' }}>
                            <Upload size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Select Files</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supported: PDF, DOCX, TXT (Max 20MB)</p>
                        </div>
                        
                        <button className="btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }} onClick={() => setIsUploading(false)}>
                            Start Indexing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToolItem({ icon, title }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }} className="tool-item-hover">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-color)' }}>{icon}</div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>{title}</span>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
        </div>
    );
}
