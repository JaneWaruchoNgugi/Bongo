import React, { useState, useRef } from 'react';
import { useStore, type FamilyPackage } from '../../store/useStore';
// import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import '../../styles/overlay.css';
import { PACKAGES } from "../../hooks/Packages.ts";

const PinInput: React.FC<{ value: string; onChange: (v: string) => void; hasError?: boolean }> = ({ value, onChange, hasError }) => {
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
                   onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
                   className={`ov-pin-box ${hasError ? 'error' : ''} ${digits[i] ? 'filled' : ''}`}
                   autoComplete="off" />
        ))}
      </div>
  );
};

const SignUpOverlay: React.FC = () => {
  const { setOverlay, signup, signupPackage } = useStore();
  // const navigate = useNavigate();

  // steps: 1=phone+pin, 2=otp, 3=package
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [accountPin, setAccountPin] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<FamilyPackage | null>(signupPackage ?? null);

  const cleanPhone = phone.replace(/\s/g, '');

  const handleNext1 = () => {
    setError('');
    if (!cleanPhone) { setError('Enter your phone number'); return; }
    if (!/^(\+254|0)[7][0-9]{8}$/.test(cleanPhone)) {
      setError('Enter a valid Kenyan number (e.g. 0712345678)'); return;
    }
    if (accountPin.length !== 4) { setError('Set a 4-digit PIN'); return; }
    // Uniqueness is enforced server-side at sign-up; proceed to OTP step.
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 800);
  };

  const handleVerifyOtp = () => {
    if (otp !== '1234') { setError('Invalid OTP. Use 1234 for demo.'); return; }
    setError('');
    // If package was pre-selected from landing page, skip step 3
    if (signupPackage) {
      handleFinish(signupPackage);
    } else {
      setStep(3);
    }
  };

  const handlePackageNext = () => {
    if (!selectedPackage) { setError('Please select a package'); return; }
    setError('');
    handleFinish(selectedPackage);
  };

  const handleFinish = async (pkg: FamilyPackage) => {
    setError('');
    setLoading(true);
    try {
      await signup(cleanPhone, accountPin, pkg);
      setOverlay('profile-select');
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      const message = (e as { message?: string }).message ?? '';
      setError(
        code.includes('already-exists') || message.includes('already registered')
          ? 'This number is already registered.'
          : message || 'Could not create your account. Please try again.'
      );
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="ov-backdrop" onClick={() => setOverlay(null)}>
        <div className="ov-container" onClick={e => e.stopPropagation()}>
          <div className="ov-card">
            <button className="ov-close" onClick={() => setOverlay(null)}>✕</button>
            <div className="ov-logo">High<span>Scores</span></div>

            <div className="ov-steps">
              {[1,2,3].map(n => (
                  <React.Fragment key={n}>
                    <div className={`ov-step-dot ${step === n ? 'current' : step > n ? 'done' : ''}`}>
                      {step > n ? <CheckCircle size={14} /> : n}
                    </div>
                    {n < 3 && <div className={`ov-step-line ${step > n ? 'done' : ''}`} />}
                  </React.Fragment>
              ))}
            </div>

            {/* Step 1: Phone + PIN */}
            {step === 1 && (
                <div className="ov-step-body">
                  <h2 className="ov-title">👋 Get Started</h2>
                  <p className="ov-sub">Enter your phone number to create an account</p>
                  {error && <div className="ov-error"><Shield size={14} />{error}</div>}
                  <div className="ov-form-group">
                    <label className="ov-label"><Phone size={15} /> Phone Number</label>
                    <input className="ov-input" type="tel" placeholder="0712 345 678"
                           value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} />
                    <span className="ov-hint">Used to log in to your account</span>
                  </div>
                  <div className="ov-form-group">
                    <label className="ov-label">🔐 Set PIN</label>
                    <PinInput value={accountPin} onChange={setAccountPin} hasError={!!error && accountPin.length < 4} />
                    <span className="ov-hint">All profiles on this account share this PIN</span>
                  </div>
                  <button className="ov-submit" onClick={handleNext1} disabled={loading}>
                    {loading ? 'Sending OTP…' : <><span>Continue</span><ArrowRight size={18} /></>}
                  </button>
                  <p className="ov-footer-text">
                    Already have an account?{' '}
                    <button className="ov-link" onClick={() => setOverlay('login')}>Log In</button>
                  </p>
                </div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
                <div className="ov-step-body">
                  <h2 className="ov-title">📱 Verify Number</h2>
                  <p className="ov-sub">Enter the code sent to <strong>{cleanPhone}</strong></p>
                  {error && <div className="ov-error"><Shield size={14} />{error}</div>}
                  <div className="ov-demo-note">🧪 Demo — use code <strong>1234</strong></div>
                  <div className="ov-form-group" style={{ textAlign: 'center' }}>
                    <PinInput value={otp} onChange={v => { setOtp(v); setError(''); }} hasError={!!error} />
                  </div>
                  <button className="ov-submit" onClick={handleVerifyOtp}>
                    <span>Verify</span><ArrowRight size={18} />
                  </button>
                  <button className="ov-back-btn" onClick={() => { setStep(1); setOtp(''); setError(''); }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
            )}

            {/* Step 3: Package (only shown when no pre-selected package) */}
            {step === 3 && (
                <div className="ov-step-body">
                  <h2 className="ov-title">📦 Choose a Package</h2>
                  <p className="ov-sub">How many students are in your family?</p>
                  {error && <div className="ov-error"><Shield size={14} />{error}</div>}
                  <div className="ov-plans-grid">
                    {PACKAGES.map(pkg => {
                      const Icon = pkg.icon;
                      const isSelected = selectedPackage === pkg.id;
                      return (
                          <button key={pkg.id}
                                  className={`ov-plan-card ${isSelected ? 'selected' : ''}`}
                                  style={isSelected ? { borderColor: pkg.color, background: `${pkg.color}10` } : {}}
                                  onClick={() => { setSelectedPackage(pkg.id); setError(''); }}>
                            {pkg.popular && <div className="ov-plan-popular" style={{ background: pkg.color }}>POPULAR</div>}
                            <div className="ov-plan-icon" style={{ background: `${pkg.color}18`, color: pkg.color }}>
                              <Icon size={22} />
                            </div>
                            <div className="ov-plan-name">{pkg.label}</div>
                            <div className="ov-plan-price">
                              <span className="ov-plan-amount">{pkg.price}</span>
                              <span className="ov-plan-period">{pkg.period}</span>
                            </div>
                            {isSelected && <CheckCircle size={18} color={pkg.color} style={{ marginTop: '0.5rem' }} />}
                          </button>
                      );
                    })}
                  </div>
                  <button className="ov-submit" onClick={handlePackageNext} style={{ marginTop: '1rem' }}>
                    <span>Continue</span><ArrowRight size={18} />
                  </button>
                  <button className="ov-back-btn" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default SignUpOverlay;