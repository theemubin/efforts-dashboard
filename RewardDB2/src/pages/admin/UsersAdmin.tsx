import React, { useEffect, useState } from 'react';
import styles from './UsersAdmin.module.css';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
// ...existing code...

interface AdminRequest {
  uid: string;
  email: string;
  displayName: string;
  requestedAt?: any;
  status: string;
  campus?: string;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  campus?: string;
}

const UsersAdmin: React.FC = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  // ...existing code...
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const unsubReq = onSnapshot(collection(db, 'adminRequests'), snap => {
      setRequests(snap.docs.map(d => ({ ...(d.data() as AdminRequest), uid: d.id })));
  // ...existing code...
    });
    const unsubAdmins = onSnapshot(collection(db, 'users'), snap => {
      setAdmins(snap.docs.map(d => ({ ...(d.data() as User), uid: d.id })).filter(u => u.role === 'admin'));
    });
    return () => { unsubReq(); unsubAdmins(); };
  }, []);

  const handleApprove = async (req: AdminRequest) => {
    setActionLoading(req.uid);
    setError(null);
    try {
      // Set user role to admin
      await updateDoc(doc(db, 'users', req.uid), { role: 'admin' });
      // Update request status
      await updateDoc(doc(db, 'adminRequests', req.uid), { status: 'approved' });
    } catch (e) {
      setError('Failed to approve request');
    }
    setActionLoading(null);
  };

  const handleReject = async (req: AdminRequest) => {
    setActionLoading(req.uid);
    setError(null);
    try {
      await updateDoc(doc(db, 'adminRequests', req.uid), { status: 'rejected' });
    } catch (e) {
      setError('Failed to reject request');
    }
    setActionLoading(null);
  };

  return <div className={styles.wrap}>
    <h1>Users</h1>
    <p className={styles.lead}>User directory, roles, and engagement stats coming soon.</p>
    <div style={{marginTop:'2.5rem'}}>
      <h2>Admin Access</h2>
      <div style={{marginTop:'1.5rem'}}>
        <h2 style={{marginBottom:'1em'}}>Admins & Requests</h2>
        <table style={{width:'100%',background:'#181c22',borderRadius:'1.2em',boxShadow:'0 2px 16px #0003',color:'#fff',fontSize:'1em',borderCollapse:'separate',borderSpacing:'0'}}>
          <thead>
            <tr style={{background:'linear-gradient(90deg,#222,#181c22)',color:'#ff9f6e'}}>
              <th style={{padding:'0.8em',borderTopLeftRadius:'1.2em'}}>Name</th>
              <th style={{padding:'0.8em'}}>Email</th>
              <th style={{padding:'0.8em'}}>Campus</th>
              <th style={{padding:'0.8em'}}>Requested At</th>
              <th style={{padding:'0.8em'}}>Status</th>
              <th style={{padding:'0.8em',borderTopRightRadius:'1.2em'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Current Admins */}
            {admins.length === 0 && requests.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center',padding:'1.5em',color:'#b0b0b0'}}>No admins or requests found.</td></tr>
            )}
            {admins.map(admin => (
              <tr key={admin.uid} style={{background:'rgba(30,215,96,0.07)',borderBottom:'1px solid #222'}}>
                <td style={{padding:'0.8em'}}><strong>{admin.displayName}</strong></td>
                <td style={{padding:'0.8em'}}>{admin.email}</td>
                <td style={{padding:'0.8em'}}>{admin.campus || 'Unknown'}</td>
                <td style={{padding:'0.8em',color:'#b0b0b0'}}>—</td>
                <td style={{padding:'0.8em'}}><span style={{color:'#1ed760',fontWeight:600}}>Admin</span></td>
                <td style={{padding:'0.8em'}}>
                  <button onClick={async()=>{
                    setActionLoading(admin.uid);
                    setError(null);
                    try {
                      await updateDoc(doc(db, 'users', admin.uid), { role: 'user' });
                      await updateDoc(doc(db, 'adminRequests', admin.uid), { status: 'removed' });
                    } catch (e) {
                      setError('Failed to remove admin access');
                    }
                    setActionLoading(null);
                  }} disabled={actionLoading===admin.uid} style={{padding:'0.4em 1.2em',borderRadius:'0.8em',background:'#ff0058',color:'#fff',fontWeight:600,boxShadow:'0 2px 8px #ff005822'}}>Remove</button>
                </td>
              </tr>
            ))}
            {/* Requests */}
            {requests.map(req => (
              <tr key={req.uid} style={{background:req.status==='pending'?'rgba(255,188,0,0.07)':req.status==='approved'?'rgba(30,215,96,0.04)':req.status==='rejected'?'rgba(255,0,88,0.07)':'#181c22',borderBottom:'1px solid #222'}}>
                <td style={{padding:'0.8em'}}>{req.displayName}</td>
                <td style={{padding:'0.8em'}}>{req.email}</td>
                <td style={{padding:'0.8em'}}>{req.campus || 'Unknown'}</td>
                <td style={{padding:'0.8em',color:'#b0b0b0'}}>{req.requestedAt?.seconds ? new Date(req.requestedAt.seconds*1000).toLocaleString() : 'Unknown'}</td>
                <td style={{padding:'0.8em'}}>
                  <span style={{color:req.status==='pending'?'#ffbc00':req.status==='approved'?'#1ed760':req.status==='rejected'?'#ff0058':'#b0b0b0',fontWeight:600}}>{req.status}</span>
                </td>
                <td style={{padding:'0.8em'}}>
                  {req.status==='pending' && (
                    <>
                      <button onClick={()=>handleApprove(req)} disabled={actionLoading===req.uid} style={{padding:'0.4em 1.2em',borderRadius:'0.8em',background:'#1ed760',color:'#111',fontWeight:600,marginRight:'0.5em',boxShadow:'0 2px 8px #1ed76022'}}>Approve</button>
                      <button onClick={()=>handleReject(req)} disabled={actionLoading===req.uid} style={{padding:'0.4em 1.2em',borderRadius:'0.8em',background:'#ff0058',color:'#fff',fontWeight:600,boxShadow:'0 2px 8px #ff005822'}}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p style={{color:'#ff0058',marginTop:'1em'}}>{error}</p>}
    </div>
  </div>;
};

export default UsersAdmin;
