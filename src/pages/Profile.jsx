import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../firebase';
import {
    Building,
    Hash,
    GraduationCap,
    Edit2,
    Save,
    X,
    BarChart3,
    Award,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import './Profile.css';

const SUBJECTS = [
    { code: 'CS302', name: 'Database Systems' },
    { code: 'CS401', name: 'Advanced ML' },
    { code: 'CS303', name: 'Computer Networks' },
    { code: 'CS402', name: 'Web Programming' }
];

export default function Profile() {
    const { user, loading } = useAuthContext();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', college: '', usn: '', year: '' });
    const [attendanceData, setAttendanceData] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [leaveHistory, setLeaveHistory] = useState([]);

    // Fetch profile
    useEffect(() => {
        if (!user?.uid) return;
        const profileRef = ref(database, `users/${user.uid}/profile`);
        const unsub = onValue(profileRef, (snap) => {
            const data = snap.val();
            if (data) {
                setProfileData({
                    name: data.name || user.displayName || '',
                    college: data.college || '',
                    usn: data.usn || '',
                    year: data.year || ''
                });
            } else {
                setProfileData(prev => ({ ...prev, name: user.displayName || '' }));
            }
        });
        return () => unsub();
    }, [user]);

    // Fetch real attendance from Firebase
    useEffect(() => {
        if (!user?.uid) return;
        const attRef = ref(database, 'attendance_records');
        const unsub = onValue(attRef, (snap) => {
            if (snap.exists()) {
                const allData = snap.val();
                const computed = SUBJECTS.map(sub => {
                    const courseRecords = allData[sub.code] || {};
                    const totalClasses = Object.keys(courseRecords).length;
                    let attended = 0;
                    Object.values(courseRecords).forEach(dateRecord => {
                        if (dateRecord[user.uid]) attended++;
                    });
                    const pct = totalClasses === 0 ? 0 : Math.round((attended / totalClasses) * 100);
                    return { subject: sub.name, percentage: pct, classes: attended, total: totalClasses };
                });
                setAttendanceData(computed);
            } else {
                setAttendanceData(SUBJECTS.map(s => ({ subject: s.name, percentage: 0, classes: 0, total: 0 })));
            }
            setLoadingAttendance(false);
        });
        return () => unsub();
    }, [user]);

    // Fetch leave history
    useEffect(() => {
        if (!user?.uid) return;
        const leavesRef = ref(database, `users/${user.uid}/leaves`);
        const unsub = onValue(leavesRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setLeaveHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 3));
            }
        });
        return () => unsub();
    }, [user]);

    if (!user && !loading) { navigate('/'); return null; }
    if (loading) return <div className="container profile-page flex-center"><div className="loader"></div></div>;

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await set(ref(database, `users/${user.uid}/profile`), { ...profileData, updatedAt: Date.now() });
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving profile', err);
        } finally {
            setSaving(false);
        }
    };

    const overallAvg = attendanceData.length > 0
        ? Math.round(attendanceData.reduce((s, a) => s + a.percentage, 0) / attendanceData.length)
        : 0;

    return (
        <div className="container profile-page">
            {/* Header */}
            <header className="profile-header">
                <div className="profile-user-info">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt={user.displayName} className="profile-large-avatar" referrerPolicy="no-referrer" />

                    <div className="profile-details-section">
                        {isEditing ? (
                            <div className="profile-edit-form">
                                <input type="text" placeholder="Full Name" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="profile-input" />
                                <input type="text" placeholder="College Name" value={profileData.college} onChange={e => setProfileData({ ...profileData, college: e.target.value })} className="profile-input" />
                                <div className="profile-input-row">
                                    <input type="text" placeholder="USN (e.g. 1RV20CS001)" value={profileData.usn} onChange={e => setProfileData({ ...profileData, usn: e.target.value })} className="profile-input" />
                                    <CustomSelect
                                        options={[
                                            { value: '1st Year', label: '1st Year' },
                                            { value: '2nd Year', label: '2nd Year' },
                                            { value: '3rd Year', label: '3rd Year' },
                                            { value: 'Alumni', label: 'Alumni' }
                                        ]}
                                        value={profileData.year}
                                        onChange={val => setProfileData({ ...profileData, year: val })}
                                        placeholder="Select Year"
                                        icon={GraduationCap}
                                    />
                                </div>
                                <div className="profile-edit-actions">
                                    <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                                        {saving ? 'Saving...' : <><Save size={16} /> Save</>}
                                    </button>
                                    <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                                        <X size={16} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-view-mode">
                                <div className="profile-name-row">
                                    <h1 className="profile-name">{profileData.name || user.displayName}</h1>
                                    <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
                                        <Edit2 size={14} /> Edit
                                    </button>
                                </div>
                                <p className="profile-email">{user.email}</p>
                                <div className="profile-meta-tags">
                                    {profileData.college && <span className="profile-tag"><Building size={14} /> {profileData.college}</span>}
                                    {profileData.usn    && <span className="profile-tag"><Hash size={14} /> {profileData.usn.toUpperCase()}</span>}
                                    {profileData.year   && <span className="profile-tag"><GraduationCap size={14} /> {profileData.year}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="profile-content-grid">
                {/* Attendance — real Firebase data */}
                <div className="glass-card attendance-card">
                    <div className="card-header-modern">
                        <BarChart3 size={20} color="var(--accent-color)" />
                        <h3>Attendance Overview</h3>
                        {!loadingAttendance && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: overallAvg >= 75 ? '#22c55e' : '#ef4444', fontWeight: '800' }}>
                                Avg: {overallAvg}%
                            </span>
                        )}
                    </div>

                    {loadingAttendance ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <Loader size={24} style={{ margin: '0 auto 0.5rem', animation: 'spin 1s linear infinite' }} />
                            <p style={{ fontSize: '0.85rem' }}>Loading attendance...</p>
                        </div>
                    ) : (
                        <div className="attendance-grid">
                            {attendanceData.map((item, i) => (
                                <AttendanceItem key={i} subject={item.subject} percentage={item.percentage} classes={item.classes} total={item.total} />
                            ))}
                            {attendanceData.every(a => a.total === 0) && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1/-1', textAlign: 'center', padding: '1rem' }}>
                                    No attendance records found yet. Attend a QR session to see your stats here.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Leave summary */}
                    <div className="glass-card achievement-card">
                        <div className="card-header-modern">
                            <Clock size={20} color="#f59e0b" />
                            <h3>Recent Leave Requests</h3>
                        </div>
                        {leaveHistory.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No leave applications yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                                {leaveHistory.map(leave => (
                                    <div key={leave.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>{leave.type}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{leave.from} → {leave.to}</div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                            background: leave.status === 'Approved' ? 'rgba(34,197,94,0.1)' : leave.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: leave.status === 'Approved' ? '#22c55e' : leave.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                        }}>{leave.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Overall stat card */}
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <Award size={28} color="#f59e0b" style={{ margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: overallAvg >= 75 ? '#22c55e' : '#ef4444' }}>{overallAvg}%</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Overall Attendance</div>
                        <div style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${overallAvg}%`, background: overallAvg >= 75 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: '99px', transition: 'width 1s ease' }}></div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.75rem' }}>
                            {overallAvg >= 75 ? '✅ Above the 75% requirement' : '⚠️ Below the 75% minimum requirement'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AttendanceItem({ subject, percentage, classes, total }) {
    const isLow = percentage < 75;
    return (
        <div className="attendance-item">
            <div className="attendance-info">
                <span className="subject-name">{subject}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '800', color: isLow ? '#ef4444' : '#22c55e' }}>
                    {isLow ? <AlertTriangle size={12} /> : <CheckCircle size={12} />} {percentage}%
                </span>
            </div>
            <div className="attendance-bar-container">
                <div className="attendance-bar-fill" style={{ width: `${percentage}%`, background: isLow ? '#ef4444' : 'var(--accent-color)' }}></div>
            </div>
            <div className="attendance-counts">
                {total === 0 ? 'No classes recorded yet' : `${classes} / ${total} classes attended`}
            </div>
        </div>
    );
}
