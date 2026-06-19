import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/globals.css';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { SplashScreen } from './components/SplashScreen';
import LandingPage from './components/LandingPage';
import SignUpOverlay from './components/overlays/SignUpOverlay';
import LoginOverlay from './components/overlays/LoginOverlay';
import ProfileSelectOverlay from './components/overlays/ProfileSelectOverlay';
import GamesPage from './components/GamesPage';
import AboutPage from './components/AboutPage';
import StudentProfile from './components/StudentProfile';
import DashboardPage from './components/DashboardPage';
import NotFound from './components/404/NotFound';
import {ZenMain} from "./components/games/Mahjong/components/ZenMain.tsx";
import AdminPanel from "./components/admin/AdminPanel.tsx";
import SupportChatWidget from "./components/SupportChatWidget.tsx";
import DashboardLayout from "./components/learn/DashboardLayout.tsx";
import LearnHome from "./components/learn/LearnHome.tsx";
import SubjectsPage from "./components/learn/SubjectsPage.tsx";
import SubjectTopics from "./components/learn/SubjectTopics.tsx";
import TopicLesson from "./components/learn/TopicLesson.tsx";
import TopicTest from "./components/learn/TopicTest.tsx";
import ExamsList from "./components/learn/ExamsList.tsx";
import ExamRunner from "./components/learn/ExamRunner.tsx";
import LeaderboardScreen from "./components/learn/LeaderboardScreen.tsx";
import BooksPage from "./components/learn/BooksPage.tsx";
import BookReader from "./components/learn/BookReader.tsx";
import RevisionPage from "./components/learn/RevisionPage.tsx";
import RevisionRunner from "./components/learn/RevisionRunner.tsx";
import RevisionReview from "./components/learn/RevisionReview.tsx";
import AchievementsPage from "./components/learn/AchievementsPage.tsx";
import ChallengesPage from "./components/learn/ChallengesPage.tsx";
import CommunityPage from "./components/learn/CommunityPage.tsx";
import SettingsPage from "./components/learn/SettingsPage.tsx";

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      o: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
    }));
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.o += s.speed;
        if (s.o > 1) s.o = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.abs(Math.sin(s.o * Math.PI))})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user, authReady } = useStore();
  // Wait for Firebase to resolve the session before deciding (avoids a reload flash/redirect).
  if (!authReady) return null;
  return isLoggedIn && user != null ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  const { overlay, isLoggedIn, authReady } = useStore();
  const location = useLocation();
  const isGames = location.pathname === '/games';
  const isAdmin = location.pathname.startsWith('/admin');
  const LEARNER_PREFIXES = ['/home', '/learn', '/subjects', '/exams', '/revision', '/books', '/book', '/leaderboard', '/achievements', '/challenges', '/community', '/settings'];
  const isLearner = LEARNER_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  // Footer shows on every page except admin and immersive full-screen flows.
  const hideFooter =
    isAdmin ||
    location.pathname === '/games/mahjong' ||
    /^\/learn\/topic\//.test(location.pathname) ||
    /^\/exams\/[^/]+$/.test(location.pathname) ||
    /^\/revision\/[^/]+$/.test(location.pathname) ||
    /^\/book\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    document.body.classList.toggle('games-bg', isGames);
    return () => document.body.classList.remove('games-bg');
  }, [isGames]);

  return (
    <div className={`main-body-container${isGames ? ' games-mode' : ''}${isAdmin ? ' admin-mode' : ''}${isLearner ? ' learner-mode' : ''}`}>
      {isGames && <StarField />}
      {!isAdmin && <Navbar />}

      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
        {/* Wait for Firebase to resolve the session before choosing landing vs dashboard
            (prevents a logged-in user briefly seeing the landing page on refresh). */}
        <Route path="/"        element={!authReady ? null : isLoggedIn ? <Navigate to="/home" replace /> : <LandingPage />} />
        <Route path="/about"   element={<AboutPage />} />
        <Route path="/games"   element={<GamesPage />} />
        <Route path="/profile" element={<StudentProfile />} />

        <Route path="/games/mahjong" element={<ZenMain />} />

        <Route path="/profile-select"      element={<ProtectedRoute><ProfileSelectOverlay /></ProtectedRoute>} />
        <Route path="/dashboard"          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/level/*"            element={<ProtectedRoute><Navigate to="/learn" replace /></ProtectedRoute>} />

        {/* Learner experience — wrapped in the dashboard shell (sidebar) */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/home"                     element={<LearnHome />} />
          <Route path="/learn"                    element={<LearnHome />} />
          <Route path="/subjects"                 element={<SubjectsPage />} />
          <Route path="/learn/subject/:subjectId" element={<SubjectTopics />} />
          <Route path="/exams"                    element={<ExamsList />} />
          <Route path="/revision"                 element={<RevisionPage />} />
          <Route path="/revision/:subjectId/review" element={<RevisionReview />} />
          <Route path="/books"                    element={<BooksPage />} />
          <Route path="/leaderboard"              element={<LeaderboardScreen />} />
          <Route path="/achievements"             element={<AchievementsPage />} />
          <Route path="/challenges"               element={<ChallengesPage />} />
          <Route path="/community"                element={<CommunityPage />} />
          <Route path="/settings"                 element={<SettingsPage />} />
        </Route>

        {/* Focused flows (no shell) */}
        <Route path="/learn/topic/:topicId"      element={<ProtectedRoute><TopicLesson /></ProtectedRoute>} />
        <Route path="/learn/topic/:topicId/test" element={<ProtectedRoute><TopicTest /></ProtectedRoute>} />
        <Route path="/exams/:examId"             element={<ProtectedRoute><ExamRunner /></ProtectedRoute>} />
        <Route path="/revision/:subjectId"       element={<ProtectedRoute><RevisionRunner /></ProtectedRoute>} />
        <Route path="/book/:subjectId"           element={<ProtectedRoute><BookReader /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideFooter && <Footer />}

      {!isAdmin && overlay === 'signup' && <SignUpOverlay />}
      {!isAdmin && overlay === 'login'  && <LoginOverlay />}
      {!isAdmin && overlay === 'profile-select' && <ProfileSelectOverlay />}

      {!isAdmin && <SupportChatWidget />}
    </div>
  );
};

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);
  const authReady = useStore(s => s.authReady);
  useEffect(() => {
    useStore.getState().bootstrap(); // wire the Firebase auth listener once
  }, []);
  // Hold the splash until the intro animation finishes AND the auth session resolves,
  // so we never flash the landing page before the dashboard.
  const showSplash = !splashDone || !authReady;
  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
