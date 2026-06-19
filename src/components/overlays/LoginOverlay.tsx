import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Phone, X } from 'lucide-react';
import '../../styles/overlay.css';

const PinInput: React.FC<{ value: string; onChange: (v: string) => void; hasError?: boolean; disabled?: boolean }> = ({ value, onChange, hasError, disabled }) => {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const digits = value.padEnd(4, '').split('').slice(0, 4);

  const handleInput = (i: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const d = [...digits]; d[i] = char;
    onChange(d.join('').replace(/\s/g, ''));
    if (char && i < 3) refs[i + 1].current?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(text);
    refs[Math.min(text.length, 3)].current?.focus();
    e.preventDefault();
  };

  return (
      <div className="ov-pin-row">
        {[0,1,2,3].map(i => (
            <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
                   value={digits[i] || ''} onChange={e => handleInput(i, e.target.value)}
                   onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste} disabled={disabled}
                   className={`ov-pin-box ${hasError ? 'error' : ''} ${digits[i] ? 'filled' : ''}`}
                   autoComplete="off" />
        ))}
      </div>
  );
};

const LoginOverlay: React.FC = () => {
  const { setOverlay, signin } = useStore();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone) { setError('Enter your phone number'); return; }
    if (!/^(\+254|0)[7][0-9]{8}$/.test(cleanPhone)) {
      setError('Enter a valid Kenyan number (e.g. 0712345678)'); return;
    }
    if (pin.length !== 4) { setError('Enter your 4-digit PIN'); return; }

    setLoading(true);
    try {
      const { package: pkg, profiles } = await signin(cleanPhone, pin);
      setOverlay(null);
      if (pkg === 'solo' && profiles.length === 1) {
        navigate('/home');
      } else {
        setOverlay('profile-select');
      }
    } catch (e) {
      const message = (e as { message?: string }).message ?? '';
      setError(message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="ov-backdrop" onClick={() => setOverlay(null)}>
        <div className="ov-container" onClick={e => e.stopPropagation()}>
          <div className="ov-card">
            <button className="ov-close" onClick={() => setOverlay(null)}><X size={18} /></button>
            <div className="ov-logo">High<span>Scores</span></div>

            <h2 className="ov-title">👋 Welcome Back!</h2>
            <p className="ov-sub">Continue your learning streak 🔥</p>

            {error && <div className="ov-error"><Shield size={14} />{error}</div>}

            <div className="ov-form-group">
              <label className="ov-label"><Phone size={15} /> Phone Number</label>
              <input className="ov-input" type="tel" placeholder="0712 345 678"
                     value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                     onKeyDown={e => e.key === 'Enter' && handleLogin()} disabled={loading} />
            </div>

            <div className="ov-form-group">
              <label className="ov-label">🔐 Account PIN</label>
              <PinInput value={pin} onChange={v => { setPin(v); setError(''); }}
                        hasError={!!error && pin.length < 4} disabled={loading} />
            </div>

            <button className="ov-submit" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in…' : <><span>Log In</span><ArrowRight size={18} /></>}
            </button>

            <p className="ov-footer-text">
              Don't have an account?{' '}
              <button className="ov-link" onClick={() => setOverlay('signup')}>Sign Up</button>
            </p>
          </div>
        </div>
      </div>
  );
};

export default LoginOverlay;