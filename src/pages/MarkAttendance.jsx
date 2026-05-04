import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import './Admin.css';

export default function MarkAttendance() {
    const [searchParams] = useSearchParams();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    
    const course = searchParams.get('course');
    const sessionId = searchParams.get('session');
    
    const [status, setStatus] = useState('loading'); // loading, success, error, unauthorized
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const markAttendance = async () => {
            if (!user) {
                setStatus('unauthorized');
                return;
            }

            if (!course || !sessionId) {
                setStatus('error');
                setErrorMessage('Invalid QR Code. Missing course or session info.');
                return;
            }

            try {
                // 1. Verify the session is active
                const sessionRef = ref(database, `attendance_sessions/${course}`);
                const snapshot = await get(sessionRef);
                
                if (!snapshot.exists() || snapshot.val().sessionId !== sessionId) {
                    setStatus('error');
                    setErrorMessage('This QR code is expired or invalid. Please scan the current one on the board.');
                    return;
                }

                const dateStr = snapshot.val().date;

                // 2. Mark attendance
                const attendanceRef = ref(database, `attendance_records/${course}/${dateStr}/${user.uid}`);
                await set(attendanceRef, {
                    name: user.displayName || 'Unknown Student',
                    email: user.email,
                    status: 'present',
                    timestamp: serverTimestamp()
                });

                setStatus('success');
            } catch (err) {
                console.error(err);
                setStatus('error');
                setErrorMessage('Failed to connect to the database.');
            }
        };

        markAttendance();
    }, [user, course, sessionId]);

    if (status === 'unauthorized') {
        return (
            <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
                <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
                    <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>Please Login First</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You must be logged in to mark your attendance.</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>Go to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                {status === 'loading' && (
                    <>
                        <div style={{ width: '48px', height: '48px', border: '4px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verifying Attendance...</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Please wait while we verify your session.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Attendance Marked!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You have been successfully marked present for {course}.</p>
                        <button className="btn-outline" onClick={() => navigate('/timetable')}>View My Schedule</button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Attendance Failed</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{errorMessage}</p>
                        <button className="btn-outline" onClick={() => window.location.reload()}>Try Again</button>
                    </>
                )}
            </div>
        </div>
    );
}
