import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SharedSkillGapSnapshot from './pages/SharedSkillGapSnapshot';
import ResumeUpload from './pages/ResumeUpload';
import SkillGap from './pages/SkillGap';
import CareerRoadmap from './pages/CareerRoadmap';
import AIRoadmapGenerator from './pages/AIRoadmapGenerator';
import MockInterview from './pages/MockInterview';
import CodingPractice from './pages/CodingPractice';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import AppLayout from './components/AppLayout';
import { PageSkeleton } from './components/ui/Skeleton';

// Protected route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public route component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/share/skills/:token" element={<SharedSkillGapSnapshot />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeUpload />} />
        <Route path="/skills" element={<SkillGap />} />
        <Route path="/roadmap" element={<CareerRoadmap />} />
        <Route path="/roadmap-generator" element={<AIRoadmapGenerator />} />
        <Route path="/interview" element={<MockInterview />} />
        <Route path="/practice" element={<CodingPractice />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}

export default App;
