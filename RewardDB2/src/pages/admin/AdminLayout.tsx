import React from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiAward, FiUsers, FiImage, FiSettings, FiLogOut, FiCalendar, FiClipboard, FiUpload, FiMessageSquare } from 'react-icons/fi';
import { auth, db } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
  const [requesting, setRequesting] = React.useState(false);
  const [requested, setRequested] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Always call hooks at the top, before any returns
  React.useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        setError('Failed to check admin status');
      }
    };
    checkAdmin();
  }, [user]);

  React.useEffect(()=>{
    if(location.pathname.startsWith('/admin/') && location.pathname !== '/admin'){
      localStorage.setItem('admin:last', location.pathname);
    }
  },[location.pathname]);
  React.useEffect(() => {
    if (!loading && user && location.pathname === '/admin') {
      const last = localStorage.getItem('admin:last');
      if (last && last !== '/admin') {
        navigate(last, { replace: true });
      } else if (!last) {
        navigate('/admin/events', { replace: true });
      }
    }
  }, [loading, user, location.pathname, navigate]);
  React.useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      try {
        const { db } = await import('../../firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        setError('Failed to check admin status');
      }
    };
    checkAdmin();
  }, [user]);

  const handleRequest = async () => {
    if (!user) return;
    setRequesting(true);
    setError(null);
    try {
      await setDoc(doc(db, 'adminRequests', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        requestedAt: serverTimestamp(),
        status: 'pending',
      });
      setRequested(true);
    } catch (e) {
      setError('Failed to submit request');
    }
    setRequesting(false);
  };

  if (loading) {
    return <div className={styles.loadingShell}>Checking session...</div>;
  }
  if(!user){
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!isAdmin) {
    return (
      <div className={styles.shell} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
        <h2>Admin Access</h2>
        <p>To access admin features, please request admin access below.</p>
        <button onClick={handleRequest} disabled={requesting || requested} style={{padding:'0.7em 2em',fontSize:'1.1em',borderRadius:'1.5em',background:'#00e6d2',color:'#111',fontWeight:600,cursor:requesting?'not-allowed':'pointer',marginTop:'1.2em'}}>
          {requested ? 'Request Sent' : requesting ? 'Requesting...' : 'Request Admin Access'}
        </button>
        {error && <p style={{color:'#ff0058',marginTop:'1em'}}>{error}</p>}
        {requested && <p style={{color:'#1ed760',marginTop:'1em'}}>Your request has been submitted and is pending approval.</p>}
      </div>
    );
  }
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Admin</div>
        <nav className={styles.nav}>
          <NavLink to="events" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiCalendar/> <span>Events</span></NavLink>
          <NavLink to="rewards" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiAward/> <span>Rewards</span></NavLink>
          <NavLink to="claims" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiClipboard/> <span>Claims</span></NavLink>
          <NavLink to="users" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiUsers/> <span>Users</span></NavLink>
          <NavLink to="media" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiImage/> <span>Media</span></NavLink>
          <NavLink to="testimonials" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiMessageSquare/> <span>Testimonials</span></NavLink>
          <NavLink to="points-upload" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiUpload/> <span>Points Upload</span></NavLink>
          <NavLink to="settings" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiSettings/> <span>Settings</span></NavLink>
        </nav>
        <button className={styles.logout} onClick={()=>auth.signOut()}><FiLogOut/> <span>Logout</span></button>
      </aside>
      <main className={styles.main}>
        <Outlet/>
      </main>
    </div>
  );
};

export default AdminLayout;
