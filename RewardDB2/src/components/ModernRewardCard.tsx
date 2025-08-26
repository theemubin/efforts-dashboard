import React, { useState } from 'react';
import type { RewardRecord } from '../types/rewards';
import './ModernRewardCard.css';

interface ModernRewardCardProps {
  reward: RewardRecord;
  unlocked: boolean;
  status?: string;
  isClaiming: boolean;
  alreadyClaimed: boolean;
  liked: boolean;
  likeLoading: boolean;
  profile?: any;
  onClaim: (reward: RewardRecord) => void;
  onToggleLike: (reward: RewardRecord) => void;
}

// Color themes for different categories - matching app theme
const getCategoryTheme = (category: string) => {
  const themes = {
    Academic: {
      primary: '#4285f4',
      accent: '#00d4c7',
      background: 'rgba(66, 133, 244, 0.1)'
    },
    Sports: {
      primary: '#ff6b35',
      accent: '#f7931e',
      background: 'rgba(255, 107, 53, 0.1)'
    },
    Cultural: {
      primary: '#8e44ad',
      accent: '#e91e63',
      background: 'rgba(142, 68, 173, 0.1)'
    },
    Leadership: {
      primary: '#2ecc71',
      accent: '#27ae60',
      background: 'rgba(46, 204, 113, 0.1)'
    },
    Community: {
      primary: '#f39c12',
      accent: '#e67e22',
      background: 'rgba(243, 156, 18, 0.1)'
    },
    Innovation: {
      primary: '#9b59b6',
      accent: '#8e44ad',
      background: 'rgba(155, 89, 182, 0.1)'
    }
  };
  
  return themes[category as keyof typeof themes] || themes.Academic;
};

