import { useEffect, useMemo, useState } from 'react';
import { CarFront, Search, ShieldCheck, LogOut, Plus, RefreshCw, Trash2 } from 'lucide-react';
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const blank = { make: '', model: '', category: 'Sedan', price: '', quantity: 1 };
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [mode, setMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState({ text: '', category: 'All', maxPrice: '' });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Something went wrong');
    return data;
  }
  async function loadVehicles() {
    if (!token) return;
    try { setVehicles(await request('/vehicles')); } catch (e) { setNotice(e.message); }
  }
  useEffect(() => { loadVehicles(); }, [token]);
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    try {
      if (mode === 'register') await request('/auth/register', { method: 'POST', body: JSON.stringify(auth) });
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: auth.email, password: auth.password }) });
      localStorage.setItem('token', result.access_token); localStorage.setItem('isAdmin', String(result.is_admin));
      setToken(result.access_token); setIsAdmin(result.is_admin); setNotice('Welcome back!');
    } catch (e) { setNotice(e.message); } finally { setBusy(false); }
  }
  async function search() {
    const params = new URLSearchParams();
    if (query.text) { params.set('make', query.text); params.set('model', query.text); }
    if (query.category !== 'All') params.set('category', query.category);
    if (query.maxPrice) params.set('max_price', query.maxPrice);
    try {
      // The API accepts independent filters. Make/model quick search uses make here; category/price work together.
      if (query.text) params.set('make', query.text);
      setVehicles(await request(`/vehicles/search?${params.toString()}`));
    } catch (e) { setNotice(e.message); }
  }
  async function saveVehicle(e) {
    e.preventDefault(); setNotice('');
    const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    try {
      await request(editing ? `/vehicles/${editing}` : '/vehicles', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setForm(blank); setEditing(null); setNotice(editing ? 'Vehicle updated.' : 'Vehicle added.'); await loadVehicles();
    } catch (e) { setNotice(e.message); }
  }
  async function purchase(id) { try { await request(`/vehicles/${id}/purchase`, { method: 'POST' }); setNotice('Purchase recorded; stock updated.'); await loadVehicles(); } catch (e) { setNotice(e.message); } }
  async function restock(id) { const amount = Number(prompt('How many vehicles should be added?', '1')); if (!Number.isInteger(amount) || amount < 1) return; try { await request(`/vehicles/${id}/restock?amount=${amount}`, { method: 'POST' }); setNotice('Stock restocked.'); await loadVehicles(); } catch (e) { setNotice(e.message); } }
  async function remove(id) { if (!confirm('Delete this vehicle?')) return; try { await request(`/vehicles/${id}`, { method: 'DELETE' }); setNotice('Vehicle deleted.'); await loadVehicles(); } catch (e) { setNotice(e.message); } }
  function logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); setToken(''); setIsAdmin(false); setVehicles([]); }
  if (!token) return <main className="auth-shell"><section className="auth-card"><div className="brand-mark"><CarFront size={28}/></div><p className="eyebrow">DRIVEDECK INVENTORY</p><h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p className="muted">A smarter way to explore the showroom.</p><form onSubmit={submitAuth} className="stack">{mode === 'register' && <label>Full name<input required value={auth.name} onChange={e => setAuth({...auth,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({...auth,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required minLength="8" type="password" value={auth.password} onChange={e => setAuth({...auth,password:e.target.value})} placeholder="At least 8 characters"/></label><button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="switch">{mode === 'login' ? 'New to DriveDeck?' : 'Already have an account?'} <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>{notice && <p className="notice">{notice}</p>}<p className="small-note">Admin accounts must be granted administrator access by the project owner.</p></section></main>;
  return <div className="app-shell"><aside className="sidebar"><div className="logo"><span className="logo-icon"><CarFront/></span><span>DriveDeck<small>INVENTORY SUITE</small></span></div><div className="side-label">WORKSPACE</div><div className="nav-item active"><CarFront size={18}/> Vehicle inventory</div><div className="sidebar-bottom"><div className="secure"><ShieldCheck size={18}/><span>Secure session<small>{isAdmin ? 'Administrator' : 'Customer access'}</small></span></div><button className="logout" onClick={logout}><LogOut size={17}/> Sign out</button></div></aside><main className="main"><header className="topbar"><div><p className="eyebrow">SHOWROOM / INVENTORY</p><h1>Vehicle inventory</h1></div><div className="user-pill"><span className="avatar">{isAdmin ? 'A' : 'U'}</span><span>{isAdmin ? 'Administrator' : 'Customer'}<small>Signed in</small></span></div></header><section className="welcome"><div><p className="eyebrow light">YOUR NEXT DRIVE STARTS HERE</p><h2>Find a car that moves you.</h2><p>Browse the collection, compare prices, and explore what's in stock.</p></div><div className="hero-car"><CarFront size={92} strokeWidth={1}/></div></section>{notice && <div className="notice inline-notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}<section className="stats"><div className="stat"><span>LISTED VEHICLES</span><strong>{vehicles.length}</strong><small>Models in this view</small></div><div className="stat"><span>UNITS IN STOCK</span><strong>{vehicles.reduce((n,v)=>n+v.quantity,0)}</strong><small>Available inventory</small></div><div className="stat"><span>IN-STOCK MODELS</span><strong>{vehicles.filter(v=>v.quantity>0).length}</strong><small>Ready to purchase</small></div></section><section className="toolbar"><div><h3>Explore the collection</h3><p className="muted">Search the inventory using your preferences.</p></div><div className="filters"><div className="searchbox"><Search size={17}/><input placeholder="Search make or model" value={query.text} onChange={e=>setQuery({...query,text:e.target.value})} onKeyDown={e=>e.key==='Enter'&&search()}/></div><select value={query.category} onChange={e=>setQuery({...query,category:e.target.value})}><option>All</option><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Coupe</option><option>Electric</option></select><input className="price-filter" type="number" min="0" placeholder="Max price ($)" value={query.maxPrice} onChange={e=>setQuery({...query,maxPrice:e.target.value})}/><button className="secondary" onClick={search}>Filter</button><button className="icon-button" title="Reset filters" onClick={()=>{setQuery({text:'',category:'All',maxPrice:''});loadVehicles();}}><RefreshCw size={17}/></button></div></section>{isAdmin && <section className="admin-panel"><div className="section-heading"><div><p className="eyebrow">ADMIN TOOLS</p><h3>{editing ? 'Update vehicle' : 'Add a vehicle'}</h3></div><span className="admin-badge">ADMIN</span></div><form className="vehicle-form" onSubmit={saveVehicle}><input required placeholder="Make" value={form.make} onChange={e=>setForm({...form,make:e.target.value})}/><input required placeholder="Model" value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Coupe</option><option>Electric</option></select><input required type="number" min="0.01" step="0.01" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/><input required type="number" min="0" step="1" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/><button className="primary" type="submit"><Plus size={16}/>{editing?'Save changes':'Add vehicle'}</button>{editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(blank)}}>Cancel</button>}</form></section>}<section className="vehicle-grid">{vehicles.map(v=><article className="vehicle-card" key={v.id}><div className="car-art"><span className="category-tag">{v.category}</span><CarFront size={100} strokeWidth={1.1}/><span className="car-id">STOCK #{String(v.id).padStart(4,'0')}</span></div><div className="vehicle-content"><div className="make-label">{v.make}</div><h3>{v.model}</h3><div className="price">${Number(v.price).toLocaleString('en-US',{maximumFractionDigits:2})}</div><div className="card-footer"><span className={v.quantity>0?'stock':'stock empty'}><i/> {v.quantity>0?`${v.quantity} available`:'Out of stock'}</span><button className="primary purchase" disabled={v.quantity===0} onClick={()=>purchase(v.id)}>Purchase</button></div>{isAdmin&&<div className="admin-actions"><button onClick={()=>{setEditing(v.id);setForm({make:v.make,model:v.model,category:v.category,price:v.price,quantity:v.quantity});window.scrollTo({top:0,behavior:'smooth'});}}>Edit</button><button onClick={()=>restock(v.id)}><RefreshCw size={14}/> Restock</button><button className="danger" onClick={()=>remove(v.id)}><Trash2 size={14}/> Delete</button></div>}</div></article>)}</section>{vehicles.length===0&&<div className="empty-state"><CarFront size={38}/><h3>No vehicles found</h3><p>Try adjusting your filters, or ask an administrator to add inventory.</p></div>}<footer>DRIVEDECK · CAR DEALERSHIP INVENTORY <span>Built with care for every journey.</span></footer></main></div>;
}
