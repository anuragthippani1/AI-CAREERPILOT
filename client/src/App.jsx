import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import SkillGap from './pages/SkillGap';
import CareerRoadmap from './pages/CareerRoadmap';
import MockInterview from './pages/MockInterview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/resume" element={<ResumeUpload />} />
      <Route path="/skills" element={<SkillGap />} />
      <Route path="/roadmap" element={<CareerRoadmap />} />
      <Route path="/interview" element={<MockInterview />} />
    </Routes>
  );
}

export default App;

