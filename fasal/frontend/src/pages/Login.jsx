import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('fasal_token', res.data.token);
      localStorage.setItem('fasal_farmer_id', res.data.farmer_id);
      navigate(res.data.profile_complete ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-8 page-transition">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-bg-card rounded-2xl shadow-lg p-8 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="text-green-primary" size={28} />
          <span className="text-xl font-bold">Fasal</span>
        </div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        {error && <div className="bg-coral-light text-coral p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Email or Farmer ID</label>
          <input value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent outline-none" placeholder="demo@fasal.app" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-green-primary text-white font-semibold rounded-lg hover:bg-green-dark transition disabled:opacity-50">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-center text-text-secondary text-sm">
          New to Fasal? <Link to="/register" className="text-green-primary font-medium">Create account</Link>
        </p>
      </form>
    </div>
  );
}
