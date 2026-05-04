import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, UserPlus, Clock } from 'lucide-react';
import { ref, onValue, push, set, update } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';

export default function ScheduleManager() {
    const { user } = useAuthContext();
    const [schedule, setSchedule] = useState([]);
    const [requests, setRequests] = useState([]);
    
    // Form state
    const [subClass, setSubClass] = useState('');
    const [subFaculty, setSubFaculty] = useState('');

    useEffect(() => {
        if (!user) return;

        // Fetch Schedule (mocking data generation if empty for demo purposes)
        const scheduleRef = ref(database, `faculty_schedules/${user.uid}`);
        const unsubSchedule = onValue(scheduleRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setSchedule(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                // Seed mock data for demo
                const defaultSchedule = {
                    "class1": { time: "09:00 AM - 10:30 AM", course: "CS401 - Advanced ML", room: "L-402", color: "var(--accent-color)" },
                    "class2": { time: "11:30 AM - 01:00 PM", course: "CS302 - Database Systems", room: "Lab-12", color: "#3b82f6" },
                    "class3": { time: "02:00 PM - 03:30 PM", course: "CS205 - Software Architecture", room: "Online", color: "#ef4444" }
                };
                set(scheduleRef, defaultSchedule);
            }
        });

        // Fetch Substitute Requests
        const reqRef = ref(database, `substitute_requests`);
        const unsubReqs = onValue(reqRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const allReqs = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                // Filter requests intended for this user
                setRequests(allReqs.filter(r => r.targetEmail === user.email || r.targetEmail === 'anyone' || r.requesterUid === user.uid));
            } else {
                setRequests([]);
            }
        });

        return () => {
            unsubSchedule();
            unsubReqs();
        };
    }, [user]);

    const handleRequestSubstitute = async (e) => {
        e.preventDefault();
        if (!subClass || !subFaculty) return;

        const reqRef = push(ref(database, `substitute_requests`));
        await set(reqRef, {
            requesterUid: user.uid,
            requesterName: user.displayName || 'Unknown Faculty',
            targetEmail: subFaculty,
            className: subClass,
            status: 'pending',
            timestamp: Date.now()
        });

        setSubClass('');
        setSubFaculty('');
    };

    const handleRequestAction = async (reqId, action) => {
        const reqRef = ref(database, `substitute_requests/${reqId}`);
        await update(reqRef, { status: action });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>My Timetable</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {schedule.map(item => (
                        <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${item.color || 'white'}` }}>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{item.time}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.course} ({item.room})</div>
                        </div>
                    ))}
                    {schedule.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No schedule found.</div>}
                </div>
            </div>

            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>Substitute Management</h2>
                
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Request Substitute</h3>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleRequestSubstitute}>
                        <select 
                            value={subClass}
                            onChange={(e) => setSubClass(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
                            required
                        >
                            <option value="" disabled>Select Class</option>
                            {schedule.map(item => (
                                <option key={item.id} value={`${item.course} at ${item.time}`}>{item.course}</option>
                            ))}
                        </select>
                        <select 
                            value={subFaculty}
                            onChange={(e) => setSubFaculty(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
                            required
                        >
                            <option value="" disabled>Select Faculty</option>
                            <option value="dr.smith@example.com">Dr. John Smith</option>
                            <option value="prof.davis@example.com">Prof. Emily Davis</option>
                            <option value="anyone">Anyone Available</option>
                        </select>
                        <button className="btn-primary" style={{ width: '100%' }}>Send Request</button>
                    </form>
                </div>

                <div>
                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>My Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {requests.filter(r => r.requesterUid === user?.uid).map(req => (
                            <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>You requested {req.targetEmail}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{req.className}</div>
                                <div style={{ color: req.status === 'accepted' ? '#22c55e' : req.status === 'declined' ? '#ef4444' : 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    Status: {req.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Incoming Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {requests.filter(r => r.requesterUid !== user?.uid && r.status === 'pending').map(req => (
                            <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{req.requesterName} requested you</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{req.className}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleRequestAction(req.id, 'accepted')} style={{ flex: 1, background: '#22c55e', color: 'black', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                                    <button onClick={() => handleRequestAction(req.id, 'declined')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Decline</button>
                                </div>
                            </div>
                        ))}
                        {requests.filter(r => r.requesterUid !== user?.uid && r.status === 'pending').length === 0 && <div style={{ color: 'var(--text-muted)' }}>No incoming requests.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
