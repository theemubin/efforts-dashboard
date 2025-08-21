
import { useState } from 'react';
import './Navbar.css';

export const Navbar = () => {

  const [loggedIn, setLoggedIn] = useState(false);
  const userName = 'User Name';

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__logo">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="navbar__center-group">
          <ul className="navbar__links">
            <li><a href="#dashboard" className="hover-underline">Dashboard</a></li>
            <li><a href="#rewards" className="hover-underline">Rewards</a></li>
            <li><a href="#leaderboard" className="hover-underline">Leaderboard</a></li>
            <li><a href="#request" className="hover-underline">Request Rewards</a></li>
          </ul>
          <div className="navbar__user-info-modern">
            {!loggedIn ? (
              <button className="navbar__login-btn-modern" onClick={() => setLoggedIn(true)}>Log in</button>
            ) : (
              <div className="navbar__user-display" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="navbar__user-name-modern" style={{ display: 'inline-flex', alignItems: 'center' }}>{userName}</span>
                <button className="navbar__logout-btn-modern" onClick={() => setLoggedIn(false)} style={{ marginLeft: 8 }}>Log out</button>
              </div>
            )}
          </div>
        </div>
        <button className="navbar__toggle" aria-label="Open menu">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>
    </nav>
  );
}

