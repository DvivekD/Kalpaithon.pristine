import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, TrendingUp, Sun, ArrowRight } from 'lucide-react';

export default function Landing() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId;
    const fadeDuration = 0.5; // seconds

    const handleFrame = () => {
      if (!video) return;
      const t = video.currentTime;
      const d = video.duration || 10;
      
      // Calculate opacity based on fade in/out
      let opacity = 1;
      if (t < fadeDuration) {
        opacity = t / fadeDuration;
      } else if (d - t < fadeDuration) {
        opacity = (d - t) / fadeDuration;
      }
      
      video.style.opacity = Math.max(0, Math.min(1, opacity));
      rafId = requestAnimationFrame(handleFrame);
    };

    const handleEnded = () => {
      if (!video) return;
      video.style.opacity = 0;
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    rafId = requestAnimationFrame(handleFrame);

    return () => {
      if (video) video.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-landing-dark text-white relative overflow-hidden page-transition">
      {/* Seamless Looping Video Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[#0B1112]">
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-100"
          style={{ opacity: 0 }}
          autoPlay 
          muted 
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
        />
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <Sprout className="text-green-primary" size={28} />
          <span className="text-xl font-bold tracking-wide">Fasal<span className="text-white/50 text-sm ml-2 font-mono">v4.0.2</span></span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium border border-white/20 rounded-lg hover:bg-white/10 transition">Log in</Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-medium bg-green-primary rounded-lg hover:bg-green-dark transition">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-24 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              From seed to sale.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-primary to-amber">Every decision, scored.</span>
            </h1>
            <p className="mt-6 text-xl text-white/60 max-w-xl">
              AI-powered farm companion for Karnataka farmers. One location. Three stages. Maximum profit.
            </p>
            <div className="mt-10 flex gap-4 flex-wrap">
              <Link to="/register" className="px-8 py-4 bg-green-primary text-white font-semibold rounded-xl text-lg hover:bg-green-dark transition flex items-center gap-2 shadow-[0_0_20px_rgba(29,158,117,0.4)]">
                Get started free <ArrowRight size={20} />
              </Link>
              <a href="#how" className="px-8 py-4 border border-white/20 font-semibold rounded-xl text-lg hover:bg-white/10 transition">
                See how it works
              </a>
            </div>
          </div>

          {/* Right: Glass Bubble Animation */}
          <div className="relative flex justify-center items-center h-[500px]">
            <div className="glass-bubble w-[350px] h-[350px] rounded-full flex justify-center items-center relative overflow-hidden group">
              {/* Internal glow */}
              <div className="absolute w-[200px] h-[200px] rounded-full bg-green-primary/30 blur-[40px] group-hover:bg-green-primary/50 transition duration-700"></div>
              
              {/* Crisp Grass Image */}
              <img 
                src="/grass.png" 
                alt="Crisp grass blade" 
                className="w-48 h-64 object-contain relative z-10 drop-shadow-2xl scale-110 group-hover:scale-125 transition duration-700 ease-out" 
              />
              
              {/* Glass reflections */}
              <div className="absolute top-[10%] left-[20%] w-[100px] h-[30px] rounded-full bg-white/30 rotate-[-45deg] blur-[2px]"></div>
              <div className="absolute bottom-[15%] right-[15%] w-[60px] h-[20px] rounded-full bg-white/20 rotate-[-45deg] blur-[4px]"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { value: '₹90,000 Cr', label: 'Lost annually post-harvest' },
          { value: '86%', label: 'Farmers are small/marginal' },
          { value: '40%', label: 'Revenue lost from wrong sell timing' }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md hover:bg-white/10 transition duration-300">
            <div className="text-4xl font-bold text-amber drop-shadow-md">{s.value}</div>
            <div className="mt-2 text-white/50 text-sm font-medium uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="max-w-7xl mx-auto px-8 pb-24 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-12">Three stages. Complete season companion.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Sun size={32} />, title: 'Stage 1 — Plan', desc: 'Know what to plant before you plant it', color: 'border-green-primary bg-green-primary/10' },
            { icon: <Sprout size={32} />, title: 'Stage 2 — Grow', desc: 'Week-by-week guidance through harvest', color: 'border-amber bg-amber/10' },
            { icon: <TrendingUp size={32} />, title: 'Stage 3 — Sell', desc: 'Sell at the right time, to the right buyer', color: 'border-coral bg-coral/10' },
          ].map((s, i) => (
            <div key={i} className={`border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur-sm transition hover:scale-[1.02] hover:bg-white/10`}>
              <div className={`mb-6 inline-flex p-4 rounded-xl ${s.color} text-white shadow-lg`}>{s.icon}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm relative z-10">
        Built for Karnataka farmers · Free to use · Powered by AI
      </footer>
    </div>
  );
}
