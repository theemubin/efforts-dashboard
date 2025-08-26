import React, { useState } from 'react';
import styles from './UserOnboardingModal.module.css';

interface UserOnboardingModalProps {
  open: boolean;
  campusList: string[];
  houseList: string[];
  onSubmit: (campus: string, house: string, linkedin: string, github: string, portfolio: string) => void;
}

const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({ open, campusList, houseList, onSubmit }) => {
  const [campus, setCampus] = useState('');
  const [house, setHouse] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  if (!open) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2 className={styles.title}>Welcome! Set Your Campus & House</h2>
        <div className={styles.formRow}>
          <label htmlFor="campus">Campus</label>
          <select id="campus" value={campus} onChange={e=>setCampus(e.target.value)}>
            <option value="">Select campus</option>
            {campusList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formRow}>
          <label htmlFor="house">House</label>
          <select id="house" value={house} onChange={e=>setHouse(e.target.value)}>
            <option value="">Select house</option>
            {houseList.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className={styles.formRow}>
          <label htmlFor="linkedin">LinkedIn</label>
          <input id="linkedin" type="url" value={linkedin} onChange={e=>setLinkedin(e.target.value)} placeholder="LinkedIn profile URL" />
        </div>
        <div className={styles.formRow}>
          <label htmlFor="github">GitHub</label>
          <input id="github" type="url" value={github} onChange={e=>setGithub(e.target.value)} placeholder="GitHub profile URL" />
        </div>
        <div className={styles.formRow}>
          <label htmlFor="portfolio">Portfolio</label>
          <input id="portfolio" type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="Portfolio URL" />
        </div>
        <button className={styles.submitBtn} onClick={()=>campus && house && onSubmit(campus, house, linkedin, github, portfolio)} disabled={!campus || !house}>Save</button>
      </div>
    </div>
  );
};

export default UserOnboardingModal;
