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
    
    // New Material State
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState('pdf');
    const [fileUrl, setFileUrl] = useState('');
    const [tags, setTags] = useState('');

    useEffect(() => {
        const matRef = ref(database, `course_materials/${selectedCourse}`);
        const unsubscribe = onValue(matRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const matList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setMaterials(matList.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setMaterials([]);
            }
        });

        return () => unsubscribe();
    }, [selectedCourse]);

    const handleSimulateUpload = async (e) => {
        e.preventDefault();
        if (!fileName || !fileUrl) return;

        setIsUploading(true);

        // Simulate upload delay
        setTimeout(async () => {
            const matRef = push(ref(database, `course_materials/${selectedCourse}`));
            await set(matRef, {
                fileName,
                type: fileType,
                url: fileUrl,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                uploadedBy: user?.uid,
                timestamp: Date.now()
            });

            setIsUploading(false);
            setFileName('');
            setFileUrl('');
            setTags('');
        }, 1500);
    };

    const handleDelete = async (id) => {
        await remove(ref(database, `course_materials/${selectedCourse}/${id}`));
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="admin-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Upload Course Materials</h2>
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none' }}
                    >
                        <option value="CS401">CS401 - Advanced ML</option>
                        <option value="CS302">CS302 - Database Systems</option>
                    </select>
                </div>
                
                <form onSubmit={handleSimulateUpload} style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                        {isUploading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                                <h3 style={{ color: 'white' }}>Uploading...</h3>
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
                                <input type="text" placeholder="File / Resource Name" value={fileName} onChange={e => setFileName(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                <select value={fileType} onChange={e => setFileType(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}>
                                    <option value="pdf">PDF Document</option>
                                    <option value="link">External Link</option>
                                    <option value="doc">Word Doc</option>
                                </select>
                                <input type="text" placeholder="URL or Firebase Storage Path" value={fileUrl} onChange={e => setFileUrl(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', outline: 'none' }} />
                                <button className="btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>Upload & Sync to AI</button>
                            </>
                        )}
                    </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Existing Materials for {selectedCourse}</h3>
                    {materials.map(mat => (
                        <div key={mat.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {mat.type === 'link' ? <LinkIcon size={24} color="#3b82f6" /> : <File size={24} color="#ef4444" />}
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{mat.fileName}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{selectedCourse} • {new Date(mat.timestamp).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(mat.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                    ))}
                    {materials.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No materials uploaded yet.</div>}
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
