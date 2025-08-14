import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiAward, FiUsers, FiImage, FiSettings, FiLogOut, FiCalendar } from 'react-icons/fi';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
  const [user] = useAuthState(auth);
  if(!user){
    return <Navigate to="/login" replace />;
  }
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Admin</div>
        <nav className={styles.nav}>
          <NavLink to="events" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiCalendar/> <span>Events</span></NavLink>
          <NavLink to="rewards" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiAward/> <span>Rewards</span></NavLink>
          <NavLink to="users" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiUsers/> <span>Users</span></NavLink>
          <NavLink to="media" className={({isActive})=> isActive?`${styles.link} ${styles.active}`:styles.link}><FiImage/> <span>Media</span></NavLink>
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
