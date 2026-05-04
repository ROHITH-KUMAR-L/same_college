import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Users, UserCheck, Calendar, Clock, Book, QrCode, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import './Admin.css';

import AttendanceManager from '../components/faculty/AttendanceManager';
import ScheduleManager from '../components/faculty/ScheduleManager';
import LeaveManager from '../components/faculty/LeaveManager';
import ResourceManager from '../components/faculty/ResourceManager';

const TABS = [
    { id: 'overview',    label: 'Overview',          icon: TrendingUp },
    { id: 'attendance',  label: 'Attendance',         icon: QrCode },
    { id: 'schedule',    label: 'Schedule',           icon: Calendar },
    { id: 'leaves',      label: 'Leave Management',   icon: Clock },
    { id: 'resources',   label: 'Course Materials',   icon: Book },
];

export default function FacultyDashboard() {
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [studentCount, setStudentCount] = useState(0);
    const [pendingLeaves, setPendingLeaves] = useState(0);
    const [todayPresent, setTodayPresent] = useState(0);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        // Real student count
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setStudentCount(Object.values(data).filter(u => u.role === 'STUDENT').length);
            }
        });

        // Pending student leaves
        const leavesRef = ref(database, 'admin_leaves');
        onValue(leavesRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setPendingLeaves(Object.values(data).filter(l => l.status === 'Pending').length);
            }
        });

        // Today's attendance (across all courses)
        const attRef = ref(database, `attendance_records`);
        onValue(attRef, (snap) => {
            if (snap.exists()) {
                let count = 0;
                const data = snap.val();
                Object.values(data).forEach(course => {
                    if (course[today]) count += Object.keys(course[today]).length;
                });
                setTodayPresent(count);
            }
        });
    }, [today]);

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '6rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`}
                        alt="avatar"
                        style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-color)' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', lineHeight: 1.2 }}>
                            Welcome, <span style={{ color: 'var(--accent-color)' }}>{user?.displayName?.split(' ')[0] || 'Professor'}</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Faculty Command Center • {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatPill icon={<Users size={20} color="var(--accent-color)" />} label="Students" value={studentCount} />
                <StatPill icon={<CheckCircle size={20} color="#22c55e" />} label="Present Today" value={todayPresent} />
                <StatPill icon={<Clock size={20} color="#f59e0b" />} label="Pending Leaves" value={pendingLeaves} badge={pendingLeaves > 0} />
                <StatPill icon={<FileText size={20} color="#3b82f6" />} label="Resources" value="—" />
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '0',
                marginBottom: '2rem',
                overflowX: 'auto',
                scrollbarWidth: 'none'
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                color: active ? 'var(--accent-color)' : 'var(--text-muted)',
                                border: 'none',
                                borderBottom: active ? '2px solid var(--accent-color)' : '2px solid transparent',
                                padding: '0.75rem 1.25rem',
                                cursor: 'pointer',
                                fontWeight: active ? '700' : '500',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                marginBottom: '-1px'
                            }}
                        >
                            <Icon size={16} /> {tab.label}
                            {tab.id === 'leaves' && pendingLeaves > 0 && (
                                <span style={{ background: '#f59e0b', color: 'black', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>{pendingLeaves}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            {activeTab === 'overview'   && <OverviewTab studentCount={studentCount} todayPresent={todayPresent} pendingLeaves={pendingLeaves} />}
            {activeTab === 'attendance' && <AttendanceManager />}
            {activeTab === 'schedule'   && <ScheduleManager />}
            {activeTab === 'leaves'     && <LeaveManager />}
            {activeTab === 'resources'  && <ResourceManager />}
        </div>
    );
}

function StatPill({ icon, label, value, badge }) {
    return (
        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
            </div>
            {badge && <div style={{ position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }}></div>}
        </div>
    );
}

function OverviewTab({ studentCount, todayPresent, pendingLeaves }) {
    const { user } = useAuthContext();
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        if (!user?.uid) return;
        const schedRef = ref(database, `faculty_schedules/${user.uid}`);
        onValue(schedRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setSchedule(Object.keys(data).map(k => ({ id: k, ...data[k] })));
            }
        });
    }, [user]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Left: Quick summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="admin-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(253,224,71,0.08), rgba(0,0,0,0))', border: '1px solid rgba(253,224,71,0.12)' }}>
                    <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} color="var(--accent-color)" /> Quick Stats
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <QuickStatBox label="Total Students" value={studentCount} color="var(--accent-color)" />
                        <QuickStatBox label="Present Today" value={todayPresent} color="#22c55e" />
                        <QuickStatBox label="Pending Leaves" value={pendingLeaves} color="#f59e0b" />
                    </div>
                </div>

                {pendingLeaves > 0 && (
                    <div className="admin-card" style={{ padding: '1.5rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={20} color="#f59e0b" />
                            <div>
                                <div style={{ color: 'white', fontWeight: '700' }}>{pendingLeaves} student leave {pendingLeaves === 1 ? 'request' : 'requests'} awaiting review</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Go to Leave Management tab to approve or reject</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Today's schedule */}
            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} color="var(--accent-color)" /> Today's Classes
                </h2>
                {schedule.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {schedule.map(item => (
                            <div key={item.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${item.color || 'var(--accent-color)'}` }}>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{item.course}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{item.time} • {item.room}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                        <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <p style={{ fontSize: '0.85rem' }}>No schedule data. Visit the Schedule tab to set up your timetable.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function QuickStatBox({ label, value, color }) {
    return (
        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
        </div>
    );
}
