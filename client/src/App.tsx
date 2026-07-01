import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Championships from './pages/Championships';
import ChampionshipDetail from './pages/ChampionshipDetail';
import Standings from './pages/Standings';
import Statistics from './pages/Statistics';
import DriverProfile from './pages/DriverProfile';
import RaceDetail from './pages/RaceDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminChampionship from './pages/AdminChampionship';
import CompareDrivers from './pages/CompareDrivers';
import News from './pages/News';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, elite }: { children: React.ReactNode; elite?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (elite && user.role !== 'elite') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/championships" element={<Championships />} />
        <Route path="/championships/:id" element={<ChampionshipDetail />} />
        <Route path="/championships/:id/standings" element={<Standings />} />
        <Route path="/championships/:id/statistics" element={<Statistics />} />
        <Route path="/drivers/:id" element={<DriverProfile />} />
        <Route path="/races/:id" element={<RaceDetail />} />
        <Route path="/compare" element={<CompareDrivers />} />
        <Route path="/news" element={<News />} />
        <Route path="/admin" element={<ProtectedRoute elite><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/championships/:id" element={<ProtectedRoute elite><AdminChampionship /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
