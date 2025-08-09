import React from 'react';
import './RewardsSection.css';

export const RewardsSection = ({ id }: { id?: string }) => (
  <section className="rewards-section" id={id}>
    <div className="section-header">
      <h2>Campus Rewards</h2>
      <p>Discover and claim rewards based on your campus merit level</p>
    </div>
    <div className="rewards-filters">
      <select className="rewards-filter"><option>All Campuses</option></select>
      <select className="rewards-filter"><option>All Levels</option></select>
      <select className="rewards-filter"><option>All Status</option></select>
    </div>
    <div className="rewards-grid">
      {/* Rewards will be dynamically loaded here */}
      <div className="reward-card">
        <div className="reward-image" />
        <div className="reward-info">
          <h4>Reward Title</h4>
          <p className="reward-desc">Reward description goes here.</p>
          <button className="claim-btn">Claim</button>
        </div>
      </div>
      <div className="reward-card">
        <div className="reward-image" />
        <div className="reward-info">
          <h4>Another Reward</h4>
          <p className="reward-desc">Short description for this reward.</p>
          <button className="claim-btn">Claim</button>
        </div>
      </div>
    </div>
  </section>
);
