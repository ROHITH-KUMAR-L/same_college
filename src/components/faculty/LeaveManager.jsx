import { ref, onValue, push, set, update } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';
import { Zap, ShieldCheck, Info } from 'lucide-react';

export default function LeaveManager() {
    const { user } = useAuthContext();
    const [leaves, setLeaves] = useState([]);
    
    // Form state
    const [reason, setReason] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reasonInput, setReasonInput] = useState('');
    const [studentLeaves, setStudentLeaves] = useState([]);
    const [viewMode, setViewMode] = useState('apply'); // 'apply' or 'review'

    useEffect(() => {
        const studentLeavesRef = ref(database, 'admin_leaves');
        const unsub = onValue(studentLeavesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setStudentLeaves(list.reverse());
            }
        });
        return () => unsub();
    }, []);

    const handleActionStudentLeave = (leaveId, studentUid, newStatus) => {
        const updates = {};
        updates[`admin_leaves/${leaveId}/status`] = newStatus;
        updates[`users/${studentUid}/leaves/${leaveId}/status`] = newStatus;
        update(ref(database), updates);
    };
        if (!user) return;

        const leavesRef = ref(database, `faculty_leaves/${user.uid}`);
        const unsubscribe = onValue(leavesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const leavesList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                // Sort by timestamp descending
                setLeaves(leavesList.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setLeaves([]);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        if (!fromDate || !toDate || !reason) return;

        const newLeaveRef = push(ref(database, `faculty_leaves/${user.uid}`));
        await set(newLeaveRef, {
            type: leaveType,
            fromDate,
            toDate,
            reason,
            status: 'Pending',
            timestamp: Date.now()
        });

        // Reset form
        setLeaveType('Casual Leave');
        setFromDate('');
        setToDate('');
        setReason('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                    onClick={() => setViewMode('apply')}
                    style={{ 
                        background: viewMode === 'apply' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: viewMode === 'apply' ? 'black' : 'white',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    Apply for Personal Leave
                </button>
                <button 
                    onClick={() => setViewMode('review')}
                    style={{ 
                        background: viewMode === 'review' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: viewMode === 'review' ? 'black' : 'white',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    Review Student Leaves <span style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{studentLeaves.filter(l => l.status !== 'Approved' && l.status !== 'Rejected').length}</span>
                </button>
            </div>

            {viewMode === 'apply' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>Apply for Leave</h2>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleApplyLeave}>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Leave Type</label>
                        <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
                        >
                            <option>Casual Leave</option>
                            <option>Medical Leave</option>
                            <option>Earned Leave</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>From Date</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                required
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} 
                            />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>To Date</label>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                required
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} 
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Reason</label>
                        <textarea 
                            rows="4" 
                            placeholder="Enter reason for leave..." 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none', resize: 'none' }}
                        ></textarea>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '0.5rem' }}>Submit Application</button>
                </form>
            </div>

            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>Leave Status Tracking</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {leaves.map(leave => (
                        <div key={leave.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>{leave.type}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{leave.fromDate} to {leave.toDate}</div>
                            </div>
                            {leave.status === 'Pending' && (
                                <div style={{ background: 'rgba(253, 224, 71, 0.2)', color: 'var(--accent-color)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} /> Pending
                                </div>
                            )}
                            {leave.status === 'Approved' && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle size={12} /> Approved
                                </div>
                            )}
                            {leave.status === 'Rejected' && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <XCircle size={12} /> Rejected
                                </div>
                            )}
                        </div>
                    ))}
                    {leaves.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No leave applications found.</div>}
                </div>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ShieldCheck size={24} color="var(--accent-color)" /> Student Leave Approval Portal
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {studentLeaves.length > 0 ? studentLeaves.map(leave => (
                            <div key={leave.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.8rem' }}>
                                            {leave.studentName?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>{leave.studentName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.type}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '900', padding: '0.2rem 0.5rem', borderRadius: '6px', background: leave.status === 'Approved' ? '#22c55e' : leave.status === 'Rejected' ? '#ef4444' : 'rgba(253, 224, 71, 0.2)', color: leave.status === 'Approved' || leave.status === 'Rejected' ? 'white' : 'var(--accent-color)', textTransform: 'uppercase' }}>
                                            {leave.status}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'white', margin: '1rem 0', lineHeight: '1.5' }}>"{leave.reason}"</p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Duration: <strong>{leave.from}</strong> to <strong>{leave.to}</strong>
                                </div>

                                {leave.aiReasoning && (
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                                            <Zap size={14} color="var(--accent-color)" />
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase' }}>AI Analysis (Score: {leave.aiScore}%)</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{leave.aiReasoning}</p>
                                    </div>
                                )}

                                {leave.status !== 'Approved' && leave.status !== 'Rejected' && (
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleActionStudentLeave(leave.id, leave.uid, 'Approved')}>Approve</button>
                                        <button className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleActionStudentLeave(leave.id, leave.uid, 'Rejected')}>Reject</button>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.1)', gridColumn: '1 / -1' }}>
                                <Info size={48} style={{ marginBottom: '1rem' }} />
                                <p>No student leave applications found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
