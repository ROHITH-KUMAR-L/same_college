import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Send, Loader, ShieldCheck, Info, Sparkles, Zap, Eye, X } from 'lucide-react';
import { ref, onValue, push, set, update } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
};

const labelStyle = {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '0.5rem'
};

function StatusBadge({ status }) {
    const map = {
        Pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <Clock size={11} /> },
        Approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle size={11} /> },
        Rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <XCircle size={11} /> }
    };
    const s = map[status] || map.Pending;
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: s.bg, color: s.color, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
            {s.icon} {status}
        </div>
    );
}

export default function LeaveManager() {
    const { user } = useAuthContext();

    // View state
    const [viewMode, setViewMode] = useState('apply'); // 'apply' | 'review'

    // Faculty own leaves
    const [leaves, setLeaves] = useState([]);
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Student leaves
    const [studentLeaves, setStudentLeaves] = useState([]);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Faculty own leaves
        const facRef = ref(database, `faculty_leaves/${user.uid}`);
        const unsubFac = onValue(facRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setLeaves(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setLeaves([]);
            }
        });

        // Student leaves from admin_leaves node
        const stuRef = ref(database, 'admin_leaves');
        const unsubStu = onValue(stuRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setStudentLeaves(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.submittedAt - a.submittedAt));
            } else {
                setStudentLeaves([]);
            }
        });

        return () => { unsubFac(); unsubStu(); };
    }, [user]);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!fromDate || !toDate || !reason) return;
        setSubmitting(true);
        const newRef = push(ref(database, `faculty_leaves/${user.uid}`));
        await set(newRef, { type: leaveType, fromDate, toDate, reason, status: 'Pending', timestamp: Date.now() });
        setLeaveType('Casual Leave');
        setFromDate('');
        setToDate('');
        setReason('');
        setSubmitting(false);
    };

    const handleAction = async (leaveId, studentUid, newStatus) => {
        const updates = {};
        updates[`admin_leaves/${leaveId}/status`] = newStatus;
        if (studentUid) updates[`users/${studentUid}/leaves/${leaveId}/status`] = newStatus;
        await update(ref(database), updates);
        if (showModal) setShowModal(false);
    };

    const pendingCount = studentLeaves.filter(l => l.status === 'Pending').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={() => setViewMode('apply')}
                    className={viewMode === 'apply' ? 'btn-primary' : 'btn-outline'}
                    style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
                >
                    My Leave Applications
                </button>
                <button
                    onClick={() => setViewMode('review')}
                    style={{
                        background: viewMode === 'review' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: viewMode === 'review' ? 'black' : 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.6rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}
                >
                    Review Student Leaves
                    {pendingCount > 0 && (
                        <span style={{ background: viewMode === 'review' ? 'rgba(0,0,0,0.25)' : '#f59e0b', color: viewMode === 'review' ? 'black' : 'black', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ─── FACULTY OWN LEAVE ─── */}
            {viewMode === 'apply' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Apply form */}
                    <div className="admin-card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>Apply for Leave</h2>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={labelStyle}>Leave Type</label>
                                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={inputStyle}>
                                    <option>Casual Leave</option>
                                    <option>Medical Leave</option>
                                    <option>Earned Leave</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>From Date</label>
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>To Date</label>
                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Reason</label>
                                <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} required placeholder="State your reason…" style={{ ...inputStyle, resize: 'none' }} />
                            </div>
                            <button className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Send size={16} /> Submit Application</>}
                            </button>
                        </form>
                    </div>

                    {/* Own leave history */}
                    <div className="admin-card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>My Applications</h2>
                        {leaves.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <Clock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.85rem' }}>No leave applications yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {leaves.map(leave => (
                                    <div key={leave.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{leave.type}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{leave.fromDate} → {leave.toDate}</div>
                                        </div>
                                        <StatusBadge status={leave.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── STUDENT LEAVES REVIEW ─── */}
            {viewMode === 'review' && (
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <ShieldCheck size={22} color="var(--accent-color)" /> Student Leave Requests
                        </h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{studentLeaves.length} total · <span style={{ color: '#f59e0b', fontWeight: '700' }}>{pendingCount} pending</span></div>
                    </div>

                    {studentLeaves.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            <Info size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                            <p>No student leave applications yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                            {studentLeaves.map(leave => (
                                <div key={leave.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${leave.status === 'Approved' ? 'rgba(34,197,94,0.2)' : leave.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Student info */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-color)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem', flexShrink: 0 }}>
                                                {leave.studentName?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{leave.studentName || 'Unknown Student'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{leave.type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <StatusBadge status={leave.status || 'Pending'} />
                                            <button onClick={() => { setSelectedLeave(leave); setShowModal(true); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: 0, borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '0.75rem' }}>
                                        "{leave.reason}"
                                    </p>

                                    {/* Duration */}
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {leave.from} → {leave.to}
                                        {leave.documentName && <span style={{ marginLeft: '0.5rem', color: 'var(--accent-color)' }}>📎 {leave.documentName}</span>}
                                    </div>

                                    {/* AI Summary */}
                                    {leave.aiReasoning && (
                                        <div style={{ background: 'rgba(253,224,71,0.04)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(253,224,71,0.1)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                                                <Sparkles size={12} color="var(--accent-color)" />
                                                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase' }}>AI Analysis · {leave.aiScore}% Confidence</span>
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '1.5' }}>{leave.aiReasoning}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {leave.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                                            <button
                                                onClick={() => handleAction(leave.id, leave.uid, 'Approved')}
                                                className="btn-primary"
                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                            >
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(leave.id, leave.uid, 'Rejected')}
                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {showModal && selectedLeave && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }} onClick={() => setShowModal(false)}>
                    <div className="admin-card" style={{ padding: '2rem', maxWidth: '480px', width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-color)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontWeight: '900', fontSize: '1.25rem' }}>
                                {selectedLeave.studentName?.charAt(0).toUpperCase()}
                            </div>
                            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>{selectedLeave.studentName}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedLeave.studentEmail}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <InfoBox label="Leave Type" value={selectedLeave.type} />
                                <InfoBox label="Status" value={selectedLeave.status} highlight={selectedLeave.status === 'Approved' ? '#22c55e' : selectedLeave.status === 'Rejected' ? '#ef4444' : '#f59e0b'} />
                                <InfoBox label="From" value={selectedLeave.from} />
                                <InfoBox label="To" value={selectedLeave.to} />
                            </div>
                            <InfoBox label="Reason" value={selectedLeave.reason} />

                            {selectedLeave.aiReasoning && (
                                <div style={{ background: 'rgba(253,224,71,0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(253,224,71,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Zap size={14} color="var(--accent-color)" />
                                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase' }}>AI Verdict · Score: {selectedLeave.aiScore}%</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: 0 }}>{selectedLeave.aiReasoning}</p>
                                </div>
                            )}

                            {selectedLeave.documentName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ color: 'var(--accent-color)', fontSize: '1.25rem' }}>📎</span>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>{selectedLeave.documentName}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Supporting document (name only — no file stored)</div>
                                    </div>
                                </div>
                            )}

                            {selectedLeave.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button onClick={() => handleAction(selectedLeave.id, selectedLeave.uid, 'Approved')} className="btn-primary" style={{ flex: 1, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button onClick={() => handleAction(selectedLeave.id, selectedLeave.uid, 'Rejected')} style={{ flex: 1, padding: '0.85rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoBox({ label, value, highlight }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ color: highlight || 'white', fontWeight: '700', fontSize: '0.9rem' }}>{value}</div>
        </div>
    );
}
