import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, updateDoc, doc, deleteDoc, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import styles from './TestimonialsAdmin.module.css';
import { FiEdit2, FiSave, FiX, FiTrash2, FiCheckCircle, FiSearch, FiRotateCcw, FiUser } from 'react-icons/fi';
import Skeleton from '../../components/Skeleton';
import ConfirmModal from '../../components/ConfirmModal';

type Status = 'pending' | 'approved' | 'rejected';
interface TestimonialRecord { id:string; uid?:string; name:string; campus?:string; house?:string; category:string; testimonialHeading:string; testimonial:string; imageUrl?:string; status:Status; createdAt?:any; }

const TestimonialsAdmin: React.FC = () => {
  // data state
  const [items,setItems]=useState<TestimonialRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [lastCursor,setLastCursor]=useState<any>(null);
  const [loadingMore,setLoadingMore]=useState(false);
  const PAGE_SIZE = 25;

  // filtering & selection
  const [filters,setFilters]=useState({ status:'all', campus:'all', q:'' });
  const [selected,setSelected]=useState<string[]>([]);

  // editing testimonial text
  const [editingId,setEditingId]=useState<string|null>(null);
  const [editHeading,setEditHeading]=useState('');
  const [editBody,setEditBody]=useState('');
  const [saving,setSaving]=useState(false);

  // profile editing
  const [profileEditUid,setProfileEditUid]=useState<string|null>(null);
  const [profileDraft,setProfileDraft]=useState<any>({});
  const [profileSaving,setProfileSaving]=useState(false);

  // destructive actions
  const [pendingDelete,setPendingDelete]=useState<TestimonialRecord|null>(null);
  const [confirmOpen,setConfirmOpen]=useState(false);

  // initial load
  useEffect(()=>{ (async ()=>{
    const baseQ = query(collection(db,'winnerSubmissions'), orderBy('createdAt','desc'), limit(PAGE_SIZE));
    const snap = await getDocs(baseQ);
    const list:TestimonialRecord[] = snap.docs.map(d=>({id:d.id, ...(d.data() as any)}));
    setItems(list); setLastCursor(snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length-1] : null); setLoading(false);
  })(); },[]);

  const loadMore = async () => {
    if(!lastCursor || loadingMore) return; setLoadingMore(true);
    try {
      const moreQ = query(collection(db,'winnerSubmissions'), orderBy('createdAt','desc'), startAfter(lastCursor), limit(PAGE_SIZE));
      const snap = await getDocs(moreQ);
      const list:TestimonialRecord[] = snap.docs.map(d=>({id:d.id, ...(d.data() as any)}));
      setItems(prev=>[...prev,...list]);
      setLastCursor(snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length-1] : null);
    } finally { setLoadingMore(false); }
  };

  // derived lists
  const filtered = useMemo(()=> items.filter(it => (
    (filters.status==='all'|| it.status===filters.status) &&
    (filters.campus==='all'|| it.campus===filters.campus) &&
    (!filters.q || (it.name||'').toLowerCase().includes(filters.q.toLowerCase()) || (it.testimonialHeading||'').toLowerCase().includes(filters.q.toLowerCase()) || (it.testimonial||'').toLowerCase().includes(filters.q.toLowerCase()))
  )),[items,filters]);
  const uniqueCampuses = useMemo(()=> Array.from(new Set(items.map(i=>i.campus).filter(Boolean))) as string[], [items]);
  const counts = useMemo(()=> items.reduce((acc:any,it)=>{ acc[it.status]=(acc[it.status]||0)+1; return acc;},{pending:0,approved:0,rejected:0}),[items]);

  // testimonial editing
  const startEdit = (rec:TestimonialRecord) => { setEditingId(rec.id); setEditHeading(rec.testimonialHeading||''); setEditBody(rec.testimonial||''); };
  const cancelEdit = () => { setEditingId(null); setEditHeading(''); setEditBody(''); };
  const saveEdit = async () => { if(!editingId) return; setSaving(true); try { await updateDoc(doc(db,'winnerSubmissions',editingId), { testimonialHeading:editHeading, testimonial:editBody, updatedAt:Timestamp.now() }); cancelEdit(); } finally { setSaving(false); } };

  // status updates (optimistic)
  const setStatus = async (rec:TestimonialRecord, status:Status) => { const prevStatus=rec.status; setItems(prev=>prev.map(i=>i.id===rec.id?{...i,status}:i)); try { await updateDoc(doc(db,'winnerSubmissions',rec.id), { status, updatedAt:Timestamp.now() }); } catch { setItems(prev=>prev.map(i=>i.id===rec.id?{...i,status:prevStatus}:i)); } };
  const bulkSetStatus = async (status:Status) => { const ids=[...selected]; setItems(prev=>prev.map(i=> ids.includes(i.id)? {...i,status}:i)); for(const id of ids){ try { await updateDoc(doc(db,'winnerSubmissions',id), { status, updatedAt:Timestamp.now() }); } catch {/* ignore */} } setSelected([]); };

  // selection
  const toggleSelect = (id:string,checked:boolean)=> setSelected(sel=> checked? [...sel,id]: sel.filter(s=>s!==id));
  const allVisibleSelected = filtered.length>0 && filtered.every(r=>selected.includes(r.id));
  const toggleSelectAllVisible = (checked:boolean)=> { if(checked) setSelected(sel=> Array.from(new Set([...sel, ...filtered.map(f=>f.id)]))); else setSelected(sel=> sel.filter(id=> !filtered.some(f=>f.id===id))); };

  // profile editing
  const openProfile = async (rec:TestimonialRecord) => { if(!rec.uid){return;} const ref=doc(db,'users',rec.uid); const snap=await getDoc(ref); if(snap.exists()){ setProfileDraft(snap.data()); } else { setProfileDraft({ displayName:rec.name||'', campus:rec.campus||'', house:rec.house||'' }); } setProfileEditUid(rec.uid); };
  const saveProfile = async () => { if(!profileEditUid) return; setProfileSaving(true); try { await setDoc(doc(db,'users',profileEditUid), { ...profileDraft, uid:profileEditUid, updatedAt:Timestamp.now() }, { merge:true }); } finally { setProfileSaving(false); setProfileEditUid(null); } };
  const cancelProfile = () => { setProfileEditUid(null); setProfileDraft({}); };

  // delete
  const remove = (rec:TestimonialRecord) => { setPendingDelete(rec); setConfirmOpen(true); };
  const confirmDelete = async () => { if(pendingDelete){ await deleteDoc(doc(db,'winnerSubmissions',pendingDelete.id)); setItems(prev=>prev.filter(i=>i.id!==pendingDelete.id)); } setPendingDelete(null); setConfirmOpen(false); };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}><h1>Testimonials Review</h1></header>
      <section className={styles.tableSection}>
        <div className={styles.countsBar}>
          <span className={`${styles.countChip} ${styles.pending}`}>Pending {counts.pending}</span>
          <span className={`${styles.countChip} ${styles.approved}`}>Approved {counts.approved}</span>
          <span className={`${styles.countChip} ${styles.rejected}`}>Rejected {counts.rejected}</span>
          <span className={styles.countChip}>Total {items.length}</span>
        </div>
        <div className={styles.actionsBar}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <FiSearch style={{position:'absolute',left:6,top:8,fontSize:14,opacity:.7}} />
              <input placeholder="Search" value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))} />
            </div>
            <div className={styles.segmented}>
              {['all','pending','approved','rejected'].map(s => (
                <button key={s} className={filters.status===s? 'active':''} onClick={(e)=>{e.preventDefault(); setFilters(f=>({...f,status:s}));}}>{s}</button>
              ))}
            </div>
            <div className={styles.segmented}>
              <button className={filters.campus==='all'?'active':''} onClick={e=>{e.preventDefault(); setFilters(f=>({...f,campus:'all'}));}}>All Campus</button>
              {uniqueCampuses.slice(0,6).map(c => (
                <button key={c} className={filters.campus===c?'active':''} onClick={(e)=>{e.preventDefault(); setFilters(f=>({...f,campus:c}));}}>{c}</button>
              ))}
            </div>
          </div>
          {selected.length>0 && (
            <div className={styles.bulkBar}>
              <span>{selected.length} selected</span>
              <button className={styles.miniBtn} onClick={()=>bulkSetStatus('approved')}>Approve</button>
              <button className={styles.miniBtn} onClick={()=>bulkSetStatus('pending')}>Pending</button>
              <button className={styles.miniBtn} style={{background:'#3d2d00',color:'#ffcc4d',borderColor:'#5b4300'}} onClick={()=>bulkSetStatus('rejected')}>Reject</button>
              <button className={`${styles.miniBtn} danger`} onClick={()=>{ selected.forEach(id=> { const rec=items.find(i=>i.id===id); if(rec) remove(rec); }); }}>Delete</button>
            </div>
          )}
        </div>
        {loading && (
          <div className={styles.tableScroll}>
            <table className={styles.table}><thead><tr>{[...Array(10)].map((_,i)=><th key={i}><Skeleton height={24} /></th>)}</tr></thead><tbody>{[...Array(5)].map((_,i)=>(<tr key={i}>{[...Array(10)].map((_,j)=><td key={j}><Skeleton height={18} /></td>)}</tr>))}</tbody></table>
          </div>
        )}
        {!loading && filtered.length===0 && <div className={styles.empty}>No testimonials match filters.</div>}
        {!loading && filtered.length>0 && (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allVisibleSelected} onChange={e=>toggleSelectAllVisible(e.target.checked)} aria-label="Select all visible" /></th>
                  <th>Img</th>
                  <th>Status</th>
                  <th>Heading</th>
                  <th>Body</th>
                  <th>Name</th>
                  <th>Campus</th>
                  <th>Category</th>
                  <th>Created</th>
                  <th style={{width:220}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rec => {
                  const editing = editingId===rec.id;
                  return (
                    <tr key={rec.id}>
                      <td><input type="checkbox" checked={selected.includes(rec.id)} onChange={e=>toggleSelect(rec.id,e.target.checked)} aria-label={`Select ${rec.testimonialHeading||rec.name}`} /></td>
                      <td>{rec.imageUrl ? <img src={rec.imageUrl} alt="thumb" className={styles.thumb} /> : <span style={{color:'#666'}}>—</span>}</td>
                      <td><span className={rec.status==='pending'?styles.statusPending: rec.status==='approved'?styles.statusApproved:styles.statusRejected}>{rec.status}</span></td>
                      <td style={{minWidth:160}}>
                        {editing ? <div className={styles.inlineEdit}><input value={editHeading} onChange={e=>setEditHeading(e.target.value)} maxLength={120} /></div> : (rec.testimonialHeading||'—')}
                      </td>
                      <td style={{minWidth:240,maxWidth:360}}>
                        {editing ? (
                          <div className={styles.inlineEdit}>
                            <textarea value={editBody} onChange={e=>setEditBody(e.target.value)} maxLength={600} />
                            <div style={{fontSize:10,opacity:.6,alignSelf:'flex-end'}}>{editBody.length}/600</div>
                          </div>
                        ) : <div style={{whiteSpace:'pre-wrap'}}>{rec.testimonial||'—'}</div>}
                      </td>
                      <td>{rec.name||'—'}</td>
                      <td>{rec.campus||'—'}</td>
                      <td><span className={styles.tag}>{rec.category||'—'}</span></td>
                      <td>{rec.createdAt?.toDate ? rec.createdAt.toDate().toLocaleDateString() : '—'}</td>
                      <td>
                        {!editing && <>
                          {rec.status!=='approved' && <button className={styles.smallBtn} onClick={()=>setStatus(rec,'approved')} title="Approve"><FiCheckCircle/> A</button>}
                          {rec.status!=='rejected' && <button className={styles.smallBtnDanger} onClick={()=>setStatus(rec,'rejected')} title="Reject">R</button>}
                          <button className={styles.smallBtn} onClick={()=>startEdit(rec)} title="Edit"><FiEdit2/> E</button>
                          <button className={styles.smallBtn} onClick={()=>openProfile(rec)} title="User"><FiUser/> U</button>
                          <button className={styles.smallBtnDanger} onClick={()=>remove(rec)} title="Delete"><FiTrash2/> D</button>
                        </>}
                        {editing && <div className={styles.inlineEditActions}>
                          <button className={styles.smallBtn} onClick={saveEdit} disabled={saving}><FiSave/> Save</button>
                          <button className={styles.smallBtnDanger} onClick={cancelEdit}><FiX/> Cancel</button>
                          <button className={styles.smallBtn} onClick={()=>setStatus(rec,'pending')} title="Reset"><FiRotateCcw/> Pending</button>
                        </div>}
                      </td>
                    </tr>
                  );
                })}
                {profileEditUid && (
                  <tr className={styles.profileRow}>
                    <td colSpan={10}>
                      <div style={{fontSize:'.7rem',fontWeight:600,letterSpacing:'.5px',marginBottom:'.4rem'}}>Edit User Profile</div>
                      <div className={styles.profileEditor}>
                        <label>Display Name<input value={profileDraft.displayName||''} onChange={e=>setProfileDraft((d:any)=>({...d,displayName:e.target.value}))} /></label>
                        <label>Campus<input value={profileDraft.campus||''} onChange={e=>setProfileDraft((d:any)=>({...d,campus:e.target.value}))} /></label>
                        <label>House<input value={profileDraft.house||''} onChange={e=>setProfileDraft((d:any)=>({...d,house:e.target.value}))} /></label>
                        <label>Program<input value={profileDraft.program||''} onChange={e=>setProfileDraft((d:any)=>({...d,program:e.target.value}))} /></label>
                        <label>LinkedIn<input value={profileDraft.linkedin||''} onChange={e=>setProfileDraft((d:any)=>({...d,linkedin:e.target.value}))} /></label>
                        <label>GitHub<input value={profileDraft.github||''} onChange={e=>setProfileDraft((d:any)=>({...d,github:e.target.value}))} /></label>
                        <label>Portfolio<input value={profileDraft.portfolio||''} onChange={e=>setProfileDraft((d:any)=>({...d,portfolio:e.target.value}))} /></label>
                      </div>
                      <div className={styles.profileEditorActions}>
                        <button className={styles.miniBtn} disabled={profileSaving} onClick={saveProfile}>{profileSaving? 'Saving...' : 'Save Profile'}</button>
                        <button className={`${styles.miniBtn} danger`} onClick={cancelProfile}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {lastCursor && (
          <div className={styles.loadMoreWrap}>
            <button className={styles.loadMore} disabled={loadingMore} onClick={loadMore}>{loadingMore? 'Loading...' : 'Load More'}</button>
          </div>
        )}
        <div className={styles.note}>Only APPROVED testimonials appear on the public carousel.</div>
      </section>
      <ConfirmModal open={confirmOpen} title="Delete Testimonial" message={pendingDelete ? `Delete "${pendingDelete.testimonialHeading || pendingDelete.name}"? This cannot be undone.` : ''} onConfirm={confirmDelete} onCancel={()=>{setConfirmOpen(false);setPendingDelete(null);}} />
    </div>
  );
};

export default TestimonialsAdmin;
