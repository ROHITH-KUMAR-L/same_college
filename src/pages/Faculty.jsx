import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
    Users, 
    CheckCircle, 
    Clock, 
    Calendar, 
    Plus, 
    ArrowUpRight, 
    MessageSquare, 
    FileText, 
    Zap, 
    UserCheck, 
    Book, 
    LogOut 
} from 'lucide-react';
import { ref, onValue, set, push, serverTimestamp, remove, update } from 'firebase/database';
import { database } from '../firebase';
import './Admin.css';

import AttendanceManager from '../components/faculty/AttendanceManager';
import ScheduleManager from '../components/faculty/ScheduleManager';
import LeaveManager from '../components/faculty/LeaveManager';
import ResourceManager from '../components/faculty/ResourceManager';

export default function FacultyDashboard() {
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Faculty Command Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome back, Prof. {user?.displayName?.split(' ')[0] || 'User'}. Manage your classes and attendance.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> New Assignment
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Users size={18} />} label="Overview" />
                <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<UserCheck size={18} />} label="Attendance & Reports" />
                <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={18} />} label="My Schedule" />
                <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={<Clock size={18} />} label="Leave Management" />
                <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<Book size={18} />} label="Course Materials" />
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'attendance' && <AttendanceManager />}
            {activeTab === 'schedule' && <ScheduleManager />}
            {activeTab === 'leaves' && <LeaveManager />}
            {activeTab === 'resources' && <ResourceManager />}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                background: active ? 'rgba(253, 224, 71, 0.1)' : 'transparent', 
                color: active ? 'var(--accent-color)' : 'white', 
                border: active ? '1px solid var(--accent-color)' : '1px solid transparent', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );
}

function OverviewTab() {
    const { user } = useAuthContext();
    const [attendanceStatus, setAttendanceStatus] = useState('Standby');
    const [isScanning, setIsScanning] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [detectedCount, setDetectedCount] = useState(0);

    useEffect(() => {
        if (isScanning && !sessionId) {
            const sessionsRef = ref(database, 'attendance_sessions');
            const newSessionRef = push(sessionsRef);
            const sid = newSessionRef.key;
            setSessionId(sid);
            
            set(newSessionRef, {
                facultyId: user?.uid,
                facultyName: user?.displayName,
                startTime: serverTimestamp(),
                status: 'active',
                course: 'Database Systems', // Mock for now
                room: 'Lab-12'
            });
        } else if (!isScanning && sessionId) {
            const sessionRef = ref(database, `attendance_sessions/${sessionId}`);
            remove(sessionRef); // Close session
            setSessionId(null);
            setDetectedCount(0);
        }
    }, [isScanning]);

    useEffect(() => {
        let interval;
        if (isScanning) {
            interval = setInterval(() => {
                setDetectedCount(prev => Math.min(prev + Math.floor(Math.random() * 3), 62));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const toggleAttendance = () => {
        setIsScanning(!isScanning);
        setAttendanceStatus(isScanning ? 'Standby' : 'Scanning Active');
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <FacultyStatCard icon={<Users size={24} color="var(--accent-color)" />} label="Active Courses" value="4" sub="3 Lectures, 1 Lab" />
                <FacultyStatCard icon={<CheckCircle size={24} color="#22c55e" />} label="Total Students" value="182" sub="+12 from last semester" />
                <FacultyStatCard icon={<Clock size={24} color="#3b82f6" />} label="Grading Pending" value="45" sub="Due in 4 days" />
                <FacultyStatCard icon={<MessageSquare size={24} color="#a855f7" />} label="Student Queries" value="8" sub="3 Urgent" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Zap size={24} color="var(--accent-color)" /> AI Automatic Attendance
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isScanning ? '#22c55e' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isScanning ? '#22c55e' : '#555', animation: isScanning ? 'pulse 1.5s infinite' : 'none' }}></div>
                                {attendanceStatus}
                            </span>
                            <button className={isScanning ? 'btn-outline' : 'btn-primary'} onClick={toggleAttendance} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
                                {isScanning ? 'Stop Scanning' : 'Start Session'}
                            </button>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '3rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                        {isScanning ? (
                            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--accent-color)', borderTopColor: 'transparent', margin: '0 auto 2rem', animation: 'spin 2s linear infinite' }}></div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Scanning for Devices...</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>Using Bluetooth & WiFi proximity to automatically register present students in the lecture hall.</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                    <Zap size={48} color="rgba(255,255,255,0.1)" />
                                </div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>No Active Session</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start a session to begin automatic AI attendance tracking.</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detected</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '0.25rem' }}>{detectedCount}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e', marginTop: '0.25rem' }}>{Math.floor(detectedCount * 0.9)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Anomalies</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444', marginTop: '0.25rem' }}>{Math.floor(detectedCount * 0.1)}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>Today's Classes</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <ClassItem time="09:00 AM" title="Advanced ML" room="L-402" students="48" status="Completed" />
                        <ClassItem time="11:30 AM" title="Database Systems" room="Lab-12" students="62" status="In Progress" active />
                        <ClassItem time="02:00 PM" title="Software Architecture" room="Online" students="72" status="Upcoming" />
                    </div>
                </div>
            </div>
        </>
    );
}

function FacultyStatCard({ icon, label, value, sub }) {
    return (
        <div className="admin-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '0', right: '0', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>{icon}</div>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white' }}>{value}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>{label}</div>
                </div>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>{sub}</div>
        </div>
    );
}

function ClassItem({ time, title, room, students, status, active = false }) {
    return (
        <div style={{ background: active ? 'rgba(253, 224, 71, 0.05)' : 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: active ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center', minWidth: '80px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white' }}>{time}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>{room}</div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{students} Students Enrolled</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '0.25rem 0.6rem', borderRadius: '6px', background: status === 'Completed' ? '#22c55e' : status === 'In Progress' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: status === 'In Progress' || status === 'Completed' ? 'black' : 'white', textTransform: 'uppercase' }}>{status}</span>
            </div>
        </div>
    );
}
