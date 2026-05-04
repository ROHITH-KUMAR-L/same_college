import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';

export default function LeaveManager() {
    const { user } = useAuthContext();
    const [leaves, setLeaves] = useState([]);
    
    // Form state
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
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
        </div>
    );
}
