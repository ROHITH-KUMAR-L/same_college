import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, BarChart2, PlayCircle, StopCircle, Download, Users, Loader } from 'lucide-react';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../../firebase';

export default function AttendanceManager() {
    const [activeTab, setActiveTab] = useState('qr');
    const subjects = [
        { code: 'CS302', name: 'Database Systems' },
        { code: 'CS401', name: 'Software Engineering' },
        { code: 'CS303', name: 'Computer Networks' },
        { code: 'CS402', name: 'Web Programming' }
    ];

    const [selectedCourse, setSelectedCourse] = useState(subjects[0].code);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    
    // Real students fetched from Firebase
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    
    // Attendance state
    const [presentStudents, setPresentStudents] = useState({});
    const [allAttendance, setAllAttendance] = useState({});
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch all students from Firebase (role === 'STUDENT')
    useEffect(() => {
        setLoadingStudents(true);
        const usersRef = ref(database, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const students = Object.keys(data)
                    .map(uid => ({ id: uid, ...data[uid] }))
                    .filter(u => u.role === 'STUDENT');
                setEnrolledStudents(students);
            } else {
                setEnrolledStudents([]);
            }
            setLoadingStudents(false);
        });
        return () => unsubscribe();
    }, []);

    // Listen for today's attendance and all attendance (for reports)
    useEffect(() => {
        const todayRef = ref(database, `attendance_records/${selectedCourse}/${today}`);
        const unsubToday = onValue(todayRef, (snapshot) => {
            setPresentStudents(snapshot.exists() ? snapshot.val() : {});
        });

        const allRef = ref(database, `attendance_records/${selectedCourse}`);
        const unsubAll = onValue(allRef, (snapshot) => {
            setAllAttendance(snapshot.exists() ? snapshot.val() : {});
        });

        return () => {
            unsubToday();
            unsubAll();
        };
    }, [selectedCourse, today]);

    const toggleSession = async () => {
        const sessionRef = ref(database, `attendance_sessions/${selectedCourse}`);
        if (isSessionActive) {
            await remove(sessionRef);
            setIsSessionActive(false);
            setSessionId(null);
        } else {
            // Get the faculty's current public IP — all students must share this IP (same network)
            let allowedIp = null;
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                allowedIp = ipData.ip;
            } catch {
                // If IP fetch fails, allow without IP restriction (fallback)
                console.warn('Could not fetch public IP. Session will start without IP lock.');
            }

            const newSessionId = Math.random().toString(36).substring(2, 15);
            await set(sessionRef, {
                sessionId: newSessionId,
                date: today,
                allowedIp,           // Students must share this public IP
                allowedIpLocked: !!allowedIp  // Flag to indicate IP lock is active
            });
            setSessionId(newSessionId);
            setIsSessionActive(true);
        }
    };

    const markPresent = (student) => {
        const refPath = ref(database, `attendance_records/${selectedCourse}/${today}/${student.id}`);
        set(refPath, {
            name: student.displayName || student.email,
            email: student.email,
            status: 'present',
            timestamp: Date.now()
        });
    };

    // Reports: compute percentages from real data
    const totalClassesHeld = Object.keys(allAttendance).length;
    const studentReports = enrolledStudents.map(student => {
        let classesAttended = 0;
        Object.keys(allAttendance).forEach(date => {
            if (allAttendance[date][student.id]) classesAttended++;
        });
        const percentage = totalClassesHeld === 0 ? 0 : Math.round((classesAttended / totalClassesHeld) * 100);
        return { ...student, classesAttended, percentage };
    });

    // Present count
    const presentCount = enrolledStudents.filter(s => !!presentStudents[s.id]).length;

    return (
        <div className="admin-card" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Attendance Management</h2>
                    {!loadingStudents && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Users size={14} /> {enrolledStudents.length} students enrolled
                        </p>
                    )}
                </div>
                <select
                    value={selectedCourse}
                    onChange={(e) => {
                        if (isSessionActive) toggleSession();
                        setSelectedCourse(e.target.value);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none' }}
                >
                    {subjects.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                </select>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                {['qr', 'manual', 'reports'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{ background: activeTab === tab ? 'var(--accent-color)' : 'transparent', color: activeTab === tab ? 'black' : 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {tab === 'manual' ? 'Live Monitoring' : tab === 'reports' ? 'Reports' : 'QR Code Marking'}
                    </button>
                ))}
            </div>

            {/* QR Tab */}
            {activeTab === 'qr' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    {isSessionActive ? (
                        <>
                            <div style={{ background: 'white', padding: '2rem', display: 'inline-block', borderRadius: '16px', marginBottom: '1.5rem' }}>
                                <QRCodeSVG value={`${window.location.origin}/mark-attendance?course=${selectedCourse}&session=${sessionId}`} size={256} />
                            </div>
                            <h3 style={{ color: '#22c55e', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Session Active — {subjects.find(s => s.code === selectedCourse)?.name}</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Students scan to instantly mark attendance for {selectedCourse}.</p>
                            
                            <button
                                onClick={toggleSession}
                                className="btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                            >
                                <StopCircle size={18} /> Stop Session & Clear QR
                            </button>
                        </>
                    ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', maxWidth: '500px', margin: '0 auto' }}>
                            <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>Initialize Session</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Select the subject to generate a secure attendance QR code.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)', 
                                        color: 'white', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        padding: '1rem', 
                                        borderRadius: '12px', 
                                        outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {subjects.map(s => (
                                        <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={toggleSession}
                                    className="btn-primary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1rem' }}
                                >
                                    <PlayCircle size={20} /> Generate QR Code
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Live Monitoring Tab */}
            {activeTab === 'manual' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                        <div>
                            <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Today's Roster — {today}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Updates in real-time as students scan the QR code.</p>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                            <span style={{ color: '#22c55e' }}>{presentCount}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}> / {enrolledStudents.length}</span>
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Loader size={32} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                            <p>Loading student roster...</p>
                        </div>
                    ) : enrolledStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <Users size={40} style={{ margin: '0 auto 1rem' }} />
                            <p>No students found in the database. Students must sign in at least once to appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {enrolledStudents.map(student => {
                                const isPresent = !!presentStudents[student.id];
                                const name = student.displayName || student.email?.split('@')[0];
                                return (
                                    <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: isPresent ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', border: isPresent ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <img src={student.photoURL || `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{student.email}</div>
                                            </div>
                                        </div>
                                        {isPresent ? (
                                            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                <CheckCircle size={16} /> Present
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => markPresent(student)}
                                                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                Mark Present
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Attendance Report — {selectedCourse}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Total classes held: <span style={{ color: 'white', fontWeight: 'bold' }}>{totalClassesHeld}</span></p>
                        </div>
                        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>

                    {loadingStudents ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Loader size={32} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                            <p>Loading student data...</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={{ padding: '1rem' }}>Student</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Attended / Total</th>
                                        <th style={{ padding: '1rem' }}>Attendance</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentReports.map(student => {
                                        const name = student.displayName || student.email?.split('@')[0];
                                        const color = student.percentage >= 75 ? '#22c55e' : student.percentage >= 50 ? 'var(--accent-color)' : '#ef4444';
                                        return (
                                            <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <img src={student.photoURL || `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{name}</div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{student.classesAttended} / {totalClassesHeld}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${student.percentage}%`, background: color, borderRadius: '999px', transition: 'width 0.5s ease' }}></div>
                                                        </div>
                                                        <span style={{ color, fontWeight: 'bold', fontSize: '0.85rem', minWidth: '40px', textAlign: 'right' }}>{student.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <span style={{ background: student.percentage >= 75 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {student.percentage >= 75 ? 'Safe' : 'Warning'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {enrolledStudents.length === 0 && (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No student records found.</div>
                            )}
                            {enrolledStudents.length > 0 && totalClassesHeld === 0 && (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance data yet. Start a session and have students scan the QR code!</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
