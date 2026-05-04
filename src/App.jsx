import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WorkspaceDock from './components/WorkspaceDock';
import ProfileOnboardingModal from './components/ProfileOnboardingModal';
import Home from './pages/Home';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import StudyAssistant from './pages/StudyAssistant';
import Leaves from './pages/Leaves';
import Timetable from './pages/Timetable';
import Admin from './pages/Admin';
import Faculty from './pages/Faculty';
import PrivacyPolicy from './pages/Legal';
import Papers from './pages/Papers';
import MarkAttendance from './pages/MarkAttendance';
import DebugCreateFaculty from './pages/DebugCreateFaculty';
import Enroll from './pages/Enroll';
import ProtectedRoute from './components/ProtectedRoute';
import VoiceAssistant from './components/VoiceAssistant';
import './App.css';

function App() {
  // Force unregister stale service workers that block local AI requests
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Unregistered stale ServiceWorker');
        }
      });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="app-container">

          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/papers" element={<ProtectedRoute><Papers /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/study-assistant" element={<ProtectedRoute><StudyAssistant /></ProtectedRoute>} />
              <Route path="/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
              <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><Admin /></ProtectedRoute>} />
              <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}><Faculty /></ProtectedRoute>} />
              <Route path="/mark-attendance" element={<MarkAttendance />} />
              <Route path="/enroll/:classId" element={<Enroll />} />
              <Route path="/debug-faculty-setup" element={<DebugCreateFaculty />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </main>
          {/* Global Workspace Dock — visible on every page */}
          <WorkspaceDock />
          <VoiceAssistant />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
