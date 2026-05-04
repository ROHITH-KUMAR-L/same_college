import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { UserPlus, CheckCircle2, AlertCircle, Loader2, Home } from 'lucide-react';

export default function Enroll() {
    const { classId } = useParams();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error' | 'already-enrolled'
    const [classData, setClassData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', `/enroll/${classId}`);
            return;
        }

        const processEnrollment = async () => {
            setLoading(true);
            try {
                const classRef = ref(database, `classes/${classId}`);
                const snapshot = await get(classRef);

                if (!snapshot.exists()) {
                    setStatus('error');
                    setErrorMsg('This enrollment link is invalid or has expired.');
                    setLoading(false);
                    return;
                }

                const data = snapshot.val();
                setClassData(data);

                const studentEnrollmentRef = ref(database, `users/${user.uid}/enrolledClasses/${classId}`);
                const enrollmentSnapshot = await get(studentEnrollmentRef);

                if (enrollmentSnapshot.exists()) {
                    setStatus('already-enrolled');
                    setLoading(false);
                    return;
                }

                await set(ref(database, `users/${user.uid}/enrolledClasses/${classId}`), {
                    classId: classId,
                    className: data.className,
                    subject: data.subject,
                    facultyName: data.facultyName,
                    enrolledAt: Date.now()
                });

                await set(ref(database, `classes/${classId}/roster/${user.uid}`), {
                    uid: user.uid,
                    name: user.displayName || user.name || 'Anonymous Student',
                    email: user.email,
                    enrolledAt: Date.now()
                });

                setStatus('success');
            } catch (err) {
                console.error("Enrollment failed:", err);
                setStatus('error');
                setErrorMsg('Something went wrong during enrollment. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        processEnrollment();
    }, [classId, user]);

    if (!user) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center', color: 'white' }}>
                <div className="admin-card card animate-fade" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
                    <UserPlus size={48} color="var(--accent-color)" style={{ marginBottom: '1.5rem' }} />
                    <h2>Sign In Required</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                        You need to be logged in as a student to join this class.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/profile')}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '100px 20px', textAlign: 'center', color: 'white' }}>
            <div className="admin-card card animate-fade" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                
                {loading ? (
                    <div style={{ padding: '2rem 0' }}>
                        <Loader2 size={48} className="animate-spin" color="var(--accent-color)" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                        <h3>Joining Class...</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Validating your enrollment link</p>
                    </div>
                ) : (
                    <>
                        {status === 'success' && (
                            <div className="animate-scale-up">
                                <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                                <h2 style={{ color: '#10b981' }}>Enrollment Successful!</h2>
                                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '1rem 0 2rem' }}>
                                    You have successfully joined <strong>{classData?.className}</strong> ({classData?.subject}).
                                </p>
                                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                                    Go to Dashboard
                                </button>
                            </div>
                        )}

                        {status === 'already-enrolled' && (
                            <div>
                                <CheckCircle2 size={64} color="var(--accent-color)" style={{ marginBottom: '1.5rem' }} />
                                <h2>Already Enrolled</h2>
                                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '1rem 0 2rem' }}>
                                    You are already a member of <strong>{classData?.className}</strong>.
                                </p>
                                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                                    View Dashboard
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div>
                                <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                                <h2 style={{ color: '#ef4444' }}>Enrollment Failed</h2>
                                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '1rem 0 2rem' }}>
                                    {errorMsg}
                                </p>
                                <button className="btn-outline" onClick={() => navigate('/')}>
                                    <Home size={16} /> Back to Home
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
