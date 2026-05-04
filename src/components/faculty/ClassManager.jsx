import { useState, useEffect } from 'react';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';
import { Plus, Link, Copy, Check, Trash2, Users, BookOpen, Clock } from 'lucide-react';

export default function ClassManager() {
    const { user } = useAuthContext();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newClass, setNewClass] = useState({ className: '', subject: '', branch: '', semester: '' });
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        if (!user) return;
        const classesRef = ref(database, 'classes');
        const unsubscribe = onValue(classesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const userClasses = Object.keys(data)
                    .map(id => ({ id, ...data[id] }))
                    .filter(c => (c.facultyUid === user.uid) || (c.facultyEmail && c.facultyEmail.toLowerCase() === user.email?.toLowerCase()));
                setClasses(userClasses);
            } else {
                setClasses([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const classesRef = ref(database, 'classes');
            const newClassRef = push(classesRef);
            await set(newClassRef, {
                ...newClass,
                facultyUid: user.uid,
                facultyName: user.displayName || user.name || 'Professor',
                createdAt: Date.now(),
                roster: {}
            });
            setShowModal(false);
            setNewClass({ className: '', subject: '', branch: '', semester: '' });
        } catch (err) {
            alert("Failed to create class");
        }
    };

    const copyLink = (classId) => {
        const link = `${window.location.origin}/enroll/${classId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(classId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const deleteClass = async (id) => {
        if (window.confirm("Delete this class and all enrollment data?")) {
            await remove(ref(database, `classes/${id}`));
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>My Classes</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Generate enrollment links for your students</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Create New Class
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading your classes...</div>
            ) : classes.length === 0 ? (
                <div className="admin-card card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <BookOpen size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'rgba(255,255,255,0.5)' }}>No classes created yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>Start by creating your first class to enroll students.</p>
                    <button className="btn-outline" onClick={() => setShowModal(true)}>Create Class</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {classes.map(cls => (
                        <div key={cls.id} className="admin-card card" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{cls.className}</h4>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        {cls.subject}
                                    </span>
                                </div>
                                <button onClick={() => deleteClass(cls.id)} style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Users size={14} /> {Object.keys(cls.roster || {}).length} Students
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} /> {cls.branch} • {cls.semester}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    className="btn-primary" 
                                    style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => copyLink(cls.id)}
                                >
                                    {copiedId === cls.id ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Enroll Link</>}
                                </button>
                                <button className="btn-outline" style={{ padding: '0.6rem' }} title="Share Link">
                                    <Link size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Class Modal */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '450px' }}>
                        <div className="admin-modal-header">
                            <h3>Create New Class</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateClass} className="modal-form" style={{ padding: '1.5rem' }}>
                            <div className="modal-field">
                                <label>Class Name (e.g. 2nd Year CSE)</label>
                                <input type="text" value={newClass.className} onChange={e => setNewClass({...newClass, className: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>
                            <div className="modal-field">
                                <label>Subject</label>
                                <input type="text" value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            </div>
                            <div className="modal-form-row" style={{ display: 'flex', gap: '1rem' }}>
                                <div className="modal-field" style={{ flex: 1 }}>
                                    <label>Branch</label>
                                    <input type="text" placeholder="CSE" value={newClass.branch} onChange={e => setNewClass({...newClass, branch: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                                <div className="modal-field" style={{ flex: 1 }}>
                                    <label>Semester</label>
                                    <input type="text" placeholder="4th" value={newClass.semester} onChange={e => setNewClass({...newClass, semester: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Create Class</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
