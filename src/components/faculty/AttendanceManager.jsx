import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, BarChart2, PlayCircle, StopCircle, Download } from 'lucide-react';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../../firebase';

export default function AttendanceManager() {
    const [activeTab, setActiveTab] = useState('qr');
    const [selectedCourse, setSelectedCourse] = useState('CS401');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [presentStudents, setPresentStudents] = useState({});
    const [allAttendance, setAllAttendance] = useState({});
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Mock student list for the course
    const enrolledStudents = [
        { id: 'uid123', name: 'Alex Johnson' },
        { id: 'uid456', name: 'Sarah Miller' },
        { id: 'uid789', name: 'John Doe' }
    ];

    useEffect(() => {
        // Listen for real-time attendance updates for today
        const attendanceRef = ref(database, `attendance_records/${selectedCourse}/${today}`);
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                setPresentStudents(snapshot.val());
            } else {
                setPresentStudents({});
            }
        });

        // Listen for all attendance for reports
        const allRef = ref(database, `attendance_records/${selectedCourse}`);
        const unsubAll = onValue(allRef, (snapshot) => {
            if (snapshot.exists()) {
                setAllAttendance(snapshot.val());
            } else {
                setAllAttendance({});
            }
        });

        return () => {
            unsubscribe();
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
            const newSessionId = Math.random().toString(36).substring(2, 15);
            await set(sessionRef, {
                sessionId: newSessionId,
                date: today
            });
            setSessionId(newSessionId);
            setIsSessionActive(true);
        }
    };

    // Calculate reports
    const totalClassesHeld = Object.keys(allAttendance).length;
    const studentReports = enrolledStudents.map(student => {
        let classesAttended = 0;
        Object.keys(allAttendance).forEach(date => {
            if (allAttendance[date][student.id] || Object.values(allAttendance[date]).some(s => s.name === student.name)) {
                classesAttended++;
            }
        });
        const percentage = totalClassesHeld === 0 ? 0 : Math.round((classesAttended / totalClassesHeld) * 100);
        return { ...student, classesAttended, percentage };
    });

    return (
        <div className="admin-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Attendance Management</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => {
                            if(isSessionActive) toggleSession(); // Stop session on course change
                            setSelectedCourse(e.target.value);
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none' }}
                    >
                        <option value="CS401">CS401 - Advanced ML</option>
                        <option value="CS302">CS302 - Database Systems</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setActiveTab('qr')} style={{ background: activeTab === 'qr' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'qr' ? 'black' : 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    QR Code Marking
                </button>
                <button onClick={() => setActiveTab('manual')} style={{ background: activeTab === 'manual' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'manual' ? 'black' : 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Live Monitoring / Manual
                </button>
                <button onClick={() => setActiveTab('reports')} style={{ background: activeTab === 'reports' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'reports' ? 'black' : 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Reports
                </button>
            </div>

            {activeTab === 'qr' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <button 
                        onClick={toggleSession}
                        className={isSessionActive ? "btn-outline" : "btn-primary"}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto 2rem' }}
                    >
                        {isSessionActive ? <><StopCircle size={18} /> Stop Session</> : <><PlayCircle size={18} /> Start Session</>}
                    </button>

                    {isSessionActive ? (
                        <>
                            <div style={{ background: 'white', padding: '2rem', display: 'inline-block', borderRadius: '16px', marginBottom: '1.5rem', animation: 'fadeIn 0.5s' }}>
                                <QRCodeSVG value={`${window.location.origin}/mark-attendance?course=${selectedCourse}&session=${sessionId}`} size={256} />
                            </div>
                            <h3 style={{ color: '#22c55e', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Session Active: {selectedCourse}</h3>
                            <p style={{ color: 'white' }}>Students scan to mark attendance instantly.</p>
                        </>
                    ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Active Session</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Start a session to generate the live QR code.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'manual' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
                        <div>
                            <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Today's Roster: {today}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>List updates in real-time as students scan.</p>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                            <span style={{ color: '#22c55e' }}>{Object.keys(presentStudents).length}</span> / {enrolledStudents.length}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {enrolledStudents.map(student => {
                            const isPresent = !!presentStudents[student.id] || Object.values(presentStudents).some(s => s.name === student.name);
                            return (
                                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: isPresent ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: isPresent ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{student.name}</span>
                                    <div>
                                        {isPresent ? (
                                            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                <CheckCircle size={18} /> Present
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    const refPath = ref(database, `attendance_records/${selectedCourse}/${today}/${student.id}`);
                                                    set(refPath, { name: student.name, status: 'present', timestamp: Date.now() });
                                                }}
                                                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                Mark Present
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Attendance Reports: {selectedCourse}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Total Classes Held: <span style={{ color: 'white', fontWeight: 'bold' }}>{totalClassesHeld}</span></p>
                        </div>
                        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem' }}>Student Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Classes Attended</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Percentage</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentReports.map(student => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>{student.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{student.classesAttended} / {totalClassesHeld}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ color: student.percentage >= 75 ? '#22c55e' : student.percentage >= 50 ? 'var(--accent-color)' : '#ef4444', fontWeight: 'bold' }}>
                                                {student.percentage}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {student.percentage >= 75 ? (
                                                <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Safe</span>
                                            ) : (
                                                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Warning</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalClassesHeld === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance data found for this course.</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
