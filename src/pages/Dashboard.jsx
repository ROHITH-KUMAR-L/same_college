import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    BarChart3, 
    Clock, 
    AlertTriangle, 
    CheckCircle, 
    ArrowRight, 
    CalendarDays,
    Bell,
    UserCircle,
    Zap
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import './Admin.css'; // Reusing admin grid styles

export default function StudentDashboard() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [attendanceData, setAttendanceData] = useState([
        { subject: 'Database Systems', percentage: 0, status: '...' },
        { subject: 'Software Engineering', percentage: 0, status: '...' },
        { subject: 'Computer Networks', percentage: 0, status: '...' },
        { subject: 'Web Programming', percentage: 0, status: '...' },
    ]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch student's enrolled classes
        const studentClassesRef = ref(database, `users/${user.uid}/enrolledClasses`);
        const attendanceRecordsRef = ref(database, 'attendance_records');

        const unsubscribe = onValue(studentClassesRef, (classSnapshot) => {
            if (classSnapshot.exists()) {
                const enrolledClasses = classSnapshot.val();
                
                onValue(attendanceRecordsRef, (attendanceSnapshot) => {
                    const allRecords = attendanceSnapshot.exists() ? attendanceSnapshot.val() : {};
                    
                    const updatedData = Object.keys(enrolledClasses).map(classId => {
                        const classInfo = enrolledClasses[classId];
                        const courseRecords = allRecords[classId] || {};
                        const totalClasses = Object.keys(courseRecords).length;
                        let classesAttended = 0;

                        Object.keys(courseRecords).forEach(date => {
                            if (courseRecords[date][user.uid]) {
                                classesAttended++;
                            }
                        });

                        const percentage = totalClasses === 0 ? 0 : Math.round((classesAttended / totalClasses) * 100);
                        
                        let status = 'Excellent';
                        if (percentage < 75) status = 'Critical';
                        else if (percentage < 85) status = 'Warning';
                        else if (percentage < 90) status = 'Good';

                        return {
                            subject: classInfo.className,
                            percentage,
                            status,
                            classesNeeded: Math.max(0, Math.ceil((0.75 * (totalClasses + 5) - classesAttended))) 
                        };
                    });

                    setAttendanceData(updatedData);
                    setLoadingAttendance(false);
                });
            } else {
                setAttendanceData([]);
                setLoadingAttendance(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const events = [
        { date: 'May 10', title: 'Internal Assessment - I', type: 'Exam' },
        { date: 'May 15', title: 'College Fest 2026', type: 'Event' },
        { date: 'May 22', title: 'Holiday - Buddha Purnima', type: 'Holiday' },
        { date: 'June 05', title: 'Final Lab Submission', type: 'Academic' },
    ];

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Student <span style={{ color: 'var(--accent-color)' }}>Hub</span></h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.displayName}. Here's your academic summary.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px' }}>
                        <Bell size={20} color="var(--accent-color)" />
                        <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>2 New Alerts</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Attendance Dashboard */}
                    <div className="admin-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <BarChart3 size={24} color="var(--accent-color)" /> Attendance Overview
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Requirement: 75%</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {attendanceData.map((item, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: '700', color: 'white' }}>{item.subject}</span>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: '900', 
                                            color: item.percentage < 75 ? '#ef4444' : '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            {item.percentage < 75 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                            {item.status}
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                        <div style={{ 
                                            width: `${item.percentage}%`, 
                                            height: '100%', 
                                            background: item.percentage < 75 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, var(--accent-color), #facc15)',
                                            borderRadius: '10px'
                                        }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Current</span>
                                        <span style={{ color: 'white', fontWeight: '800' }}>{item.percentage}%</span>
                                    </div>
                                    
                                    {item.percentage < 75 && (
                                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', color: '#f87171' }}>
                                            <strong>Warning:</strong> You need to attend {item.classesNeeded} more classes to reach 75%.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <QuickActionCard 
                            icon={<Zap size={24} color="#facc15" />}
                            title="AI Assistant"
                            desc="Get summaries & quizzes"
                            onClick={() => navigate('/study-assistant')}
                        />
                        <QuickActionCard 
                            icon={<Clock size={24} color="#3b82f6" />}
                            title="Apply Leave"
                            desc="Duty leave & medical"
                            onClick={() => navigate('/leaves')}
                        />
                        <QuickActionCard 
                            icon={<Calendar size={24} color="#a855f7" />}
                            title="Time Table"
                            desc="View your schedule"
                            onClick={() => navigate('/timetable')}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Academic Calendar */}
                    <div className="admin-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <CalendarDays size={24} color="var(--accent-color)" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>Academic Calendar</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {events.map((event, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)' }}>{event.date.split(' ')[0]}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'white' }}>{event.date.split(' ')[1]}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>{event.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Profile Summary */}
                    <div className="admin-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.5rem', border: '3px solid var(--accent-color)', padding: '3px' }}>
                            <img src={user?.photoURL} alt={user?.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        </div>
                        <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user?.displayName}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Computer Science • 4th Sem</p>
                        <button className="btn-outline" style={{ width: '100%' }} onClick={() => navigate('/profile')}>View Full Profile</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickActionCard({ icon, title, desc, onClick }) {
    return (
        <div className="admin-card" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.3s' }} onClick={onClick}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {icon}
            </div>
            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>{desc}</p>
            <ArrowRight size={16} color="var(--accent-color)" style={{ marginTop: '1rem' }} />
        </div>
    );
}
