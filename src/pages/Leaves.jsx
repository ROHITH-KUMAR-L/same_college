import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
    FileText, 
    Calendar, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Send,
    Plus,
    X,
    Filter
} from 'lucide-react';
import './Admin.css';

export default function LeavePortal() {
    const { user } = useAuthContext();
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [leaveType, setLeaveType] = useState('Duty Leave');
    
    const leaveHistory = [
        { id: '#LV9042', type: 'Duty Leave', subject: 'Sports Meet', from: 'May 02', to: 'May 03', status: 'Approved', color: '#22c55e' },
        { id: '#LV9041', type: 'Medical Leave', subject: 'Fever', from: 'April 20', to: 'April 21', status: 'Pending', color: '#facc15' },
        { id: '#LV9039', type: 'Duty Leave', subject: 'Workshop', from: 'April 10', to: 'April 10', status: 'Approved', color: '#22c55e' },
    ];

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingTop: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Leave <span style={{ color: 'var(--accent-color)' }}>Portal</span></h1>
                    <p style={{ color: 'var(--text-muted)' }}>Apply for duty leave, medical leave, or personal absence.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem' }} onClick={() => setIsApplyOpen(true)}>
                    <Plus size={20} /> Apply New Leave
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                {/* Leave History Table */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>Application History</h2>
                        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                            <Filter size={14} /> Filter
                        </button>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Type</th>
                                    <th>Reason / Subject</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveHistory.map((leave, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{leave.id}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: '800', 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '6px',
                                                background: leave.type === 'Duty Leave' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                                color: leave.type === 'Duty Leave' ? '#3b82f6' : '#a855f7'
                                            }}>{leave.type}</span>
                                        </td>
                                        <td style={{ color: 'white', fontWeight: '600' }}>{leave.subject}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{leave.from} - {leave.to}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: leave.color, fontSize: '0.85rem', fontWeight: '800' }}>
                                                {leave.status === 'Approved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                {leave.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Leave Policy Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '1.25rem' }}>Leave Balance</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <BalanceItem label="Medical Leave" count="08" total="10" color="#ef4444" />
                            <BalanceItem label="Duty Leave" count="Unlimited" total="N/A" color="#3b82f6" />
                            <BalanceItem label="Casual Leave" count="03" total="05" color="#facc15" />
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '1.5rem', background: 'rgba(253, 224, 71, 0.03)', border: '1px solid rgba(253, 224, 71, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <AlertCircle size={18} color="var(--accent-color)" />
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', margin: 0 }}>Important Note</h3>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Duty leave applications must be accompanied by a scanned copy of the event invitation or certificate. Medical leaves exceeding 3 days require a doctor's certificate.
                        </p>
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {isApplyOpen && (
                <div className="test-modal-overlay" onClick={() => setIsApplyOpen(false)}>
                    <div className="test-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="test-modal-close" onClick={() => setIsApplyOpen(false)}><X size={20} /></button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Apply for Leave</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Leave Type</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['Duty Leave', 'Medical', 'Personal'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setLeaveType(type)}
                                            style={{ 
                                                flex: 1, 
                                                padding: '0.75rem', 
                                                borderRadius: '12px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: '700',
                                                background: leaveType === type ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                                color: leaveType === type ? 'black' : 'white',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>From Date</label>
                                    <input type="date" className="btn-outline" style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>To Date</label>
                                    <input type="date" className="btn-outline" style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Reason / Subject</label>
                                <input type="text" placeholder="e.g. Inter-college Sports Meet" className="btn-outline" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', textAlign: 'left' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Supporting Document</label>
                                <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }}>
                                    <Plus size={24} color="var(--accent-color)" style={{ marginBottom: '0.5rem' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Scan/Photo</span>
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} onClick={() => setIsApplyOpen(false)}>
                                Submit Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BalanceItem({ label, count, total, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <strong style={{ color: 'white', fontSize: '1rem' }}>{count}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {total}</span>
            </div>
        </div>
    );
}
