import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Home, FileText, ScrollText, Zap, Heart, Clock } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import LoginModal from './LoginModal';
import '../App.css';

export default function Navbar() {
    const location = useLocation();
    const { user, loading, logout } = useAuthContext();
    const navigate = useNavigate();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <>
            {/* Top Navbar */}
            <nav className="navbar">
                <div className="container nav-container">
                    <Link to="/" className="logo-link">
                        <span>Same <span style={{ color: 'var(--accent-color)' }}>College</span></span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="nav-links nav-desktop-only">
                        <Link to="/" className={`nav-item ${isActive('/')}`}>Home</Link>
                        <Link to="/notes" className={`nav-item ${isActive('/notes')}`}>Notes</Link>
                        <Link to="/papers" className={`nav-item ${isActive('/papers')}`}>Previous Year Question Paper</Link>
                        <Link to="/timetable" className={`nav-item ${isActive('/timetable')}`}>Time Table</Link>
                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>Admin</Link>
                        )}
                        {user?.role === 'FACULTY' && (
                            <Link to="/faculty" className={`nav-item ${isActive('/faculty')}`}>Faculty</Link>
                        )}
                    </div>

                    {/* Controls & Auth section */}
                    <div className="nav-auth-area" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {loading ? (
                            <span className="nav-auth-skeleton" />
                        ) : user ? (
                            <div className="nav-user-section">
                                <Link to="/profile" className="nav-profile-link">
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="nav-avatar"
                                        referrerPolicy="no-referrer"
                                    />
                                    <span className="nav-username">{user.displayName?.split(' ')[0]}</span>
                                </Link>
                                <button className="btn-outline nav-logout-btn" onClick={logout} title="Sign out">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-primary" onClick={() => setIsLoginOpen(true)}>Sign In</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                <Link to="/" className={`mobile-nav-item ${isActive('/')}`}>
                    <Home size={20} />
                    <span>Home</span>
                </Link>
                <Link to="/notes" className={`mobile-nav-item ${isActive('/notes')}`}>
                    <FileText size={20} />
                    <span>Resources</span>
                </Link>
                <Link to="/papers" className={`mobile-nav-item ${isActive('/papers')}`}>
                    <FileText size={20} />
                    <span>Papers</span>
                </Link>
                <Link to="/timetable" className={`mobile-nav-item ${isActive('/timetable')}`}>
                    <Clock size={20} />
                    <span>Time Table</span>
                </Link>
            </nav>
        </>
    );
}

