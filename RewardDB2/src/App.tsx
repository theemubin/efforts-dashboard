
import ThemeProvider from './components/ThemeProvider';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { RewardsSection } from './components/RewardsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { HeroSection } from './components/HeroSection';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <HeroSection />
      <Navbar />
      <DashboardOverview id="dashboard" />
      <RewardsSection id="rewards" />
      <LeaderboardSection id="leaderboard" />
    </ThemeProvider>
  );
}

export default App;
