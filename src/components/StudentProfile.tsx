import React, {useEffect, useState, useRef} from 'react';
import {useStore, type EducationLevel} from '../store/useStore';
import {useNavigate} from 'react-router-dom';
import {Trophy, Settings, Zap, Flame, Star, CheckCircle, Shield, Users, Camera, LogOut} from 'lucide-react';
import '../styles/profile.css';
import {LEVEL_CONFIG} from '../hooks/LevelConfigs';
import {avatarUrl, AVATARS} from '../hooks/Packages.ts';
import {subscribeProgress, type ProgressDoc} from '../lib/learn';
import {levelInfo} from '../lib/gamification';
import {evaluateAchievements} from '../lib/achievements';

const LEVEL_OPTIONS = [
    {id: 'lower_primary' as EducationLevel, ...LEVEL_CONFIG.lower_primary},
    {id: 'middle_school' as EducationLevel, ...LEVEL_CONFIG.middle_school},
    {id: 'senior_school' as EducationLevel, ...LEVEL_CONFIG.senior_school},
];

const StudentProfile: React.FC = () => {
    const {isLoggedIn, user, accountId, updateUser, setOverlay} = useStore();
    const navigate = useNavigate();

    const activeProfile = user ? (user.profiles.find(p => p.id === user.activeProfileId) ?? user.profiles[0]) : null;

    const [tab, setTab] = useState<'badges' | 'account'>('badges');
    const [editName, setEditName] = useState(activeProfile?.username ?? '');
    const [saveMsg, setSaveMsg] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState<ProgressDoc>({});
    const fileRef = useRef<HTMLInputElement>(null);

    // XP / streak / badges live in the per-profile progress doc (single source of truth).
    useEffect(() => {
        if (!accountId || !activeProfile) return;
        return subscribeProgress(accountId, activeProfile.id, setProgress);
    }, [accountId, activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isLoggedIn || !user || !activeProfile) {
        return (
            <div className="pr-guest">
                <div className="pr-guest-icon"><Shield size={32}/></div>
                <h2>Sign in to view your profile</h2>
                <p>Track your progress, badges, and achievements.</p>
                <button onClick={() => navigate('/')} className="pr-guest-btn">Go Home</button>
            </div>
        );
    }

    const lvl = LEVEL_OPTIONS.find(l => l.id === activeProfile.educationLevel)!;
    const xp = progress.xp ?? 0;
    const streak = progress.streak ?? 0;
    const li = levelInfo(xp);
    const achievements = evaluateAchievements(progress);
    const earnedAch = achievements.filter(a => a.unlocked).length;

    const saveAvatar = (avatar: string) =>
        updateUser({profiles: user.profiles.map(p => p.id === activeProfile.id ? {...p, avatar} : p)});

    // Downscale + compress to a small JPEG so the photo fits comfortably in the
    // Firestore account document (which has a 1 MB limit) and loads fast.
    const compressImage = (file: File, max = 256): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    const scale = Math.min(1, max / Math.max(img.width, img.height));
                    const w = Math.round(img.width * scale);
                    const h = Math.round(img.height * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject(new Error('no-canvas')); return; }
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        try {
            const dataUrl = await compressImage(file);
            saveAvatar(dataUrl); // persisted to Firestore via updateUser → patchAccount
            setSaveMsg('Photo updated!');
            setTimeout(() => setSaveMsg(''), 2000);
        } catch {
            setError('Could not process that image. Try another one.');
        } finally {
            e.target.value = ''; // allow re-selecting the same file
        }
    };

    const handleSave = () => {
        setError('');
        if (!editName.trim()) {
            setError('Name cannot be empty');
            return;
        }
        updateUser({
            profiles: user.profiles.map(p =>
                p.id === activeProfile.id ? {...p, username: editName.trim()} : p
            )
        });
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(''), 2000);
    };

    return (
        <div className="pr-root">

            {/*/!* Profile Header *!/*/}
            {/*<div className="pr-page-header">*/}
            {/*                  <button className="pr-page-header-logout" onClick={() => {*/}
            {/*        useStore.getState().logout();*/}
            {/*        navigate('/');*/}
            {/*    }}>*/}
            {/*        <LogOut size={15}/> Log Out*/}
            {/*    </button>*/}
            {/*</div>*/}


            <div className="pr-hero" style={{background: 'linear-gradient(135deg, #0f5132 0%, #157347 55%, #2f9e6a 100%)'}}>
                <div className="pr-hero-orb"/>
                <div className="pr-hero-inner">
                    <div className="pr-hero-avatar pr-hero-avatar--clickable" onClick={() => setTab('account')}>
                        <img src={avatarUrl(activeProfile.avatar || AVATARS[0])} alt="avatar" width={72} height={72}
                             className="pr-hero-avatar-img"/>
                        <div className="pr-hero-avatar-cam"><Camera size={12} color="#fff"/></div>
                    </div>
                    <div className="pr-hero-info">
                        <h1 className="pr-hero-name">{activeProfile.username}</h1>
                        <span className="pr-hero-level">{lvl.emoji} {lvl.label} · Grade {activeProfile.grade}</span>
                        <div className="pr-hero-pills">
                            <span className="pr-pill"><Flame size={12}/> {streak}d streak</span>
                            <span className="pr-pill"><Zap size={12}/> {xp} XP</span>
                            <span className="pr-pill"><Star size={12}/> {earnedAch} badges</span>
                        </div>
                    </div>
                </div>

                <div className="pr-hero-xp">
                    <div className="pr-hero-xp-labels">
                        <span>Level {li.level}</span>
                        <span>{li.inLevel} / {li.need} XP</span>
                    </div>
                    <div className="pr-hero-xp-track">
                        <div className="pr-hero-xp-fill" style={{width: `${li.pct}%`}}/>
                    </div>
                </div>

                <div className="pr-hero-actions">
                    {user.profiles.length > 1 && (
                        <button className="pr-switch-btn" onClick={() => setOverlay('profile-select')}>
                            <Users size={13}/> Switch Profile
                        </button>
                    )}
                    <button className="pr-switch-btn pr-logout-btn" onClick={() => {
                        useStore.getState().logout();
                        navigate('/');
                    }}>
                        <LogOut size={13}/> Log Out
                    </button>
                </div>
            </div>


            {/* Tabs */}
            <div className="pr-tabs">
                <button className={`pr-tab ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>
                    <Trophy size={15}/> Badges
                </button>
                <button className={`pr-tab ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}>
                    <Settings size={15}/> Account
                </button>
            </div>

            <div className="pr-content">

                {tab === 'badges' && (
                    <div className="pr-badges">
                        <div className="pr-badges-summary">
                            <span className="pr-bs-text">🏆 {earnedAch} of {achievements.length} badges earned</span>
                            <span className="pr-bs-xp">{xp} XP</span>
                        </div>
                        <div className="pr-ach-list">
                            {achievements.map(a => (
                                <div key={a.id} className={`pr-ach-item ${a.unlocked ? 'earned' : 'locked'}`}>
                                    <div className="pr-ach-emoji-wrap">
                                        <span className="pr-ach-emoji">{a.icon}</span>
                                        {!a.unlocked && <span className="pr-ach-lock">🔒</span>}
                                    </div>
                                    <div className="pr-ach-body">
                                        <span className="pr-ach-title">{a.title}</span>
                                        <span className="pr-ach-desc">{a.desc}</span>
                                    </div>
                                    {a.unlocked
                                        ? <CheckCircle size={18} color="#157347"/>
                                        : <span className="pr-ach-xp">{Math.min(a.current, a.goal)}/{a.goal}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'account' && (
                    <div className="pr-account">
                        {error && <div className="pr-msg pr-msg-error"><Shield size={14}/> {error}</div>}
                        {saveMsg && <div className="pr-msg pr-msg-success"><CheckCircle size={14}/> {saveMsg}</div>}

                        <div className="pr-field pr-field--avatar">
                            <label className="pr-label">Avatar</label>
                            <div className="pr-avatar-row">
                                <div className="pr-avatar-grid">
                                    {AVATARS.map(a => (
                                        <button key={a}
                                                className={`pr-avatar-opt ${activeProfile.avatar === a ? 'selected' : ''}`}
                                                onClick={() => saveAvatar(a)}>
                                            <img src={avatarUrl(a)} alt={a} width={36} height={36}/>
                                        </button>
                                    ))}
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="pr-hidden" onChange={handleUpload}/>
                                <button className="pr-upload-btn" onClick={() => fileRef.current?.click()}>
                                    <Camera size={14}/> Upload Photo
                                </button>
                            </div>
                        </div>

                        <div className="pr-field">
                            <label className="pr-label">Display Name</label>
                            <input className="pr-input" value={editName} onChange={e => setEditName(e.target.value)}/>
                        </div>

                        <div className="pr-field">
                            <label className="pr-label">Phone Number</label>
                            <input className="pr-input pr-input-disabled" value={user.phone} disabled/>
                            <span className="pr-hint">Cannot be changed</span>
                        </div>

                        <button className="pr-save-btn" onClick={handleSave}>
                            <CheckCircle size={16}/> Save Changes
                        </button>

                        <div className="pr-danger">
                            <div className="pr-danger-header">
                                <span>⚠️</span>
                                <div>
                                    <p className="pr-danger-title">Danger Zone</p>
                                    <p className="pr-danger-sub">This action is permanent and cannot be undone.</p>
                                </div>
                            </div>
                            <button className="pr-delete-btn">Delete Account</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfile;
