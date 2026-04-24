import { useState, useEffect } from 'react';
import { User, MapPin, Droplets, Ruler, Save, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farmSize, setFarmSize] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      setFarmSize(r.data.farm_size || '');
      setWaterSource(r.data.water_source || '');
      setNotes(r.data.misc_notes || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/profile/setup', {
        district_manual: profile.district,
        water_source: waterSource,
        farm_size: parseFloat(farmSize),
        misc_notes: notes
      });
      alert('Profile updated');
    } catch (e) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-secondary">Loading profile...</div>;
  if (!profile) return <div className="text-center py-16 text-text-secondary">Profile not found</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      {/* Farmer ID Card */}
      <div className="bg-green-primary rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <p className="text-white/70 text-sm">Farmer ID</p>
            <p className="text-3xl font-bold tracking-wider">{profile.farmer_id}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-white/60">Name</p>
            <p className="font-medium">{profile.name}</p>
          </div>
          <div>
            <p className="text-white/60">District</p>
            <p className="font-medium">{profile.district}</p>
          </div>
          <div>
            <p className="text-white/60">Soil type</p>
            <p className="font-medium">{profile.soil_type}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Ruler size={16} /> Farm details</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Farm size (acres)</label>
          <input type="number" step="0.1" value={farmSize} onChange={e => setFarmSize(e.target.value)}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Water source</label>
          <div className="flex gap-3">
            {['Rainfed','Borewell','Canal'].map(ws => (
              <button key={ws} type="button" onClick={() => setWaterSource(ws)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${waterSource === ws ? 'border-green-primary bg-green-light text-green-dark' : 'border-border hover:border-green-primary/50'}`}>
                {ws}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-green-primary" placeholder="e.g. near river, partial shade" />
        </div>
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-green-primary text-white font-semibold rounded-lg hover:bg-green-dark transition disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Telegram section */}
      <div className="bg-bg-card rounded-xl border border-border p-6">
        <h3 className="font-bold text-sm mb-3">Connect Telegram Bot</h3>
        <p className="text-sm text-text-secondary mb-3">Get predictions, timeline updates, and sell alerts directly on Telegram.</p>
        <a href="https://t.me/Kisaan1207bot" target="_blank" rel="noreferrer"
          className="inline-block px-6 py-2.5 bg-[#0088cc] text-white text-sm font-semibold rounded-lg hover:bg-[#006daa] transition">
          Open @Kisaan1207bot on Telegram
        </a>
      </div>
    </div>
  );
}
