import { useState, useEffect } from 'react';
import { UploadCloud, File, Trash2, Link as LinkIcon, Database, Loader } from 'lucide-react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';

export default function ResourceManager() {
    const { user } = useAuthContext();
    const [materials, setMaterials] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('CS401');
    const [isUploading, setIsUploading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [syllabuses, setSyllabuses] = useState([]);
    
    // New Material State
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState('Note'); // 'Note' or 'Paper'
    const [fileUrl, setFileUrl] = useState('');
    const [selBranch, setSelBranch] = useState('');
    const [selSyllabus, setSelSyllabus] = useState('C-20');
    const [selSemester, setSelSemester] = useState('1st Sem');
    const [chapter, setChapter] = useState('');

    useEffect(() => {
        // Fetch Master Data
        const bRef = ref(database, 'branches');
        const sRef = ref(database, 'syllabuses');
        onValue(bRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setBranches(Object.keys(data).map(k => ({ id: k, title: typeof data[k] === 'string' ? data[k] : data[k].title })));
            }
        });
        onValue(sRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setSyllabuses(Object.keys(data).map(k => ({ id: k, title: typeof data[k] === 'string' ? data[k] : data[k].title })));
            }
        });

        // Fetch Materials - Now from Global Node
        const matRef = ref(database, 'resources/notes');
        const unsubscribe = onValue(matRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const matList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                // Filter only materials uploaded by this faculty or relevant to their courses if needed
                // For now, show all to link with admin
                setMaterials(matList.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setMaterials([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSimulateUpload = async (e) => {
        e.preventDefault();
        if (!fileName || !fileUrl || !selBranch) return;

        setIsUploading(true);

        // Link with Admin node: resources/notes
        const matRef = push(ref(database, 'resources/notes'));
        await set(matRef, {
            title: fileName,
            url: fileUrl,
            branch: selBranch,
            syllabus: selSyllabus,
            semester: selSemester,
            chapter: chapter || 'General',
            type: fileType,
            isFolder: false,
            parentId: 'root',
            uploadedBy: user?.displayName || user?.email,
            facultyUid: user?.uid,
            timestamp: Date.now()
        });

        setIsUploading(false);
        setFileName('');
        setFileUrl('');
        setChapter('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            await remove(ref(database, `resources/notes/${id}`));
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="admin-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Upload Course Materials</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>LINKED TO GLOBAL HUB</div>
                </div>
                
                <form onSubmit={handleSimulateUpload} style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        {isUploading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                                <h3 style={{ color: 'white' }}>Uploading to Same College Hub...</h3>
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="text" placeholder="Resource Title" value={fileName} onChange={e => setFileName(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                    <select value={fileType} onChange={e => setFileType(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}>
                                        <option value="Note">Note / Study Material</option>
                                        <option value="Paper">Question Paper</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select value={selBranch} onChange={e => setSelBranch(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}>
                                        <option value="">Select Branch</option>
                                        <option value="Common">Common to All</option>
                                        {branches.map(b => <option key={b.id} value={b.title}>{b.title}</option>)}
                                    </select>
                                    <select value={selSemester} onChange={e => setSelSemester(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}>
                                        <option value="1st Sem">1st Semester</option>
                                        <option value="2nd Sem">2nd Semester</option>
                                        <option value="3rd Sem">3rd Semester</option>
                                        <option value="4th Sem">4th Semester</option>
                                        <option value="5th Sem">5th Semester</option>
                                        <option value="6th Sem">6th Semester</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select value={selSyllabus} onChange={e => setSelSyllabus(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}>
                                        {syllabuses.map(s => <option key={s.id} value={s.title}>{s.title} Scheme</option>)}
                                    </select>
                                    <input type="text" placeholder="Chapter / Topic (Optional)" value={chapter} onChange={e => setChapter(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                </div>

                                <input type="text" placeholder="Direct Download URL (e.g. Google Drive Link)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                
                                <button className="btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>Upload to Global Hub</button>
                            </>
                        )}
                    </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Recently Uploaded Global Materials</h3>
                    {materials.slice(0, 10).map(mat => (
                        <div key={mat.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {mat.type === 'Paper' ? <FileSpreadsheet size={24} color="#3b82f6" /> : <File size={24} color="#ef4444" />}
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{mat.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{mat.branch} • {mat.semester} • {mat.syllabus}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(mat.timestamp).toLocaleDateString()}</span>
                                <button onClick={() => handleDelete(mat.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {materials.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No materials found in the global hub.</div>}
                </div>
            </div>

            <div className="admin-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={24} color="var(--accent-color)" /> AI Vector Database</h2>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Materials uploaded here are automatically processed, vectorized, and fed to the Student AI Assistant.
                </p>

                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#22c55e', marginBottom: '0.5rem' }}>100%</div>
                    <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Index Sync Complete</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Student Assistant has latest context</div>
                </div>

                <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Visibility Tags in {selectedCourse}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {materials.flatMap(m => m.tags || []).filter((v, i, a) => a.indexOf(v) === i).map(tag => (
                        <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: 'white' }}>{tag}</span>
                    ))}
                    {materials.flatMap(m => m.tags || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tags available. Add tags when uploading files.</span>}
                </div>
            </div>
        </div>
    );
}
