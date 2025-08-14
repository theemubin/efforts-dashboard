import ThemeProvider from './components/ThemeProvider';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { RewardsSection } from './components/RewardsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { HeroSection } from './components/HeroSection';
import LoginPage from './pages/LoginPage';
import { EventPage } from './pages/EventPage';
import AdminLayout from './pages/admin/AdminLayout';
import EventsAdmin from './pages/admin/EventsAdmin';
import RewardsAdmin from './pages/admin/RewardsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import MediaAdmin from './pages/admin/MediaAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import './index.css';

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';


function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/event" element={<EventPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<EventsAdmin />} />
            <Route path="events" element={<EventsAdmin />} />
            <Route path="rewards" element={<RewardsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="media" element={<MediaAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="*" element={<Navigate to="events" replace />} />
          </Route>
          <Route path="/" element={
            <>
              <HeroSection />
              <Navbar />
              <DashboardOverview id="dashboard" />
              <RewardsSection id="rewards" />
              <LeaderboardSection id="leaderboard" />
            </>
          } />
        </Routes>
        <footer className="site-footer">
          <div className="footer-columns footer-three-cols">
            <div className="footer-sitemap">
              <h4>Sitemap</h4>
              <ul>
                <li><a href="#dashboard">Dashboard</a></li>
                <li><a href="#rewards">Rewards</a></li>
                <li><a href="#leaderboard">Leaderboard</a></li>
                <li><a href="#request">Request Rewards</a></li>
                <li><a href="/event" style={{color:'#00e6d2',fontWeight:600}}>Events</a></li>
                <li><Link to="/login" style={{color:'#1ed760',fontWeight:600}}>Login</Link></li>
                <li><Link to="/admin" style={{color:'#fff',fontWeight:600}}>Admin</Link></li>
              </ul>
            </div>
            <div className="footer-calendar-col">
              <h4>Upcoming Events</h4>
              <ul className="footer-calendar-list">
                <li><strong>Sep 5:</strong> Teachers' Day</li>
                <li><strong>Sep 20:</strong> Sports Fest</li>
                <li><em>More events coming soon...</em></li>
              </ul>
            </div>
            <div className="footer-calendar-col footer-calendar-past">
              <h4>Past Events</h4>
              <ul className="footer-calendar-list">
                <li><strong>Aug 15:</strong> Independence Day Celebration</li>
                <li><strong>Aug 22:</strong> Coding Contest</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom-message">
            Made with <span style={{color:'#ff0058',fontWeight:700}}>&#10084;</span> for Navgurukul Partners.
          </div>
        </footer>
      </ThemeProvider>
    </Router>
  );
}

export default App;
