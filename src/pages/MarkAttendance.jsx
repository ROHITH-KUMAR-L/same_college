import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import { CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import './Admin.css';

async function getPublicIp() {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
}

export default function MarkAttendance() {
    const [searchParams] = useSearchParams();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    
    const course = searchParams.get('course');
    const sessionId = searchParams.get('session');
    
    const [status, setStatus] = useState('loading'); // loading, success, error, unauthorized, wrong_network
    const [errorMessage, setErrorMessage] = useState('');
    const [studentIp, setStudentIp] = useState('');

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
                    setErrorMessage('This QR code is expired or invalid. Ask your faculty to refresh the attendance session.');
                    return;
                }

                const session = snapshot.val();
                const dateStr = session.date;

                // 2. Network / IP verification — only allow if on same public network
                if (session.allowedIpLocked && session.allowedIp) {
                    let myIp = null;
                    try {
                        myIp = await getPublicIp();
                        setStudentIp(myIp);
                    } catch {
                        setStatus('error');
                        setErrorMessage('Could not verify your network. Please ensure you have an internet connection and try again.');
                        return;
                    }

                    if (myIp !== session.allowedIp) {
                        setStatus('wrong_network');
                        return;
                    }
                }

                // 3. Mark attendance
                const attendanceRef = ref(database, `attendance_records/${course}/${dateStr}/${user.uid}`);
                await set(attendanceRef, {
                    name: user.displayName || 'Unknown Student',
                    email: user.email,
                    status: 'present',
                    ip: studentIp || 'unverified',
                    timestamp: serverTimestamp()
                });

                setStatus('success');
            } catch (err) {
                console.error(err);
                setStatus('error');
                setErrorMessage('Failed to connect to the database. Please try again.');
            }
        };

        markAttendance();
    }, [user, course, sessionId]);

    const cardStyle = {
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%'
    };

    const containerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem'
    };

    if (status === 'unauthorized') {
        return (
            <div className="admin-container" style={containerStyle}>
                <div className="admin-card" style={cardStyle}>
                    <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Please Login First</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You must be logged in to mark your attendance.</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>Go to Login</button>
                </div>
            </div>
        );
    }

    if (status === 'wrong_network') {
        return (
            <div className="admin-container" style={containerStyle}>
                <div className="admin-card" style={cardStyle}>
                    <div style={{ position: 'relative', margin: '0 auto 1.5rem', width: '80px', height: '80px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <WifiOff size={40} color="#ef4444" />
                        </div>
                    </div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Not on College Network</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        Attendance can only be marked from the <strong style={{ color: 'white' }}>college WiFi network</strong>. 
                        Your device appears to be on a different network.
                    </p>
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '700' }}>What to do</div>
                        <ol style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textAlign: 'left', paddingLeft: '1.25rem', lineHeight: '1.8', margin: 0 }}>
                            <li>Connect your device to the college WiFi</li>
                            <li>Scan the QR code again</li>
                        </ol>
                    </div>
                    <button className="btn-outline" onClick={() => window.location.reload()}>
                        Retry After Connecting to WiFi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container" style={containerStyle}>
            <div className="admin-card" style={cardStyle}>
                {status === 'loading' && (
                    <>
                        <div style={{ width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verifying Attendance...</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Checking session and network. Please wait.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={72} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.5rem' }}>Attendance Marked!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            You have been marked <strong style={{ color: '#22c55e' }}>Present</strong> for <strong style={{ color: 'white' }}>{course}</strong>.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.8rem', marginBottom: '2rem' }}>
                            <Wifi size={14} /> Verified on college network
                        </div>
                        <button className="btn-outline" onClick={() => navigate('/timetable')}>View My Schedule</button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Attendance Failed</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{errorMessage}</p>
                        <button className="btn-outline" onClick={() => window.location.reload()}>Try Again</button>
                    </>
                )}
            </div>
        </div>
    );
}
