import React, { useState } from 'react';
import { useCampus } from '../../contexts/CampusContext';
import { campusList } from '../../components/campusList';
import styles from './EtiocracyLevelsAdmin.module.css';

const EtiocracyLevelsAdmin: React.FC = () => {
  const { getCampusLevel, setCampusLevel, campusLevels, loading } = useCampus();
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const levelDescriptions = {
    0: 'Level 0 - Basic rewards only',
    1: 'Level 1 - Access to Level 0-1 rewards',
    2: 'Level 2 - Access to Level 0-2 rewards',
    3: 'Level 3 - Access to Level 0-3 rewards',
    4: 'Level 4 - Access to all rewards'
  };

  const campuses = campusList.filter(campus => campus !== 'All Campus');

  const handleLevelChange = async (campus: string, newLevel: number) => {
    if (newLevel === getCampusLevel(campus)) return;

    setSaving(campus);
    setMessage(null);

    try {
      console.log(`Admin: Changing ${campus} level from ${getCampusLevel(campus)} to ${newLevel}`);
      await setCampusLevel(campus, newLevel);
      console.log(`Admin: Successfully updated ${campus} to level ${newLevel}`);
      setMessage({ type: 'success', text: `${campus} campus level updated to ${newLevel}` });
    } catch (error) {
      console.error('Admin: Failed to update campus level:', error);
      setMessage({ type: 'error', text: `Failed to update ${campus} campus level. Please try again.` });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading campus levels...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Etiocracy Levels Management</h1>
        <p>Control the level for each campus to unlock different reward tiers</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.campusGrid}>
        {campuses.map((campus) => {
          const currentLevel = getCampusLevel(campus);
          return (
            <div key={campus} className={styles.campusCard}>
              <div className={styles.campusHeader}>
                <h2>{campus}</h2>
                <div className={styles.currentLevel}>
                  Current Level: <span className={styles.levelNumber}>{currentLevel}</span>
                </div>
              </div>

              <div className={styles.levelSelector}>
                <h3>Set Level</h3>
                <div className={styles.levelButtons}>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <button
                      key={level}
                      className={`${styles.levelButton} ${level === currentLevel ? styles.active : ''} ${saving === campus ? styles.disabled : ''}`}
                      onClick={() => !saving && handleLevelChange(campus, level)}
                      disabled={saving === campus}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.levelDescription}>
                {levelDescriptions[currentLevel as keyof typeof levelDescriptions]}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.info}>
        <h3>How Level System Works</h3>
        <ul>
          <li><strong>Level 0:</strong> Basic rewards only</li>
          <li><strong>Level 1:</strong> Unlocks Level 0 + Level 1 rewards</li>
          <li><strong>Level 2:</strong> Unlocks Level 0-2 rewards</li>
          <li><strong>Level 3:</strong> Unlocks Level 0-3 rewards</li>
          <li><strong>Level 4:</strong> Unlocks all rewards</li>
        </ul>
        <p><em>Note: Each campus can have different levels. Students from higher-level campuses can access more rewards.</em></p>

        {/* Debug Info */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.8rem' }}>
          <strong>Debug Info:</strong>
          <button
            onClick={() => {
              console.log('Current campus levels:', campusLevels);
              console.log('Sample campus checks:');
              campuses.slice(0, 3).forEach(campus => {
                console.log(`${campus}: ${getCampusLevel(campus)}`);
              });
            }}
            style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
          >
            Log to Console
          </button>
          <pre style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({
              allCampusLevels: campusLevels,
              loading,
              sampleChecks: campuses.slice(0, 3).map(c => `${c}: ${getCampusLevel(c)}`)
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default EtiocracyLevelsAdmin;
