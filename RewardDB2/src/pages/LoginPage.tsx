import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { campusList } from '../components/campusList';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import FireworksBackground from '../components/FireworksBackground';

const LoginPage: React.FC = () => {
  const houseList = ['Malhar', 'Bageshree', 'Bhairav'];
  const [user] = useAuthState(auth);
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false); // true if any required OR portfolio missing
  const [requiredMissing, setRequiredMissing] = useState(false);
  const [portfolioMissing, setPortfolioMissing] = useState(false);
  // Track whether we've actually completed a profile check for the CURRENT user id
  const [hasRunProfileCheck, setHasRunProfileCheck] = useState(false);
  const [step, setStep] = useState(-1); // -1: show sign-in, 0+: onboarding steps
  const [campus, setCampus] = useState('');
  const [house, setHouse] = useState('');
  const [program, setProgram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Normalize a user-entered URL: if it lacks a scheme, prepend https://
  const normalizeUrl = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed.replace(/^\/+/, '');
  };

  const programList = ['SoP','SoB','SoSC','SoFD','SoDA','SoM','SoF','SoE'];
  const TOTAL_STEPS = 6; // full flow when required fields missing
  const PORTFOLIO_STEP_INDEX = 5; // shared across full flow & portfolio-only prompt

  // Reset profile checking state when user changes
  React.useEffect(() => {
    console.log('[DEBUG] User changed, resetting profile state. user:', user?.uid || 'null');
    setProfileChecked(false);
    setProfileIncomplete(false);
    setHasRunProfileCheck(false);
    setStep(-1);
    setRequiredMissing(false);
    setPortfolioMissing(false);
  }, [user?.uid]);

  // Check profile completeness
  React.useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setProfileChecked(true);
        setProfileIncomplete(false);
        setHasRunProfileCheck(true); // no user means nothing to check
        setStep(-1); // Always show sign-in first
        return;
      }
      
      console.log('[DEBUG] Starting profile check for user:', user.uid);
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      let requiredMiss = false;
      let portfolioMiss = false;
      let anyMissing = false;

      if (!snap.exists()) {
        console.log('[DEBUG] No user document exists, creating one');
        requiredMiss = true; // brand new
        anyMissing = true;
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
            displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const data = snap.data();
        console.log('[DEBUG] Existing user document:', data);
        requiredMiss = !data.campus || !data.house || !data.program || !data.displayName || !data.email || !data.linkedin || !data.github;
        portfolioMiss = !data.portfolio; // optional but we still prompt until provided
        anyMissing = requiredMiss || portfolioMiss;
        console.log('[DEBUG] Missing details check:', {
          campus: !!data.campus,
          house: !!data.house,
          program: !!data.program,
          displayName: !!data.displayName,
          email: !!data.email,
          linkedin: !!data.linkedin,
          github: !!data.github,
          portfolio: !!data.portfolio,
          requiredMissing: requiredMiss,
          portfolioMissing: portfolioMiss,
          anyMissing
        });
      }

      setRequiredMissing(requiredMiss);
      setPortfolioMissing(portfolioMiss);
      setProfileChecked(true);
      setProfileIncomplete(anyMissing);
      setHasRunProfileCheck(true);

      if (!anyMissing) {
        setStep(-1);
        console.log('[DEBUG] Profile fully complete (including portfolio).');
      } else if (requiredMiss) {
        // Start full onboarding. We'll gather required info first; portfolio at end.
        setStep(0);
        console.log('[DEBUG] Required fields missing. Starting full onboarding at step 0.');
      } else if (!requiredMiss && portfolioMiss) {
        // Only portfolio missing -> jump straight to portfolio-only prompt (reuse index)
        setStep(PORTFOLIO_STEP_INDEX);
        console.log('[DEBUG] Only portfolio missing. Jumping directly to portfolio prompt.');
      }
    };
    checkProfile();
  }, [user]);

  const handleGoogleLogin = async () => {
    console.log('[DEBUG] Google sign-in started');
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      console.log('[DEBUG] Google sign-in successful');
    } catch (err) {
      setError('Sign in failed.');
      console.error('[DEBUG] Google sign-in error:', err);
    }
    setLoading(false);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(step + 1);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const ref = doc(db, 'users', user.uid);
      const payload: Record<string, any> = {
        campus,
        house,
        program,
        linkedin: normalizeUrl(linkedin),
        github: normalizeUrl(github),
        updatedAt: serverTimestamp()
      };
      if (portfolio.trim()) payload.portfolio = normalizeUrl(portfolio);
      await updateDoc(ref, payload);
      if (requiredMissing) {
        // After saving required fields, if portfolio was provided or skipped we finish.
        if (!portfolio.trim()) {
          // skipping portfolio now, navigate home
          navigate('/');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Failed to save profile.');
    }
    setLoading(false);
  };

  const handleSkipPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const ref = doc(db, 'users', user.uid);
      const payload: Record<string, any> = {
        campus,
        house,
        program,
        linkedin: normalizeUrl(linkedin),
        github: normalizeUrl(github),
        updatedAt: serverTimestamp()
      };
      await updateDoc(ref, payload);
      navigate('/');
    } catch (err) {
      setError('Failed to save profile.');
    }
    setLoading(false);
  };

  // Save only portfolio when it's the lone missing field
  const handleSavePortfolioOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/');
    setLoading(true); setError('');
    try {
      if (portfolio.trim()) {
        const ref = doc(db, 'users', user.uid);
        await updateDoc(ref, { portfolio: normalizeUrl(portfolio), updatedAt: serverTimestamp() });
      }
      navigate('/');
    } catch (err) {
      setError('Failed to save portfolio.');
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log('[DEBUG] LoginPage mounted/update. user:', user?.uid, 'profileChecked:', profileChecked, 'profileIncomplete:', profileIncomplete, 'requiredMissing:', requiredMissing, 'portfolioMissing:', portfolioMissing, 'step:', step);
  }, [user, profileChecked, profileIncomplete, requiredMissing, portfolioMissing, step]);

  // Handle the transition to onboarding when profile is incomplete
  useEffect(() => {
    console.log('[DEBUG] transition effect. user:', !!user, 'hasRunProfileCheck:', hasRunProfileCheck, 'step:', step);
    // All transitions handled inside profile check effect; keep minimal guard here if needed.
  }, [user, hasRunProfileCheck, step]);

  // Auto-redirect to home if user is signed in, profile fully complete (including portfolio or user already provided it),
  // and we're sitting on the login page with no wizard active.
  useEffect(() => {
    if (!user) return;
    if (!hasRunProfileCheck || !profileChecked) return;
    // fully complete when no required missing and no portfolio missing
    if (!requiredMissing && !portfolioMissing && step === -1) {
      console.log('[DEBUG] Auto-redirecting from /login to / because profile is fully complete.');
      navigate('/', { replace: true });
    }
  }, [user, hasRunProfileCheck, profileChecked, requiredMissing, portfolioMissing, step, navigate]);

  // Removed immediate redirect to avoid race before profile check finishes.

  // Don't render anything until we've checked the profile for logged-in users
  if (user && !hasRunProfileCheck) {
    console.log('[DEBUG] User logged in but profile check for this user not finished yet, waiting...');
    return null; // or a loading spinner
  }

  return (
    <div className={styles.loginPageContainer}>
      <FireworksBackground color={'white'} density={32} intervalMs={1800} />
      {/* Only show one box at a time: sign-in or onboarding wizard */}
      <div className={styles.loginFormWrapper}>
        {step === -1 ? (
          <form className={styles.loginForm} onSubmit={e => e.preventDefault()}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:'0.5rem'}}>
              <img src="/logo.png" alt="Rewards Dashboard Logo" width={90} height={90} style={{objectFit:'contain',filter:'drop-shadow(0 6px 22px rgba(0,230,210,0.35))'}} />
              <div style={{fontSize:'1.18rem',color:'#fff',fontWeight:700,textAlign:'center',marginTop:'.1em',marginBottom:'.1em',letterSpacing:'.2px',fontFamily:'inherit'}}>Welcome Back!</div>
              <div style={{fontSize:'1.05rem',color:'#b0f5e6',fontWeight:500,textAlign:'center',marginBottom:'.1em',letterSpacing:'.1px'}}>Ready to celebrate your efforts?</div>
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={styles.loginBtn}
              style={{background:'linear-gradient(90deg,#4285F4 0%,#34A853 100%)',color:'#fff',marginTop:'0.5em'}}
            >
              {loading ? 'Please wait...' : 'Sign in to get started'}
            </button>
            <div className={styles.loginHint}>Use your Navgurukul account to continue.</div>
          </form>
        ) : (
          <form
            className={styles.loginForm}
            onSubmit={(e) => {
              if (requiredMissing) {
                if (step === 4) return handleOnboarding(e); // after github go to portfolio (optional) or finish
                if (step === PORTFOLIO_STEP_INDEX) return handleOnboarding(e); // saving with possible portfolio value
                return handleNext(e);
              } else {
                // Only portfolio missing
                return handleSavePortfolioOnly(e);
              }
            }}
          >
            {/* Minimal progress bar: only a line */}
            {requiredMissing && (
              <div className={styles.progressBarWrapper}>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{width: `${((step+1)/TOTAL_STEPS)*100}%`}}></div>
                </div>
              </div>
            )}
            {/* Onboarding wizard steps, one heading/label per field */}
            {user && profileChecked && profileIncomplete && requiredMissing && (
              <>
                {step === 0 && (
                  <>
                    <div className={styles.formRow}>
                      <label htmlFor="campus" style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>Campus</label>
                      <select id="campus" value={campus} onChange={e => setCampus(e.target.value)} required>
                        <option value="">Select campus</option>
                        {campusList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="submit" className={styles.subtleBtn} disabled={!campus}>Next</button>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className={styles.formRow}>
                      <label htmlFor="house" style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>House</label>
                      <select id="house" value={house} onChange={e => setHouse(e.target.value)} required>
                        <option value="">Select house</option>
                        {houseList.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                      <button type="button" className={styles.subtleBtn} onClick={()=>setStep(step-1)}>Back</button>
                      <button type="submit" className={styles.subtleBtn} disabled={!house}>Next</button>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div className={styles.formRow}>
                      <label htmlFor="program" style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>Program</label>
                      <select id="program" value={program} onChange={e => setProgram(e.target.value)} required>
                        <option value="">Select program</option>
                        {programList.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                      <button type="button" className={styles.subtleBtn} onClick={()=>setStep(step-1)}>Back</button>
                      <button type="submit" className={styles.subtleBtn} disabled={!program}>Next</button>
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div style={{width:'100%',textAlign:'left',marginBottom:'0.3rem'}}>
                      <span style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>LinkedIn</span>
                    </div>
                    <div className={styles.formRow}>
                      <input
                        id="linkedin"
                        type="url"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        onBlur={e => setLinkedin(normalizeUrl(e.target.value))}
                        placeholder="linkedin.com/in/username"
                        required
                      />
                    </div>
                    <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                      <button type="button" className={styles.subtleBtn} onClick={()=>setStep(step-1)}>Back</button>
                      <button type="submit" className={styles.subtleBtn} disabled={!linkedin}>Next</button>
                    </div>
                  </>
                )}
                {step === 4 && (
                  <>
                    <div style={{width:'100%',textAlign:'left',marginBottom:'0.3rem'}}>
                      <span style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>GitHub</span>
                    </div>
                    <div className={styles.formRow}>
                      <input
                        id="github"
                        type="url"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        onBlur={e => setGithub(normalizeUrl(e.target.value))}
                        placeholder="github.com/username"
                        required
                      />
                    </div>
                    <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                      <button type="button" className={styles.subtleBtn} onClick={()=>setStep(step-1)}>Back</button>
                      <button type="submit" className={styles.subtleBtn} disabled={!github}>Next</button>
                    </div>
                  </>
                )}
                {step === PORTFOLIO_STEP_INDEX && (
                  <>
                    <div style={{width:'100%',textAlign:'left',marginBottom:'0.3rem'}}>
                      <span style={{fontSize:'1.02rem',fontWeight:600,color:'#00e6d2'}}>Portfolio</span>
                    </div>
                    <div className={styles.formRow}>
                      <input
                        id="portfolio"
                        type="url"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                        onBlur={e => setPortfolio(normalizeUrl(e.target.value))}
                        placeholder="(optional) yourportfolio.com"
                      />
                    </div>
                    <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                      <button type="button" className={styles.subtleBtn} onClick={()=>setStep(step-1)}>Back</button>
                      <div style={{display:'flex',gap:8}}>
                        <button type="button" className={styles.subtleBtn} onClick={handleSkipPortfolio} disabled={loading}>{loading ? '...' : 'Skip'}</button>
                        <button type="submit" className={styles.subtleBtn} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            {user && profileChecked && !requiredMissing && portfolioMissing && step === PORTFOLIO_STEP_INDEX && (
              <>
                <div style={{width:'100%',textAlign:'left',marginBottom:'0.6rem'}}>
                  <span style={{fontSize:'1.08rem',fontWeight:700,color:'#00e6d2'}}>Add Your Portfolio (Optional)</span>
                  <div style={{fontSize:'.72rem',color:'#a9d5cf',marginTop:4}}>You can skip now. We'll remind you next login.</div>
                </div>
                <div className={styles.formRow}>
                  <input
                    id="portfolio-only"
                    type="url"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                    onBlur={e => setPortfolio(normalizeUrl(e.target.value))}
                    placeholder="yourportfolio.com (optional)"
                  />
                </div>
                <div style={{display:'flex',gap:'1rem',width:'100%',justifyContent:'space-between'}}>
                  <button type="button" className={styles.subtleBtn} onClick={() => navigate('/')}>Skip</button>
                  <button type="submit" className={styles.subtleBtn} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
      {import.meta.env.DEV && (
        <div style={{position:'fixed',left:6,bottom:6,fontSize:11,lineHeight:1.25,background:'rgba(0,0,0,0.55)',color:'#c4f5ef',padding:'6px 8px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,fontFamily:'ui-monospace,monospace',zIndex:99999}}>
          <div><strong>Onboarding Debug</strong></div>
          <div>uid: {user?.uid || '—'}</div>
          <div>profileChecked: {String(profileChecked)}</div>
          <div>hasRunProfileCheck: {String(hasRunProfileCheck)}</div>
          <div>profileIncomplete: {String(profileIncomplete)}</div>
          <div>step: {step}</div>
          <div>requiredMissing: {String(requiredMissing)}</div>
          <div>portfolioMissing: {String(portfolioMissing)}</div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
