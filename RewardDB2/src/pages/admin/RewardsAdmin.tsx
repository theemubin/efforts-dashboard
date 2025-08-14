import React from 'react';
import styles from './RewardsAdmin.module.css';

const RewardsAdmin: React.FC = () => {
  return <div className={styles.wrap}>
    <h1>Rewards</h1>
    <p className={styles.lead}>Build and manage reward tiers, points mapping, redemption workflows and inventory. (Implementation coming soon)</p>
    <div className={styles.placeholderGrid}>
      <div className={styles.card}><h3>Tiers</h3><p>Define Bronze, Silver, Gold etc.</p></div>
      <div className={styles.card}><h3>Catalog</h3><p>Items students can redeem.</p></div>
      <div className={styles.card}><h3>Redemptions</h3><p>Approval queue & history.</p></div>
      <div className={styles.card}><h3>Point Rules</h3><p>Map actions to points.</p></div>
    </div>
  </div>;
};

export default RewardsAdmin;
