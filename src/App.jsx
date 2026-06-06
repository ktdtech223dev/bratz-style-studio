import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import AffectionPopup from './components/AffectionPopup';
import GlobalAudio from './components/GlobalAudio';
import TabBar from './components/TabBar';

import Login from './pages/Login';
import Home from './pages/Home';
import Pet from './pages/Pet';
import Plant from './pages/Plant';
import Mood from './pages/Mood';
import Games from './pages/Games';
import GamePlay from './pages/GamePlay';
import GameResults from './pages/GameResults';
import Music from './pages/Music';
import Photos from './pages/Photos';
import Diary from './pages/Diary';
import DiaryEntry from './pages/DiaryEntry';
import Notes from './pages/Notes';
import NoteEditor from './pages/NoteEditor';
import AboutUs from './pages/AboutUs';
import Affection from './pages/Affection';
import Activity from './pages/Activity';
import MapPage from './pages/MapPage';

function Shell({ children, tabs = true }) {
  return (
    <div className="app-shell">
      {children}
      {tabs && <TabBar />}
    </div>
  );
}

export default function App() {
  const me = useStore((s) => s.me);
  const init = useStore((s) => s.init);
  const location = useLocation();

  useEffect(() => {
    if (me) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  if (!me) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <AffectionPopup />
      <GlobalAudio />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Shell><Home /></Shell>} />
          <Route path="/games" element={<Shell><Games /></Shell>} />
          <Route path="/affection" element={<Shell><Affection /></Shell>} />
          <Route path="/about" element={<Shell><AboutUs /></Shell>} />
          <Route path="/activity" element={<Shell><Activity /></Shell>} />

          <Route path="/pet" element={<Shell tabs={false}><Pet /></Shell>} />
          <Route path="/plant" element={<Shell tabs={false}><Plant /></Shell>} />
          <Route path="/mood" element={<Shell tabs={false}><Mood /></Shell>} />
          <Route path="/music" element={<Shell tabs={false}><Music /></Shell>} />
          <Route path="/map" element={<Shell tabs={false}><MapPage /></Shell>} />
          <Route path="/photos" element={<Shell tabs={false}><Photos /></Shell>} />
          <Route path="/diary" element={<Shell tabs={false}><Diary /></Shell>} />
          <Route path="/diary/:date" element={<Shell tabs={false}><DiaryEntry /></Shell>} />
          <Route path="/notes" element={<Shell tabs={false}><Notes /></Shell>} />
          <Route path="/notes/new" element={<Shell tabs={false}><NoteEditor /></Shell>} />
          <Route path="/games/:gameId" element={<Shell tabs={false}><GamePlay /></Shell>} />
          <Route path="/games/:gameId/results/:sessionId" element={<Shell tabs={false}><GameResults /></Shell>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
