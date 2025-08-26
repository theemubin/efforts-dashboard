import { useEffect, useRef, useMemo, useState } from 'react';
// Child component to handle image error state per reward
// Child component to handle image error state per reward
const RewardImage = ({ imageUrl, title }: { imageUrl?: string, title: string }) => {
  let imgUrl = imageUrl;
  if (imgUrl && imgUrl.includes('drive.google.com/file/d/')) {
    const match = imgUrl.match(/\/d\/([\w-]+)/);
    if (match && match[1]) {
      imgUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [imgUrl]);
  if (!imgUrl || imgError) {
    return <div className="reward-image" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#888',fontSize:13,background:'#222'}}>Image not available</div>;
  }
  return (
    <div className="reward-image" style={{backgroundImage:`url(${imgUrl})`,backgroundSize:'cover',backgroundPosition:'center',position:'relative'}}>
      <img src={imgUrl} alt={title} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',opacity:0}} onError={()=>setImgError(true)} />
    </div>
  );
};

import './RewardsSection.css';
import ModernRewardCard from './ModernRewardCard';
import { useCampus } from '../contexts/CampusContext';
import { campusList } from './campusList';
import { collection, onSnapshot, orderBy, query, where, getDocs, addDoc, Timestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import toast from 'react-hot-toast';
import type { RewardRecord } from '../types/rewards';


export const RewardsSection = ({ id }: { id?: string }) => {
  const { campusLevel } = useCampus();
  const [levelFilter, setLevelFilter] = useState<'all'|number>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all'|string>('all');
  const [campusFilter, setCampusFilter] = useState<string[] | 'all'>('all');
  const [showLocked, setShowLocked] = useState(false);
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebug] = useState(false);
  const { user, profile } = useUserProfile();
  const [claimingIds, setClaimingIds] = useState<string[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]); // claimed (pending/approved) this month by this house
  const [claimDetails, setClaimDetails] = useState<Record<string,{createdAt?: any; decidedAt?: any; status?: string}>>({});
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState<string[]>([]);
  // Removed approvedMap state (aggregate display not needed now)

  useEffect(()=>{
    const qRewards = query(collection(db,'rewards'), orderBy('level','asc'));
    const unsub = onSnapshot(qRewards, snap => {
      setRewards(snap.docs.map(d=>({id:d.id, ...(d.data() as any)})));
      setLoading(false);
    });
    return () => unsub();
  },[]);

  // Load user's liked rewards mapping
  useEffect(()=>{
    if(!user) { setLikedSet(new Set()); return; }
    const qLikes = query(collection(db,'rewardLikes'), where('userId','==', user.uid));
    const unsub = onSnapshot(qLikes, snap => {
      const s = new Set<string>();
      snap.docs.forEach(d=> { const data = d.data() as any; if(data.rewardId) s.add(data.rewardId); });
      setLikedSet(s);
    });
    return () => unsub();
  },[user]);

  const toggleLike = async (reward: RewardRecord) => {
    if(!user){ toast.error('Login required'); return; }
    if(likeLoading.includes(reward.id)) return;
    setLikeLoading(ids=>[...ids,reward.id]);
    const likeDocId = `${user.uid}_${reward.id}`;
    const likeDocRef = doc(db,'rewardLikes', likeDocId);
    const rewardRef = doc(db,'rewards', reward.id);
    try {
      await runTransaction(db, async (trx) => {
        const likeSnap = await trx.get(likeDocRef);
        const rewardSnap = await trx.get(rewardRef);
        const currentLikes = (rewardSnap.exists() && (rewardSnap.data() as any).likes) || 0;
        if(likeSnap.exists()) {
          // unlike
            trx.delete(likeDocRef);
            trx.update(rewardRef, { likes: currentLikes > 0 ? currentLikes - 1 : 0 });
        } else {
          trx.set(likeDocRef, { userId: user.uid, rewardId: reward.id, createdAt: Timestamp.now() });
          trx.update(rewardRef, { likes: currentLikes + 1 });
        }
      });
    } catch(e){
      console.error('like toggle failed', e);
      toast.error('Failed');
    } finally {
      setLikeLoading(ids=> ids.filter(id=> id!==reward.id));
    }
  };

  const filtered = useMemo(() => {
    return rewards.filter(r => {
      const levelOk = (levelFilter === 'all' || r.level === levelFilter);
      const categoryOk = (categoryFilter === 'all' || r.category === categoryFilter);
      let campusOk = true;
      if(campusFilter === 'all') campusOk = true;
      else if(Array.isArray(campusFilter)) campusOk = campusFilter.includes(r.campus) || r.campus === 'All Campus';
      else campusOk = r.campus === campusFilter || r.campus === 'All Campus';
      const lockOk = showLocked ? true : r.level <= campusLevel;
      return levelOk && categoryOk && campusOk && lockOk;
    });
  }, [rewards, levelFilter, categoryFilter, campusFilter, showLocked, campusLevel]);

  const topRewards = useMemo(()=> {
    return [...rewards]
      .filter(r => (r.likes||0) > 0)
      .sort((a,b)=> (b.likes||0) - (a.likes||0))
      .slice(0,5);
  },[rewards]);
  const carouselRef = useRef<HTMLDivElement|null>(null);
  const campusRef = useRef<HTMLDivElement|null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const scrollCarousel = (dir:number)=>{
    if(!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    carouselRef.current.scrollBy({left: dir * (width * 0.8), behavior:'smooth'});
  };
  // Auto-scroll logic
  useEffect(()=>{
    if(!carouselRef.current) return;
    let paused = false;
    const el = carouselRef.current;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    const id = setInterval(()=>{
      if(paused || !carouselRef.current) return;
      const c = carouselRef.current;
      const maxScroll = c.scrollWidth - c.clientWidth - 4;
      if(c.scrollLeft >= maxScroll){
        c.scrollTo({left:0, behavior:'smooth'});
      } else {
        scrollCarousel(1);
      }
    }, 4000);
    return ()=>{
      clearInterval(id);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  },[topRewards.length]);

  // Pointer drag-to-scroll for large chip lists (campus)
  const onCampusPointerDown = (e: any) => {
    const el = campusRef.current;
    if(!el) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = el.scrollLeft;
    try { e.target.setPointerCapture?.(e.pointerId); } catch(_){}
    el.classList.add('dragging');
  };
  const onCampusPointerMove = (e: any) => {
    if(!isDragging.current) return;
    const el = campusRef.current; if(!el) return;
    const dx = e.clientX - dragStartX.current;
    el.scrollLeft = Math.max(0, dragStartScroll.current - dx);
  };
  const onCampusPointerUp = (e: any) => {
    isDragging.current = false;
    const el = campusRef.current; if(!el) return; el.classList.remove('dragging');
    try { e.target.releasePointerCapture?.(e.pointerId); } catch(_){}
  };
  const onCampusPointerLeave = () => { isDragging.current = false; campusRef.current?.classList.remove('dragging'); };

  // Determine start of current month for claim uniqueness window
  const monthKey = useMemo(()=>{
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },[]);

  // Load claimed reward ids for current house+month
  useEffect(()=>{
    const load = async () => {
      if(!profile?.house) { setClaimedIds([]); return; }
      try {
        const claimsRef = collection(db,'claims');
        const qClaims = query(
          claimsRef,
          where('house','==', profile.house),
          where('monthKey','==', monthKey)
        );
        const snap = await getDocs(qClaims);
        const latest: Record<string, any> = {};
        snap.docs.forEach(d=>{
          const data = d.data() as any;
          const existing = latest[data.rewardId];
          if(!existing || (data.createdAt?.seconds||0) > (existing.createdAt?.seconds||0)){
            latest[data.rewardId] = data;
          }
        });
        const ids: string[] = [];
        const meta: Record<string,{createdAt?: any; decidedAt?: any; status?: string}> = {};
        Object.values(latest).forEach((data:any)=>{
          meta[data.rewardId] = { createdAt: data.createdAt, decidedAt: data.decidedAt, status: data.status };
          if(data.status !== 'rejected') ids.push(data.rewardId); // only pending/approved block re-claim
        });
        setClaimedIds(ids);
        setClaimDetails(meta);
      } catch(e){ console.error('Failed loading claims', e); }
    };
    load();
  },[profile?.house, monthKey]);

  // (Aggregate approved claims subscription removed)

  const handleClaim = async (reward: RewardRecord) => {
    if(!user){ toast.error('Login required'); return; }
    if(!profile?.campus || !profile?.house){ toast.error('Complete onboarding first'); return; }
    if(reward.level > campusLevel){ toast.error('Campus level too low'); return; }
    if(claimedIds.includes(reward.id)){
      // Already pending or approved
      toast('Already claimed this month');
      return;
    }
    setClaimingIds(ids=>[...ids,reward.id]);
    try {
      // Re-check uniqueness just before writing
      const claimsRef = collection(db,'claims');
      const qDup = query(
        claimsRef,
        where('house','==', profile.house),
        where('monthKey','==', monthKey),
        where('rewardId','==', reward.id)
      );
      const dupSnap = await getDocs(qDup);
      if(!dupSnap.empty){
        // Allow new claim only if all existing are rejected
        const blocking = dupSnap.docs.some(d => {
          const st = (d.data() as any).status; return st !== 'rejected';
        });
        if(blocking){
          toast('Already claimed');
          // update local state in case changed elsewhere
          setClaimedIds(prev=> prev.includes(reward.id)? prev : [...prev, reward.id]);
          return;
        }
      }
      await addDoc(claimsRef, {
        rewardId: reward.id,
        rewardTitle: reward.title,
        campus: profile.campus,
        house: profile.house,
        userId: user.uid,
        monthKey,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      toast.success('Claim submitted for approval');
      setClaimedIds(prev=>[...prev,reward.id]);
    } catch(e){
      console.error('Claim failed', e);
      toast.error('Failed to submit claim');
    } finally {
      setClaimingIds(ids=> ids.filter(id=> id!==reward.id));
    }
  };

  return (
    <section className="rewards-section" id={id}>
       <div className="section-header">
         <h2>Campus Rewards</h2>
         <p>Your campus level: <strong className="campus-level">{campusLevel}</strong>. Unlock higher tier rewards by progressing on Etiocracy.</p>
       </div>
      {topRewards.length > 0 && (
        <div className="popular-carousel-wrap">
          <div className="popular-head">
            <h3>Popular Rewards</h3>
            <div className="popular-actions">
              <button aria-label="Scroll left" onClick={()=>scrollCarousel(-1)}>&lt;</button>
              <button aria-label="Scroll right" onClick={()=>scrollCarousel(1)}>&gt;</button>
            </div>
          </div>
          <div className="popular-carousel" ref={carouselRef}>
            {topRewards.map(r => {
              return (
                <div key={r.id} className="popular-slide" aria-label={`Popular reward ${r.title}`}> 
                  <div className="popular-overlay-badges">
                    <span className="popular-campus-badge">{r.campus}</span>
                    <span className="popular-level-badge">Lvl {r.level}</span>
                    <span className="popular-likes-badge">{r.likes||0} ♥</span>
                  </div>
                  <RewardImage imageUrl={r.imageUrl} title={r.title} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showDebug && (
        <pre style={{background:'#181c24',color:'#fff',padding:12,margin:'12px 0',borderRadius:8,overflowX:'auto',fontSize:13}}>
          {JSON.stringify(rewards,null,2)}
        </pre>
      )}
      <div className="rewards-filters">
        <div
          ref={campusRef}
          className="chip-group chip-group--scroll"
          title="Hover to expand"
          onPointerDown={onCampusPointerDown}
          onPointerMove={onCampusPointerMove}
          onPointerUp={onCampusPointerUp}
          onPointerCancel={onCampusPointerUp}
          onPointerLeave={onCampusPointerLeave}
        >
          <button
            className={`chip hover-underline ${campusFilter === 'all' ? 'selected' : ''}`}
            onClick={() => setCampusFilter('all')}
            aria-pressed={campusFilter === 'all'}
          >All Campuses</button>
          {campusList.map(c => {
            const selected = Array.isArray(campusFilter) && campusFilter.includes(c);
            return (
              <button
                key={c}
                className={`chip hover-underline ${selected ? 'selected' : ''}`}
                onClick={() => {
                  if(campusFilter === 'all') setCampusFilter([c]);
                  else if(Array.isArray(campusFilter)){
                    if(campusFilter.includes(c)) setCampusFilter(prev => Array.isArray(prev) ? prev.filter((x: string)=> x!==c) : []);
                    else setCampusFilter(prev => Array.isArray(prev) ? [...prev, c] : [c]);
                  }
                }}
                aria-pressed={selected}
              >{c}</button>
            );
          })}
        </div>

        <div className="chip-group" title="Hover to expand">
          <button
            className={`chip hover-underline ${levelFilter === 'all' ? 'selected' : ''}`}
            onClick={() => setLevelFilter('all')}
            aria-pressed={levelFilter === 'all'}
          >All Levels</button>
          {[1,2,3,4].map(l => (
            <button
              key={l}
              className={`chip hover-underline ${levelFilter === l ? 'selected' : ''}`}
              onClick={() => setLevelFilter(l)}
              aria-pressed={levelFilter === l}
            >Lvl {l}</button>
          ))}
        </div>

        <div className="chip-group" title="Hover to expand">
          <button
            className={`chip hover-underline ${categoryFilter === 'all' ? 'selected' : ''}`}
            onClick={() => setCategoryFilter('all')}
            aria-pressed={categoryFilter === 'all'}
          >All Categories</button>
          {['Academic','Cultural','Overall'].map(cat => (
            <button
              key={cat}
              className={`chip hover-underline ${categoryFilter === cat ? 'selected' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={categoryFilter === cat}
            >{cat}</button>
          ))}
        </div>

        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.85rem',color:'var(--color-text-muted)'}}>
          <input type="checkbox" checked={showLocked} onChange={e=>setShowLocked(e.target.checked)} /> Show locked
        </label>
      </div>
      {loading ? <div style={{padding:'1.2rem',color:'#8fa4ba'}}>Loading rewards...</div> : (
      <div className="modern-rewards-grid">
        {filtered.map(r => {
          const unlocked = campusLevel >= r.level;
          const status = claimDetails[r.id]?.status;
          const isClaiming = claimingIds.includes(r.id);
          const alreadyClaimed = claimedIds.includes(r.id);
          const liked = likedSet.has(r.id);
          
          return (
            <ModernRewardCard
              key={r.id}
              reward={r}
              unlocked={unlocked}
              status={status}
              isClaiming={isClaiming}
              alreadyClaimed={alreadyClaimed}
              liked={liked}
              likeLoading={likeLoading.includes(r.id)}
              profile={profile}
              onClaim={handleClaim}
              onToggleLike={toggleLike}
            />
          );
        })}
      </div>
      )}
    </section>
  );
};
