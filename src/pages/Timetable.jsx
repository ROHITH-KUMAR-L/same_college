import { useState } from 'react';
import { Calendar, Clock, MapPin, Search, ChevronRight, Download } from 'lucide-react';
import './Notes.css'; // Reusing layout styles

export default function Timetable() {
    const [selectedBranch, setSelectedBranch] = useState('Computer Science');
    const [selectedSem, setSelectedSem] = useState('4th Sem');

    const schedule = [
        { time: '09:00 AM - 10:00 AM', subject: 'Software Engineering', room: 'L-302', type: 'Lecture' },
        { time: '10:00 AM - 11:00 AM', subject: 'Database Systems', room: 'L-302', type: 'Lecture' },
        { time: '11:30 AM - 01:30 PM', subject: 'Web Programming Lab', room: 'Lab-05', type: 'Lab' },
        { time: '02:00 PM - 03:00 PM', subject: 'Python Programming', room: 'L-302', type: 'Lecture' },
        { time: '03:00 PM - 04:00 PM', subject: 'Communication Skills', room: 'Seminar Hall', type: 'Workshop' },
    ];

    return (
        <div className="notes-page-wrapper premium-page" style={{ paddingTop: '5rem', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', marginBottom: '1rem' }}>Academic <span style={{ color: 'var(--accent-color)' }}>Timetable</span></h1>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>Stay organized and never miss a class. View your daily schedule with real-time room assignments.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
                    {/* Selectors */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'white' }}>Quick Select</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch</label>
                                    <select 
                                        className="btn-outline" 
                                        style={{ width: '100%', marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                    >
                                        <option>Computer Science</option>
                                        <option>Mechanical</option>
                                        <option>Civil</option>
                                        <option>Electrical</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Semester</label>
                                    <select 
                                        className="btn-outline" 
                                        style={{ width: '100%', marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}
                                        value={selectedSem}
                                        onChange={(e) => setSelectedSem(e.target.value)}
                                    >
                                        <option>1st Sem</option>
                                        <option>2nd Sem</option>
                                        <option>3rd Sem</option>
                                        <option>4th Sem</option>
                                        <option>5th Sem</option>
                                        <option>6th Sem</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                            <Download size={18} /> Download PDF
                        </button>
                    </div>

                    {/* Schedule List */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--accent-color)', color: 'black', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: '900' }}>
                                    TODAY
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Monday</h2>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{selectedBranch} • {selectedSem}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {schedule.map((item, index) => (
                                <div key={index} style={{ 
                                    background: 'rgba(255,255,255,0.02)', 
                                    padding: '1.5rem', 
                                    borderRadius: '20px', 
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    transition: 'all 0.3s ease'
                                }} className="schedule-item-hover">
                                    <div style={{ minWidth: '160px', color: 'var(--accent-color)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} /> {item.time}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>{item.subject}</div>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <MapPin size={14} /> {item.room}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: '900', 
                                                textTransform: 'uppercase', 
                                                background: item.type === 'Lab' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                                color: item.type === 'Lab' ? '#3b82f6' : '#a855f7',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px'
                                            }}>{item.type}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
