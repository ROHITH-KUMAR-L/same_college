import { useState, useEffect } from 'react';
import { Calendar, UserPlus, CheckCircle, XCircle, Clock, Send, Loader } from 'lucide-react';
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

export default function ScheduleManager() {
    const { user } = useAuthContext();
    const [schedule, setSchedule] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [myRequests, setMyRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [subClass, setSubClass] = useState('');
    const [subFaculty, setSubFaculty] = useState('');

    useEffect(() => {
        if (!user) return;

        // Fetch/seed schedule
        const scheduleRef = ref(database, `faculty_schedules/${user.uid}`);
        const unsubSchedule = onValue(scheduleRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setSchedule(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                // Seed demo schedule on first load
                const defaultSchedule = {
                    class1: { time: '09:00 AM – 10:30 AM', course: 'CS401 - Advanced ML',        room: 'L-402',  color: 'var(--accent-color)' },
                    class2: { time: '11:30 AM – 01:00 PM', course: 'CS302 - Database Systems',    room: 'Lab-12', color: '#3b82f6' },
                    class3: { time: '02:00 PM – 03:30 PM', course: 'CS205 - Software Architecture', room: 'Online', color: '#a855f7' }
                };
                set(scheduleRef, defaultSchedule);
            }
            setLoadingSchedule(false);
        });

        // Substitute requests
        const reqRef = ref(database, 'substitute_requests');
        const unsubReqs = onValue(reqRef, (snapshot) => {
            if (!snapshot.exists()) { setMyRequests([]); setIncomingRequests([]); return; }
            const data = snapshot.val();
            const all = Object.keys(data).map(k => ({ id: k, ...data[k] }))
                              .sort((a, b) => b.timestamp - a.timestamp);
            setMyRequests(all.filter(r => r.requesterUid === user.uid));
            setIncomingRequests(all.filter(r => r.requesterUid !== user.uid && (r.targetEmail === user.email || r.targetEmail === 'anyone') && r.status === 'pending'));
        });

        return () => { unsubSchedule(); unsubReqs(); };
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subClass || !subFaculty) return;
        setSubmitting(true);
        const reqRef = push(ref(database, 'substitute_requests'));
        await set(reqRef, {
            requesterUid: user.uid,
            requesterName: user.displayName || user.email,
            targetEmail: subFaculty,
            className: subClass,
            status: 'pending',
            timestamp: Date.now()
        });
        setSubClass('');
        setSubFaculty('');
        setSubmitting(false);
    };

    const handleAction = async (reqId, action) => {
        await update(ref(database, `substitute_requests/${reqId}`), { status: action });
    };

    const statusBadge = (status) => {
        const map = {
            pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Pending' },
            accepted: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Accepted' },
            declined: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Declined' }
        };
        const s = map[status] || map.pending;
        return <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>{s.label}</span>;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

            {/* Left: Timetable */}
            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} color="var(--accent-color)" /> My Timetable
                </h2>
                {loadingSchedule ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Loader size={28} style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
                        <p>Loading schedule...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {schedule.map(item => (
                            <div key={item.id} style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: `4px solid ${item.color || 'var(--accent-color)'}`,
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderLeftWidth: '4px'
                            }}>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.course}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.time} &nbsp;•&nbsp; {item.room}</div>
                            </div>
                        ))}
                        {schedule.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No schedule data found.</p>}
                    </div>
                )}
            </div>

            {/* Right: Substitute management */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Request form */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={18} color="var(--accent-color)" /> Request Substitute
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Select Class</label>
                            <select value={subClass} onChange={e => setSubClass(e.target.value)} required style={inputStyle}>
                                <option value="" disabled>Choose a class…</option>
                                {schedule.map(item => (
                                    <option key={item.id} value={`${item.course} at ${item.time}`}>{item.course}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Request Faculty</label>
                            <select value={subFaculty} onChange={e => setSubFaculty(e.target.value)} required style={inputStyle}>
                                <option value="" disabled>Choose faculty…</option>
                                <option value="dr.smith@example.com">Dr. John Smith</option>
                                <option value="prof.davis@example.com">Prof. Emily Davis</option>
                                <option value="anyone">Anyone Available</option>
                            </select>
                        </div>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={submitting}>
                            {submitting ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                            {submitting ? 'Sending…' : 'Send Request'}
                        </button>
                    </form>
                </div>

                {/* Incoming requests */}
                {incomingRequests.length > 0 && (
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Incoming Requests
                            <span style={{ background: '#f59e0b', color: 'black', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>{incomingRequests.length}</span>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {incomingRequests.map(req => (
                                <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{req.requesterName}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{req.className}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleAction(req.id, 'accepted')} style={{ flex: 1, background: '#22c55e', color: 'black', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            <CheckCircle size={14} /> Accept
                                        </button>
                                        <button onClick={() => handleAction(req.id, 'declined')} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            <XCircle size={14} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My sent requests */}
                {myRequests.length > 0 && (
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>My Sent Requests</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {myRequests.map(req => (
                                <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>{req.className?.split(' at ')[0]}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→ {req.targetEmail}</div>
                                    </div>
                                    {statusBadge(req.status)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
