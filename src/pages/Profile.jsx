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
    CheckCircle,
    BarChart3,
    Clock,
    Award
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import './Profile.css';

export default function Profile() {
    const { user, loading } = useAuthContext();
    const navigate = useNavigate();

    // Profile state
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        college: '',
        usn: '',
        year: ''
    });

    // Fetch user profile data from firebase
    useEffect(() => {
        if (user?.uid) {
            const profileRef = ref(database, `users/${user.uid}/profile`);
            const unsubscribe = onValue(profileRef, (snapshot) => {
                const data = snapshot.val();
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
            return () => unsubscribe();
        }
    }, [user]);

    if (!user && !loading) {
        navigate('/');
        return null;
    }

    if (loading) {
        return (
            <div className="container profile-page flex-center">
                <div className="loader"></div>
            </div>
        );
    }

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await set(ref(database, `users/${user.uid}/profile`), {
                ...profileData,
                updatedAt: Date.now()
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving profile", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container profile-page">
            <header className="profile-header">
                <div className="profile-user-info">
                    <img src={user.photoURL} alt={user.displayName} className="profile-large-avatar" referrerPolicy="no-referrer" />

                    <div className="profile-details-section">
                        {isEditing ? (
                            <div className="profile-edit-form">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={profileData.name}
                                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                    className="profile-input"
                                />
                                <input
                                    type="text"
                                    placeholder="College Name"
                                    value={profileData.college}
                                    onChange={e => setProfileData({ ...profileData, college: e.target.value })}
                                    className="profile-input"
                                />
                                <div className="profile-input-row">
                                    <input
                                        type="text"
                                        placeholder="USN (Optional, e.g. 1RV20CS001)"
                                        value={profileData.usn}
                                        onChange={e => setProfileData({ ...profileData, usn: e.target.value })}
                                        className="profile-input"
                                    />
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
                                    {profileData.college && (
                                        <span className="profile-tag"><Building size={14} /> {profileData.college}</span>
                                    )}
                                    {profileData.usn && (
                                        <span className="profile-tag"><Hash size={14} /> {profileData.usn.toUpperCase()}</span>
                                    )}
                                    {profileData.year && (
                                        <span className="profile-tag"><GraduationCap size={14} /> {profileData.year}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="profile-content-grid">
                {/* Attendance Stats Section */}
                <div className="glass-card attendance-card">
                    <div className="card-header-modern">
                        <BarChart3 size={20} color="var(--accent-color)" />
                        <h3>Attendance Overview</h3>
                    </div>
                    <div className="attendance-grid">
                        <AttendanceItem subject="Database Systems" percentage={85} classes={24} total={28} />
                        <AttendanceItem subject="Software Engineering" percentage={92} classes={26} total={28} />
                        <AttendanceItem subject="Computer Networks" percentage={78} classes={22} total={28} />
                        <AttendanceItem subject="Web Programming" percentage={100} classes={28} total={28} />
                    </div>
                </div>

                {/* Academic Achievement */}
                <div className="glass-card achievement-card">
                    <div className="card-header-modern">
                        <Award size={20} color="#f59e0b" />
                        <h3>Learning Progress</h3>
                    </div>
                    <div className="progress-details">
                        <div className="progress-stat">
                            <span>Resources Completed</span>
                            <strong>42</strong>
                        </div>
                        <div className="progress-stat">
                            <span>Study Hours</span>
                            <strong>128h</strong>
                        </div>
                        <div className="main-progress-bar">
                            <div className="progress-fill" style={{ width: '65%' }}></div>
                        </div>
                        <p className="progress-caption">Keep it up! You're in the top 15% of students this month.</p>
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
                <span className={`percentage ${isLow ? 'low' : ''}`}>{percentage}%</span>
            </div>
            <div className="attendance-bar-container">
                <div className="attendance-bar-fill" style={{ width: `${percentage}%`, background: isLow ? '#ef4444' : 'var(--accent-color)' }}></div>
            </div>
            <div className="attendance-counts">
                {classes} / {total} Lectures Attended
            </div>
        </div>
    );
}
