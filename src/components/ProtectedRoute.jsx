import { useAuthContext } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuthContext();

    // Stage 1: Firebase auth session still resolving
    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="loader"></div>
            </div>
        );
    }

    // Stage 2: Not logged in at all
    if (!user) {
        return (
            <div className="flex-center" style={{
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '1.5rem',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(var(--accent-rgb, 99, 102, 241), 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldCheck size={40} style={{ color: 'var(--accent-color)' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Sign In Required</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
                    You need to sign in to access this page.
                </p>
            </div>
        );
    }

    // Stage 3: User is authenticated but role hasn't been fetched from Firebase yet.
    // Without this guard, user.role is undefined momentarily and the role check below
    // would flash "Access Denied" before the role arrives. Keep the spinner instead.
    if (allowedRoles && allowedRoles.length > 0 && !user.role) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="loader"></div>
            </div>
        );
    }

    // Stage 4: Role resolved but not permitted
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex-center" style={{
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '1.5rem',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldAlert size={40} style={{ color: '#ef4444' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
                    You do not have permission to view this page. This area is restricted to {allowedRoles.join(' or ')} accounts.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => window.history.back()}
                    style={{ marginTop: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '1rem' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return children;
}
