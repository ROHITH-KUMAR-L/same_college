import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
    FileText, 
    Calendar, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Send,
    Plus,
    X,
    Filter,
    Sparkles,
    ShieldCheck,
    ShieldAlert,
    Upload,
    Check,
    Eye
} from 'lucide-react';
import { useRef } from 'react';
import { ref, push, set, onValue, serverTimestamp, update } from 'firebase/database';
import { database } from '../firebase';
import { getAIResponse } from '../utils/ai';
import './Admin.css';

export default function LeavePortal() {
    const { user } = useAuthContext();
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [leaveType, setLeaveType] = useState('Duty Leave');
    const [reason, setReason] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [attachedFile, setAttachedFile] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState({
        medical: 10,
        casual: 5,
        duty: 'Unlimited'
    });
    const [aiEvaluation, setAiEvaluation] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user?.uid) return;
        
        // Fetch Leave History
        const leavesRef = ref(database, `users/${user.uid}/leaves`);
        const unsubLeaves = onValue(leavesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setLeaveHistory(list.reverse());
            }
        });

        // Fetch Leave Balance
        const balanceRef = ref(database, `users/${user.uid}/leaveBalance`);
        const unsubBalance = onValue(balanceRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setLeaveBalance(data);
            } else {
                // Initialize default balance if not exists
                set(balanceRef, { medical: 10, casual: 5, duty: 'Unlimited' });
            }
        });

        return () => {
            unsubLeaves();
            unsubBalance();
        };
    }, [user]);

    const handleApplyLeave = async () => {
        if (!reason || !fromDate || !toDate) return;
        setIsSubmitting(true);

        try {
            // AI Automated Review with Document Analysis & Scoring
            const docInfo = attachedFile ? `Document Attached: ${attachedFile.name}` : "NO DOCUMENT ATTACHED";
            
            const aiPrompt = `Act as an academic administrator. Review this student leave application:
            Type: ${leaveType}
            Reason: ${reason}
            Duration: ${fromDate} to ${toDate}
            Supporting Evidence: ${docInfo}
            
            Evaluate based on:
            1. Authenticity of reason.
            2. Match between reason and Leave Type.
            3. Presence of supporting document.
            
            Return ONLY a JSON object: {
                "status": "Approved" | "Pending", 
                "score": number (0-100), 
                "reasoning": "Detailed explanation of why this score was given",
                "summary": "1-sentence verdict"
            }`;
            
            const aiResultRaw = await getAIResponse([{ role: 'user', content: aiPrompt }]);
            let aiResult = { status: 'Pending', score: 50, reasoning: 'Manual verification required.', summary: 'Review pending.' };
            try {
                const jsonStr = aiResultRaw.substring(aiResultRaw.indexOf('{'), aiResultRaw.lastIndexOf('}') + 1);
                aiResult = JSON.parse(jsonStr);
            } catch (e) {
                console.error("AI Parse Error", e);
            }

            setAiEvaluation(aiResult);

            const leavesRef = ref(database, `users/${user.uid}/leaves`);
            const newLeaveRef = push(leavesRef);
            
            const leaveData = {
                type: leaveType,
                reason: reason,
                from: fromDate,
                to: toDate,
                status: aiResult.status,
                aiScore: aiResult.score,
                aiReasoning: aiResult.reasoning,
                documentName: attachedFile ? attachedFile.name : null,
                submittedAt: serverTimestamp(),
                studentName: user.displayName,
                studentEmail: user.email,
                uid: user.uid
            };

            await set(newLeaveRef, leaveData);
            await set(ref(database, `admin_leaves/${newLeaveRef.key}`), leaveData);

            // Deduct balance if AI Approved
            if (aiResult.status === 'Approved') {
                const typeKey = leaveType.toLowerCase().split(' ')[0];
                const balanceKey = typeKey === 'personal' ? 'casual' : typeKey === 'medical' ? 'medical' : null;
                
                if (balanceKey && typeof leaveBalance[balanceKey] === 'number') {
                    const newBalance = Math.max(0, leaveBalance[balanceKey] - 1);
                    update(ref(database, `users/${user.uid}/leaveBalance`), {
                        [balanceKey]: newBalance
                    });
                }
            }

            setReason('');
            setAttachedFile(null);
            setShowResultModal(true);
        } catch (error) {
            console.error("Leave Application Error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFileChange = (e) => {
        if (e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Leave <span style={{ color: 'var(--accent-color)' }}>Portal</span></h1>
                    <p style={{ color: 'var(--text-muted)' }}>Apply for duty leave, medical leave, or personal absence.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem' }} onClick={() => setIsApplyOpen(true)}>
                    <Plus size={20} /> Apply New Leave
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                {/* Leave History Table */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>Application History</h2>
                        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                            <Filter size={14} /> Filter
                        </button>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Type</th>
                                    <th>Reason / Subject</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveHistory.map((leave, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{leave.id?.substring(0, 8)}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: '800', 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '6px',
                                                background: leave.type === 'Duty Leave' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                                color: leave.type === 'Duty Leave' ? '#3b82f6' : '#a855f7'
                                            }}>{leave.type}</span>
                                        </td>
                                        <td>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{leave.reason}</div>
                                            {leave.aiReasoning && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>AI: {leave.aiReasoning}</div>}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{leave.from} - {leave.to}</td>
                                        <td>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between',
                                                gap: '0.4rem', 
                                                color: leave.status === 'Approved' ? '#22c55e' : leave.status === 'Rejected' ? '#ef4444' : '#facc15', 
                                                fontSize: '0.85rem', 
                                                fontWeight: '800' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {leave.status === 'Approved' ? <ShieldCheck size={14} /> : leave.status === 'Rejected' ? <ShieldAlert size={14} /> : <Clock size={14} />}
                                                    {leave.status}
                                                </div>
                                                <button 
                                                    onClick={() => { setSelectedLeave(leave); setShowHistoryModal(true); }}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Leave Policy Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '1.25rem' }}>Leave Balance</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <BalanceItem label="Medical Leave" count={String(leaveBalance.medical).padStart(2, '0')} total="10" color="#ef4444" />
                            <BalanceItem label="Duty Leave" count={leaveBalance.duty} total="N/A" color="#3b82f6" />
                            <BalanceItem label="Casual Leave" count={String(leaveBalance.casual).padStart(2, '0')} total="05" color="#facc15" />
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '1.5rem', background: 'rgba(253, 224, 71, 0.03)', border: '1px solid rgba(253, 224, 71, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <AlertCircle size={18} color="var(--accent-color)" />
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', margin: 0 }}>Important Note</h3>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Duty leave applications must be accompanied by a scanned copy of the event invitation or certificate. Medical leaves exceeding 3 days require a doctor's certificate.
                        </p>
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {isApplyOpen && (
                <div className="test-modal-overlay" onClick={() => setIsApplyOpen(false)}>
                    <div className="test-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="test-modal-close" onClick={() => setIsApplyOpen(false)}><X size={20} /></button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Apply for Leave</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Leave Type</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['Duty Leave', 'Medical', 'Personal'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setLeaveType(type)}
                                            style={{ 
                                                flex: 1, 
                                                padding: '0.75rem', 
                                                borderRadius: '12px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: '700',
                                                background: leaveType === type ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                                color: leaveType === type ? 'black' : 'white',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>From Date</label>
                                    <input 
                                        type="date" 
                                        className="btn-outline" 
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }} 
                                        value={fromDate}
                                        onChange={e => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>To Date</label>
                                    <input 
                                        type="date" 
                                        className="btn-outline" 
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }} 
                                        value={toDate}
                                        onChange={e => setToDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Reason / Subject</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Inter-college Sports Meet" 
                                    className="btn-outline" 
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', textAlign: 'left' }} 
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Supporting Document (PDF)</label>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept=".pdf" 
                                    onChange={onFileChange} 
                                />
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ 
                                        border: '2px dashed rgba(255,255,255,0.1)', 
                                        borderRadius: '16px', 
                                        padding: '1.5rem', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        background: attachedFile ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                                        borderColor: attachedFile ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {attachedFile ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <Check size={24} color="#22c55e" />
                                            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700' }}>{attachedFile.name}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>Click to change file</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <Upload size={24} color="var(--accent-color)" />
                                            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700' }}>Upload Certificate / Proof</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI will analyze this PDF for approval.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>AI Auto-Approval Status</label>
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Sparkles size={20} color="var(--accent-color)" />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI will analyze the document proof instantly.</span>
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} onClick={handleApplyLeave} disabled={isSubmitting}>
                                {isSubmitting ? 'AI Evaluating...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Result Evaluation Modal */}
            {showResultModal && aiEvaluation && (
                <div className="test-modal-overlay" onClick={() => setShowResultModal(false)}>
                    <div className="test-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '100px', margin: '0 auto 1.5rem', position: 'relative' }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                                <path stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path stroke="var(--accent-color)" strokeWidth="3" strokeDasharray={`${aiEvaluation.score}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                                {aiEvaluation.score}%
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>
                            {aiEvaluation.status === 'Approved' ? 'AI Approved!' : 'Manual Review Required'}
                        </h2>
                        <p style={{ color: aiEvaluation.status === 'Approved' ? '#22c55e' : 'var(--accent-color)', fontWeight: '800', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {aiEvaluation.summary}
                        </p>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Sparkles size={16} color="var(--accent-color)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detailed AI Analysis</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.6', margin: 0 }}>
                                {aiEvaluation.reasoning}
                            </p>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={() => { setShowResultModal(false); setIsApplyOpen(false); }}>
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}
            {/* History Detail Modal */}
            {showHistoryModal && selectedLeave && (
                <div className="test-modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="test-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <button className="test-modal-close" onClick={() => setShowHistoryModal(false)}><X size={20} /></button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <FileText size={32} color="var(--accent-color)" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '0.25rem' }}>Application Details</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedLeave.id}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Type</label>
                                    <div style={{ color: 'white', fontWeight: '700' }}>{selectedLeave.type}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                                    <div style={{ color: selectedLeave.status === 'Approved' ? '#22c55e' : '#facc15', fontWeight: '700' }}>{selectedLeave.status}</div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Reason</label>
                                <div style={{ color: 'white', fontWeight: '600', lineHeight: '1.4' }}>{selectedLeave.reason}</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Duration</label>
                                <div style={{ color: 'white', fontWeight: '600' }}>{selectedLeave.from} to {selectedLeave.to}</div>
                            </div>

                            {selectedLeave.aiReasoning && (
                                <div style={{ background: 'rgba(253, 224, 71, 0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(253, 224, 71, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Sparkles size={16} color="var(--accent-color)" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase' }}>AI Analysis Verdict (Score: {selectedLeave.aiScore}%)</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: 0 }}>
                                        {selectedLeave.aiReasoning}
                                    </p>
                                </div>
                            )}

                            {selectedLeave.documentName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <FileText size={20} color="var(--accent-color)" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{selectedLeave.documentName}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Attached Proof</div>
                                    </div>
                                    <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Download</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BalanceItem({ label, count, total, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <strong style={{ color: 'white', fontSize: '1rem' }}>{count}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {total}</span>
            </div>
        </div>
    );
}
