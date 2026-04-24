import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import api from '../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmerId, setFarmerId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('fasal_token', res.data.token);
      localStorage.setItem('fasal_farmer_id', res.data.farmer_id);
      setFarmerId(res.data.farmer_id);
      setTimeout(() => navigate('/onboarding'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  if (farmerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary page-transition">
        <div className="bg-bg-card rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Sprout className="text-green-primary" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Fasal!</h2>
          <div className="bg-green-light border border-green-primary/30 rounded-xl p-6 mb-4">
            <p className="text-sm text-text-secondary mb-1">Your Farmer ID</p>
            <p className="text-3xl font-bold text-green-primary tracking-wider">{farmerId}</p>
          </div>
          <p className="text-text-secondary text-sm">Save this — you can use it to login.<br />Redirecting to setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex page-transition">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-green-primary items-center justify-center p-12">
        <div className="text-white max-w-md">
          <Sprout size={48} className="mb-6" />
          <h2 className="text-4xl font-bold mb-4">From seed to sale.</h2>
          <p className="text-white/70 text-lg">AI-powered decisions for every stage of your crop season.</p>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg-primary">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <h2 className="text-3xl font-bold">Create account</h2>
          <p className="text-text-secondary">Start your first season with Fasal</p>
          {error && <div className="bg-coral-light text-coral p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-primary text-white font-semibold rounded-lg hover:bg-green-dark transition disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center text-text-secondary text-sm">
            Already have an account? <Link to="/login" className="text-green-primary font-medium">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