const ModernRewardCard: React.FC<ModernRewardCardProps> = ({
  reward,
  unlocked,
  status,
  isClaiming,
  alreadyClaimed,
  liked,
  likeLoading,
  profile,
  onClaim,
  onToggleLike
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoveringDescription, setIsHoveringDescription] = useState(false);
  const theme = getCategoryTheme(reward.category);

  // Process image URL for Google Drive compatibility
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.includes('drive.google.com/file/d/')) {
      const match = imageUrl.match(/\/d\/([\w-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return imageUrl;
  };

  const processedImageUrl = getImageUrl(reward.imageUrl);

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click originates from an interactive area marked `.no-flip`, don't toggle
    const target = e.target as HTMLElement | null;
    if (target && target.closest && target.closest('.no-flip')) return;
    setIsFlipped(!isFlipped);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const toggleReadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // stopImmediatePropagation to be extra-safe against flip handlers
    // @ts-ignore - nativeEvent exists on React's synthetic event
    e.nativeEvent && (e.nativeEvent as Event).stopImmediatePropagation && (e.nativeEvent as Event).stopImmediatePropagation();
    setIsExpanded(!isExpanded);
  };

  // Check if description is long enough to need truncation
  const needsTruncation = reward.description && reward.description.length > 120;
  const isCurrentlyExpanded = isExpanded || isHoveringDescription;

  return (
    <div className={`modern-reward-card ${!unlocked ? 'locked' : ''}`}>
      <div 
        className={`card-inner ${isFlipped ? 'flipped' : ''}`}
        onClick={handleCardClick}
      >
        {/* Front of card */}
        <div 
          className="card-front"
          style={{ 
            background: `linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt) 50%, ${theme.accent} 100%)`,
            borderTop: `3px solid ${theme.primary}`,
          }}
        >
          {/* Decorative background shapes */}
          <svg
            className="card-decoration"
            viewBox="0 0 375 283"
            fill="none"
          >
            <rect
              x="159.52"
              y="175"
              width="152"
              height="152"
              rx="8"
              transform="rotate(-45 159.52 175)"
              fill="rgba(255, 255, 255, 0.1)"
            />
            <rect
              y="107.48"
              width="152"
              height="152"
              rx="8"
              transform="rotate(-45 0 107.48)"
              fill="rgba(255, 255, 255, 0.05)"
            />
          </svg>

          {/* Image Section */}
          <div className="card-image-section">
            <div className="image-shadow"></div>
            {processedImageUrl ? (
              <img
                src={processedImageUrl}
                alt={reward.title}
                className="reward-image"
                loading="lazy"
              />
            ) : (
              <div className="reward-image-placeholder">
                🎁
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="card-content">
            <div className="card-info">
              <h3 className="reward-title">{reward.title}</h3>
              <p className="campus-text">{reward.campus}</p>
              <span className={`level-badge ${unlocked ? 'unlocked' : 'locked'}`}>
                Level {reward.level}
              </span>
            </div>
            
            <div className="like-section">
              <button
                className={`front-like-btn ${liked ? 'liked' : ''}`}
                disabled={likeLoading}
                onClick={(e) => handleButtonClick(e, () => onToggleLike(reward))}
                aria-label={liked ? 'Unlike reward' : 'Like reward'}
              >
                <span className="heart-icon">{liked ? '♥' : '♡'}</span>
                <span className="like-count">{reward.likes || 0}</span>
              </button>
            </div>
          </div>

          <div className="flip-indicator">
            <span>ℹ️ Click for details</span>
          </div>
        </div>

        {/* Back of card */}
        <div className="card-back">
          <div className="card-back-content">
            <h3>{reward.title}</h3>
            
            <div className="scrollable-content">
              <div
                className={`reward-description ${needsTruncation && !isCurrentlyExpanded ? 'truncated' : 'expanded'}`}
                onMouseEnter={() => setIsHoveringDescription(true)}
                onMouseLeave={() => setIsHoveringDescription(false)}
              >
                {reward.description}
              </div>
              {needsTruncation && (
                <span className="read-more-wrap">
                  <button 
                    className="read-more-btn no-flip" 
                    onClick={toggleReadMore}
                    type="button"
                    aria-expanded={isExpanded}
                    title={isExpanded ? 'Show less' : 'Show full description'}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </span>
              )}
              
              <div className="reward-details">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{reward.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Campus:</span>
                  <span className="detail-value">{reward.campus}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Points Required:</span>
                  <span className="detail-value">{reward.pointsCost} pts</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Level Required:</span>
                  <span className="detail-value">
                    Level {reward.level} 
                    <span className={`level-status ${unlocked ? 'unlocked' : 'locked'}`}>
                      {unlocked ? ' (Unlocked)' : ' (Locked)'}
                    </span>
                  </span>
                </div>
                {reward.stock && (
                  <div className="detail-item">
                    <span className="detail-label">Stock:</span>
                    <span className="detail-value">{reward.stock}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons - always visible at bottom */}
            <div className="card-actions">
              {reward.externalLink && (
                <a
                  href={reward.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn external-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit Link
                </a>
              )}
              
              <button
                className={`action-btn claim-btn no-flip ${status === 'approved' ? 'claimed' : ''}`}
                disabled={!unlocked || (alreadyClaimed && status !== 'rejected') || isClaiming}
                onClick={(e) => handleButtonClick(e, () => onClaim(reward))}
              >
                {!unlocked ? 'Locked'
                  : isClaiming ? 'Submitting...'
                  : status === 'approved' ? `Claimed - ${profile?.house || ''}`
                  : status === 'pending' ? 'Pending...'
                  : status === 'rejected' ? 'Claim Again'
                  : 'Claim Reward'}
              </button>

              <button
                className={`action-btn like-btn no-flip ${liked ? 'liked' : ''}`}
                disabled={likeLoading}
                onClick={(e) => handleButtonClick(e, () => onToggleLike(reward))}
                aria-label={liked ? 'Unlike reward' : 'Like reward'}
              >
                <span className="heart-icon">{liked ? '♥' : '♡'}</span>
                <span>{reward.likes || 0} likes</span>
              </button>

              {/* Status information */}
              {status && (
                <div className={`status-info ${status}`}>
                  {status === 'rejected' ? 'Last claim was rejected' : 
                   status === 'pending' ? 'Claim is being reviewed' :
                   status === 'approved' ? 'Successfully claimed!' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernRewardCard;
