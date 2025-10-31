import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API || 'http://localhost:4000/api';

function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (j.token) {
      localStorage.setItem('token', j.token);
      onAuth(j.token);
    } else {
      alert(j.error || 'auth failed');
    }
  }

  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" required style={{width:'100%',padding:8,marginBottom:8}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="password" required style={{width:'100%',padding:8,marginBottom:8}}/>
        <button type="submit" style={{padding:8}}>{mode}</button>
      </form>
      <button onClick={()=>setMode(mode==='login'?'register':'login')} style={{marginTop:8}}>
        Switch to {mode==='login'?'register':'login'}
      </button>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(()=>{ if(token) fetchList(); }, [token]);

  async function fetchList() {
    const res = await fetch(`${API}/files/list`, { headers: { Authorization: 'Bearer '+token }});
    const j = await res.json();
    setFiles(j.files || []);
  }

  async function upload(e) {
    e.preventDefault();
    if(!file) return alert('pick a file');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/files/upload`, { method:'POST', body: fd, headers: { Authorization: 'Bearer '+token }});
    const j = await res.json();
    if (j.key) {
      alert('uploaded');
      fetchList();
    } else alert(j.error || 'upload failed');
  }

  async function download(key) {
    const res = await fetch(`${API}/files/download/${encodeURIComponent(key)}`, { headers: { Authorization: 'Bearer '+token }});
    if (!res.ok) return alert('download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = key.split('/').pop();
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function del(key) {
    if(!confirm('Delete file?')) return;
    const res = await fetch(`${API}/files/delete/${encodeURIComponent(key)}`, { method:'DELETE', headers: { Authorization: 'Bearer '+token }});
    const j = await res.json();
    if (j.ok) fetchList(); else alert(j.error || 'delete failed');
  }

  if (!token) return <Auth onAuth={t=>setToken(t)} />;

  return (
    <div style={{maxWidth:800, margin:'20px auto', padding:20}}>
      <h1>Cloud Drive</h1>
      <form onSubmit={upload}>
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <button type="submit" style={{marginLeft:8}}>Upload</button>
      </form>
      <button onClick={()=>{ localStorage.removeItem('token'); setToken(''); }}>Logout</button>

      <h3>Your Files</h3>
      <ul>
        {files.map(f => (
          <li key={f.key} style={{marginBottom:8}}>
            <strong>{f.key.split('/').pop()}</strong> — {(f.size/1024).toFixed(1)} KB — {new Date(f.lastModified).toLocaleString()}
            <div>
              <button onClick={()=>download(f.key)}>Download</button>
              <button onClick={()=>del(f.key)} style={{marginLeft:8}}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
