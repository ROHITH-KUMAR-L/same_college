import { useState } from 'react';
import { auth, database } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { ShieldCheck, UserPlus, AlertCircle, CheckCircle2, UserCog } from 'lucide-react';

export default function DebugCreateFaculty() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setStatus('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await set(ref(database, `users/${user.uid}`), {
                uid: user.uid,
                email: email,
                name: 'Test Faculty',
                role: 'FACULTY',
                college: 'Test College',
                branch: 'Computer Science',
                timestamp: Date.now()
            });

            setStatus(`SUCCESS: Created NEW faculty account for ${email}`);
        } catch (error) {
            setStatus(`ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!email) {
            setStatus('ERROR: Please enter an email address first.');
            return;
        }
        setLoading(true);
        setStatus('');
        try {
            const usersRef = ref(database, 'users');
            const emailQuery = query(usersRef, orderByChild('email'), equalTo(email.toLowerCase().trim()));
            const snapshot = await get(emailQuery);

            if (!snapshot.exists()) {
                setStatus('ERROR: User not found in database. They must sign up first.');
                setLoading(false);
                return;
            }

            const uids = Object.keys(snapshot.val());
            const targetUid = uids[0];

            await update(ref(database, `users/${targetUid}`), {
                role: 'FACULTY'
            });

            setStatus(`SUCCESS: Promoted existing user ${email} to FACULTY!`);
        } catch (error) {
            console.error(error);
            setStatus(`ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '100px 20px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
            <div className="admin-card card animate-fade" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <ShieldCheck size={40} color="var(--accent-color)" />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '1px' }}>Faculty Management</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>Role Elevation & Debug Tools</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="modal-field">
                        <label style={{ color: 'var(--accent-color)', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Target Email Address</label>
                        <input 
                            type="email" 
                            placeholder="Enter user email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button 
                            onClick={handlePromote}
                            disabled={loading}
                            className="btn-outline"
                            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                        >
                            {loading ? 'Processing...' : <><UserCog size={18} /> Promote to Faculty</>}
                        </button>
                        
                        <button 
                            onClick={handleCreate}
                            disabled={loading}
                            className="btn-primary"
                            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {loading ? 'Creating...' : <><UserPlus size={18} /> Create New Faculty</>}
                        </button>
                    </div>

                    {status && (
                        <div className="animate-fade-in" style={{ 
                            padding: '1.2rem', 
                            borderRadius: '12px', 
                            background: status.startsWith('ERROR') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            border: `1px solid ${status.startsWith('ERROR') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                            color: status.startsWith('ERROR') ? '#f87171' : '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.95rem',
                            lineHeight: '1.4'
                        }}>
                            {status.startsWith('ERROR') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                            <span>{status}</span>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Note: User must have an existing account to be promoted. 
                        If creating a new account, the default password is <strong>password123</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}
