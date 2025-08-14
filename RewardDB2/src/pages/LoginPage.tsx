import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLoading(false);
      navigate('/'); // Redirect to homepage after login
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Google login failed.');
    }
  };

  return (
    <div className={styles.loginPageContainer}>
      <form className={styles.loginForm} onSubmit={e => e.preventDefault()}>
        <h2 className={styles.loginTitle}>Sign In</h2>
        {error && <div className={styles.errorMsg}>{error}</div>}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={styles.loginBtn}
          style={{background:'linear-gradient(90deg,#4285F4 0%,#34A853 100%)',color:'#fff',marginTop:'0.5em'}}
        >
          {loading ? 'Please wait...' : 'Sign in with Google'}
        </button>
        <div className={styles.loginHint}>Sign in with your Google account.</div>
      </form>
    </div>
  );
};

export default LoginPage;
