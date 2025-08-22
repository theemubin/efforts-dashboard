import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import styles from './ClaimsAdmin.module.css';

interface ClaimRecord {
  id: string;
  rewardId: string;
  rewardTitle: string;
  campus: string;
  house: string;
  userId: string;
  monthKey: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  decidedAt?: any;
  decidedBy?: string;
  note?: string;
  level?: number;
  pointsAwarded?: number;
}

// Removed unused statusOrder

const ClaimsAdmin: React.FC = () => {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  // Removed unused filterStatus
  const [houseFilter, setHouseFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [decidingIds, setDecidingIds] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, {displayName?:string, email?:string}>>({});

  useEffect(()=>{
    const qClaims = query(collection(db,'claims'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(qClaims, async snap => {
      let claimList = snap.docs.map(d=>({id:d.id, ...(d.data() as any)}));
      // Fetch reward info for each claim
      const rewardIds = Array.from(new Set(claimList.map(c=>c.rewardId)));
      let rewardMap: Record<string, {level?:number, pointsCost?:number}> = {};
      if(rewardIds.length){
        const rewardSnaps = await Promise.all(rewardIds.map(rid=>
          new Promise(resolve=>{
            onSnapshot(doc(db,'rewards',rid), snap=>{
              if(snap.exists()){
                resolve({id:rid, ...snap.data()});
              }else{
                resolve({id:rid});
              }
            });
          })
        ));
        rewardSnaps.forEach((r:any)=>{
          rewardMap[r.id] = {level:r.level, pointsCost:r.pointsCost};
        });
      }
      // Attach level and pointsAwarded to each claim
      claimList = claimList.map(c => ({
        ...c,
        level: rewardMap[c.rewardId]?.level,
        pointsAwarded: rewardMap[c.rewardId]?.pointsCost
      }));
      setClaims(claimList);
      // Fetch user profiles for winners
      const winnerIds = Array.from(new Set(claimList.filter(c=>c.status==='approved').map(c=>c.userId)));
      if(winnerIds.length){
        Promise.all(winnerIds.map(uid=>
          new Promise(resolve=>{
            onSnapshot(doc(db,'users',uid), snap=>{
              if(snap.exists()){
                resolve({uid, ...snap.data()});
              }else{
                resolve({uid});
              }
            });
          })
        )).then(results=>{
          const profiles: Record<string, {displayName?:string, email?:string}> = {};
          results.forEach((u:any)=>{
            profiles[u.uid] = {displayName:u.displayName, email:u.email};
          });
          setUserProfiles(profiles);
        });
      }
    });
    return () => unsub();
  },[]);

  // Removed unused filtered

  const [confirmClaim, setConfirmClaim] = useState<ClaimRecord|null>(null);
  const [confirmStatus, setConfirmStatus] = useState<'approved'|'rejected'|null>(null);

  const decide = async (claim: ClaimRecord, status: 'approved'|'rejected') => {
    if (status === 'approved') {
      setConfirmClaim(claim);
      setConfirmStatus(status);
      return;
    }
    // For rejection, proceed directly
    if(claim.status!=='pending'){ toast('Already decided'); return; }
    setDecidingIds(ids=>[...ids,claim.id]);
    try {
      const ref = doc(db,'claims',claim.id);
      await updateDoc(ref, { status, decidedAt: Timestamp.now() });
      toast.success('Rejected');
    } catch(e){
      console.error('Decision failed', e);
      toast.error('Failed');
    } finally {
      setDecidingIds(ids=> ids.filter(id=> id!==claim.id));
    }
  };

  const handleConfirmApprove = async () => {
    if (!confirmClaim) return;
    setDecidingIds(ids=>[...ids,confirmClaim.id]);
    try {
      const ref = doc(db,'claims',confirmClaim.id);
      await updateDoc(ref, { status: 'approved', decidedAt: Timestamp.now() });
      toast.success('Approved');
    } catch(e){
      console.error('Decision failed', e);
      toast.error('Failed');
    } finally {
      setDecidingIds(ids=> ids.filter(id=> id!==confirmClaim.id));
      setConfirmClaim(null);
      setConfirmStatus(null);
    }
  };

  return <div className={styles.wrap}>
    <div className={styles.headBar}>
      <h1>Reward Claims</h1>
      <div className={styles.filters}>
        <input placeholder="Search reward title" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={campusFilter} onChange={e=>setCampusFilter(e.target.value)}>
          <option value="all">All Campuses</option>
          {[...new Set(claims.map(c=>c.campus))].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={houseFilter} onChange={e=>setHouseFilter(e.target.value)}>
          <option value="all">All Houses</option>
          {[...new Set(claims.map(c=>c.house))].map(h=> <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    </div>

    {/* Pending Claims Table */}
    <div className={styles.tableScroll} style={{marginBottom:'2.5rem'}}>
      <h2 style={{margin:'1.2rem 0 0.7rem',fontSize:'1.05em',color:'#ffbc00'}}>Pending Claims</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Reward</th>
            <th>Level</th>
            <th>Campus</th>
            <th>House</th>
            <th>House Total Points</th>
            <th>Month</th>
            <th>Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.filter(c=>c.status==='pending')
            .filter(c => (campusFilter==='all'|| c.campus===campusFilter))
            .filter(c => (houseFilter==='all'|| c.house===houseFilter))
            .filter(c => !search || c.rewardTitle.toLowerCase().includes(search.toLowerCase()))
            .map(c=>{
              const deciding = decidingIds.includes(c.id);
              // House total points: sum of all approved claims for this house
              // Use pointsAwarded if present, else fallback to 0
              const housePoints = claims.filter(x=>x.house===c.house && x.status==='approved').reduce((sum,x)=>sum+(typeof x.pointsAwarded === 'number' ? x.pointsAwarded : 0),0);
              return <tr key={c.id}>
                <td>{userProfiles[c.userId]?.displayName || c.userId}</td>
                <td>{userProfiles[c.userId]?.email || '-'}</td>
                <td>{c.rewardTitle}</td>
                <td>{typeof c.level === 'number' ? c.level : '-'}</td>
                <td>{c.campus}</td>
                <td>{c.house}</td>
                <td>{housePoints}</td>
                <td>{c.monthKey}</td>
                <td>{c.createdAt?.seconds ? new Date(c.createdAt.seconds*1000).toLocaleDateString(): ''}</td>
                <td className={styles.actionsCell}>
                  <button disabled={deciding} onClick={()=>decide(c,'approved')} className={styles.approveBtn}>Approve</button>
    {/* Confirm popup before approval */}
    {confirmClaim && confirmStatus==='approved' && (
      <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.6)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#181c22',padding:'2.2rem 2.5rem',borderRadius:'1.2rem',boxShadow:'0 4px 32px #0008',maxWidth:400}}>
          <h3 style={{color:'#ffbc00',marginBottom:'1.2rem'}}>Confirm Approval</h3>
          <p style={{color:'#dbe9f5',marginBottom:'1.2rem'}}>Have you updated the latest house points in the sheet before approving this reward claim?</p>
          <div style={{display:'flex',gap:'1.2rem',justifyContent:'flex-end'}}>
            <button onClick={()=>{setConfirmClaim(null);setConfirmStatus(null);}} style={{background:'#555',color:'#fff',padding:'0.5em 1.5em',borderRadius:'1em',fontWeight:600}}>Cancel</button>
            <button onClick={()=>{window.location.href='/admin/points-upload';}} style={{background:'#00e6d2',color:'#111',padding:'0.5em 1.5em',borderRadius:'1em',fontWeight:600}}>Go to Point Update Page</button>
            <button onClick={handleConfirmApprove} style={{background:'#1ed760',color:'#111',padding:'0.5em 1.5em',borderRadius:'1em',fontWeight:600}}>Yes, Approve</button>
          </div>
        </div>
      </div>
    )}
                  <button disabled={deciding} onClick={()=>decide(c,'rejected')} className={styles.rejectBtn}>Reject</button>
                </td>
              </tr>;
            })}
        </tbody>
      </table>
      {claims.filter(c=>c.status==='pending').length===0 && <div className={styles.empty}>No pending claims.</div>}
    </div>

    {/* Approved/Allocated Rewards Table */}
    <div className={styles.tableScroll} style={{marginBottom:'2.5rem'}}>
      <h2 style={{margin:'1.2rem 0 0.7rem',fontSize:'1.05em',color:'#4ce3a5'}}>Approved / Allocated Rewards</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Reward</th>
            <th>Level</th>
            <th>Campus</th>
            <th>House</th>
            <th>House Total Points</th>
            <th>Month</th>
            <th>Date Won</th>
          </tr>
        </thead>
        <tbody>
          {claims.filter(c=>c.status==='approved')
            .filter(c => (campusFilter==='all'|| c.campus===campusFilter))
            .filter(c => (houseFilter==='all'|| c.house===houseFilter))
            .filter(c => !search || c.rewardTitle.toLowerCase().includes(search.toLowerCase()))
            .map(c=>{
              const housePoints = claims.filter(x=>x.house===c.house && x.status==='approved').reduce((sum,x)=>sum+(typeof x.pointsAwarded === 'number' ? x.pointsAwarded : 0),0);
              return (
                <tr key={c.id}>
                  <td>{userProfiles[c.userId]?.displayName || c.userId}</td>
                  <td>{userProfiles[c.userId]?.email || '-'}</td>
                  <td>{c.rewardTitle}</td>
                  <td>{typeof c.level === 'number' ? c.level : '-'}</td>
                  <td>{c.campus}</td>
                  <td>{c.house}</td>
                  <td>{housePoints}</td>
                  <td>{c.monthKey}</td>
                  <td>{c.decidedAt?.seconds ? new Date(c.decidedAt.seconds*1000).toLocaleDateString() : ''}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {claims.filter(c=>c.status==='approved').length===0 && <div className={styles.empty}>No approved rewards yet.</div>}
    </div>

    {/* Rejected Claims Table */}
    <div className={styles.tableScroll}>
      <h2 style={{margin:'1.2rem 0 0.7rem',fontSize:'1.05em',color:'#ff0058'}}>Rejected Claims</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Reward</th>
            <th>Level</th>
            <th>Campus</th>
            <th>House</th>
            <th>House Total Points</th>
            <th>Month</th>
            <th>Date Rejected</th>
          </tr>
        </thead>
        <tbody>
          {claims.filter(c=>c.status==='rejected')
            .filter(c => (campusFilter==='all'|| c.campus===campusFilter))
            .filter(c => (houseFilter==='all'|| c.house===houseFilter))
            .filter(c => !search || c.rewardTitle.toLowerCase().includes(search.toLowerCase()))
            .map(c=>{
              const housePoints = claims.filter(x=>x.house===c.house && x.status==='approved').reduce((sum,x)=>sum+(typeof x.pointsAwarded === 'number' ? x.pointsAwarded : 0),0);
              return (
                <tr key={c.id}>
                  <td>{userProfiles[c.userId]?.displayName || c.userId}</td>
                  <td>{userProfiles[c.userId]?.email || '-'}</td>
                  <td>{c.rewardTitle}</td>
                  <td>{typeof c.level === 'number' ? c.level : '-'}</td>
                  <td>{c.campus}</td>
                  <td>{c.house}</td>
                  <td>{housePoints}</td>
                  <td>{c.monthKey}</td>
                  <td>{c.decidedAt?.seconds ? new Date(c.decidedAt.seconds*1000).toLocaleDateString() : ''}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {claims.filter(c=>c.status==='rejected').length===0 && <div className={styles.empty}>No rejected claims.</div>}
    </div>
  </div>;

}
export default ClaimsAdmin;
