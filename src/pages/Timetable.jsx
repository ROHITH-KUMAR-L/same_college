import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Download, Filter, Info } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import './Notes.css';

export default function Timetable() {
    const { user, preferences } = useAuthContext();
    const [selectedBranch, setSelectedBranch] = useState(preferences?.branch || 'Computer Science');
    const [selectedSem, setSelectedSem] = useState(preferences?.semester || '1st Sem');
    const [timetableData, setTimetableData] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    useEffect(() => {
        const ttRef = ref(database, 'timetable');
        const unsubscribe = onValue(ttRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setTimetableData(data);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fallback static schedule if DB is empty
    const defaultSchedule = [
        { time: '09:00 AM', subject: 'Mathematics III', room: 'L-101', type: 'Lecture', duration: '1hr' },
        { time: '10:00 AM', subject: 'Digital Electronics', room: 'L-101', type: 'Lecture', duration: '1hr' },
        { time: '11:15 AM', subject: 'Data Structures', room: 'Lab-1', type: 'Lab', duration: '2hrs' },
        { time: '02:00 PM', subject: 'Analog Circuits', room: 'L-102', type: 'Lecture', duration: '1hr' },
        { time: '03:00 PM', subject: 'Soft Skills', room: 'Seminar Hall', type: 'Workshop', duration: '1hr' },
    ];

    const currentSchedule = timetableData[selectedBranch]?.[selectedSem]?.[currentDay] || defaultSchedule;

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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {currentSchedule.map((item, index) => {
                                // Real-time class detection logic
                                const now = new Date();
                                const currentHour = now.getHours();
                                const currentMin = now.getMinutes();
                                
                                // Parse item time (e.g., "09:00 AM")
                                const [timePart, ampm] = item.time.split(' ');
                                let [hour, min] = timePart.split(':').map(Number);
                                if (ampm === 'PM' && hour < 12) hour += 12;
                                if (ampm === 'AM' && hour === 12) hour = 0;
                                
                                const startTotalMin = hour * 60 + min;
                                const nowTotalMin = currentHour * 60 + currentMin;
                                const duration = parseInt(item.duration) || 1;
                                const endTotalMin = startTotalMin + (duration * 60);
                                
                                const isCurrent = nowTotalMin >= startTotalMin && nowTotalMin < endTotalMin;

                                return (
                                    <div key={index} className={`timetable-card ${isCurrent ? 'active-slot' : ''}`} style={{
                                        background: isCurrent ? 'rgba(253, 224, 71, 0.05)' : 'rgba(255,255,255,0.02)',
                                        padding: '1.5rem',
                                        borderRadius: '24px',
                                        border: isCurrent ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2rem',
                                        position: 'relative',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        {isCurrent && (
                                            <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span className="live-indicator"></span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent-color)' }}>LIVE NOW</span>
                                            </div>
                                        )}

                                        <div style={{ minWidth: '100px' }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>{item.time.split(' ')[0]}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>{item.time.split(' ')[1] || 'AM'}</div>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0 }}>{item.subject}</h3>
                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: '900', 
                                                    padding: '0.25rem 0.6rem', 
                                                    borderRadius: '6px',
                                                    background: item.type === 'Lab' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                                    color: item.type === 'Lab' ? '#3b82f6' : '#a855f7',
                                                    border: `1px solid ${item.type === 'Lab' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`
                                                }}>{item.type}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <MapPin size={14} color="var(--accent-color)" /> {item.room}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={14} /> {item.duration || '1 hr'}
                                                </span>
                                            </div>
                                        </div>

                                        <button className="circle-btn-small">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
