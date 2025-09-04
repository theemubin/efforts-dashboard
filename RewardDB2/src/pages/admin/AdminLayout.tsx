import React from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiAward, FiUsers, FiImage, FiSettings, FiLogOut, FiCalendar, FiClipboard, FiUpload, FiMessageSquare } from 'react-icons/fi';
import { auth, db } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
  const [requesting, setRequesting] = React.useState(false);
  const [requestStatus, setRequestStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string|null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = React.useState(false);
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for existing admin request and admin status
  React.useEffect(() => {
    if (!user) return;
    
    const checkExistingRequest = async () => {
      try {
        const { getDoc } = await import('firebase/firestore');
        const requestRef = doc(db, 'adminRequests', user.uid);
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.exists()) {
          const data = requestSnap.data();
          setRequestStatus(data.status);
        }
      } catch (e) {
        console.error('Failed to check existing request:', e);
      }
    };

    // Set up real-time listener for adminRequests
    const requestRef = doc(db, 'adminRequests', user.uid);
    const unsubscribeRequest = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRequestStatus(data.status);
      } else {
        setRequestStatus(null);
      }
    });

    // Set up real-time listener for user role changes
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const isUserAdmin = data.role === 'admin';
        setIsAdmin(isUserAdmin);
        console.log('[DEBUG] Admin status check:', { 
          uid: user.uid,
          role: data.role, 
          isAdmin: isUserAdmin,
          hasRole: !!data.role,
          fullData: data 
        });
      } else {
        setIsAdmin(false);
        console.log('[DEBUG] User document does not exist, not admin for uid:', user.uid);
      }
      setAdminCheckComplete(true);
    });

    checkExistingRequest();

    // Fallback check in case real-time listener doesn't fire
    const fallbackTimeout = setTimeout(async () => {
      if (!adminCheckComplete) {
        console.log('[DEBUG] Fallback admin check triggered');
        try {
          const { getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const isUserAdmin = data.role === 'admin';
            setIsAdmin(isUserAdmin);
            console.log('[DEBUG] Fallback check result:', { role: data.role, isAdmin: isUserAdmin });
          } else {
            setIsAdmin(false);
            console.log('[DEBUG] Fallback: User document does not exist');
          }
        } catch (e) {
          console.error('[DEBUG] Fallback check failed:', e);
          setIsAdmin(false);
        }
        setAdminCheckComplete(true);
      }
    }, 3000); // 3 second fallback

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribeRequest();
      unsubscribeUser();
    };
  }, [user]);

  // Reset states when user changes
  React.useEffect(() => {
    setAdminCheckComplete(false);
    setIsAdmin(false);
    setRequestStatus(null);
    setError(null);
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

  const handleRequest = async () => {
    if (!user) return;
    setRequesting(true);
    setError(null);
    try {
      // Only create a new request if there's no existing request or if it's rejected
      if (!requestStatus || requestStatus === 'rejected') {
        await setDoc(doc(db, 'adminRequests', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          requestedAt: serverTimestamp(),
          status: 'pending',
        });
        setRequestStatus('pending');
      }
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
  if (!adminCheckComplete) {
    return <div className={styles.loadingShell}>Checking admin access...</div>;
  }
  
  console.log('[DEBUG] Render decision:', { 
    isAdmin, 
    requestStatus, 
    adminCheckComplete,
    userId: user?.uid 
  });
  
  if (!isAdmin) {
    return (
      <div className={styles.shell} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
        <h2>Admin Access</h2>
        <p>To access admin features, please request admin access below.</p>
        <button onClick={handleRequest} disabled={requesting || !!(requestStatus && requestStatus !== 'rejected')} style={{padding:'0.7em 2em',fontSize:'1.1em',borderRadius:'1.5em',background:'#00e6d2',color:'#111',fontWeight:600,cursor:(requesting || !!(requestStatus && requestStatus !== 'rejected'))?'not-allowed':'pointer',marginTop:'1.2em'}}>
          {requesting ? 'Requesting...' : 
           requestStatus === 'approved' ? 'Already Approved' :
           requestStatus === 'pending' ? 'Request Pending' :
           requestStatus === 'rejected' ? 'Request Again' :
           'Request Admin Access'}
        </button>
        {error && <p style={{color:'#ff0058',marginTop:'1em'}}>{error}</p>}
        {requestStatus === 'pending' && <p style={{color:'#ff9f6e',marginTop:'1em'}}>Your request is pending approval from an administrator.</p>}
        {requestStatus === 'approved' && <p style={{color:'#1ed760',marginTop:'1em'}}>Your admin access has been approved! Please refresh the page.</p>}
        {requestStatus === 'rejected' && <p style={{color:'#ff0058',marginTop:'1em'}}>Your previous request was rejected. You can submit a new request.</p>}
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
