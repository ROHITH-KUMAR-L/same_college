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
    MessageSquare
} from 'lucide-react';
import './Admin.css';

export default function StudyAssistant() {
    const { user } = useAuthContext();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Same College AI Study Assistant. Upload your notes or ask me anything about your courses." }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const newMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            let aiResponse = "I've analyzed your request. Based on the Computer Science syllabus, here's a summary of that concept...";
            if (input.toLowerCase().includes('quiz')) {
                aiResponse = "Sure! Let's start a quick quiz on Database Systems. Question 1: What is the primary difference between a Primary Key and a Unique Key?";
            } else if (input.toLowerCase().includes('summarize')) {
                aiResponse = "I've summarized the 'Transaction Management' chapter. It covers Atomicity, Consistency, Isolation, and Durability (ACID properties). Would you like to deep dive into one of these?";
            }
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        }, 1000);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                        <BrainCircuit size={28} color="var(--accent-color)" />
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>AI Study Assistant</h2>
                            <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700' }}>● Online & Ready to Help</span>
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
                        <div 
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem 1rem', textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => setIsUploading(true)}
                        >
                            <FileText size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: '0.75rem' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Upload PDF/Notes to ground the AI in your course material.</p>
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
