import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EcoTrackProvider, useEcoTrack } from './context/EcoTrackContext';
import { OpeningCurtainReveal } from './components/OpeningCurtainReveal';
import { AppStartAnimation } from './components/AppStartAnimation';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ComparePage } from './pages/ComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';

const AppRoutes: React.FC = () => {
  const { authReady, isAuthenticated } = useEcoTrack();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <p className="font-mono text-sm text-[var(--text-muted)]">Initializing EcoTrack V22...</p>
      </div>
    );
  }

  return (
    <>
      <AppStartAnimation />
      <OpeningCurtainReveal />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/calculator"
          element={
            <AppShell>
              <CalculatorPage />
            </AppShell>
          }
        />
        <Route
          path="/recommendations"
          element={
            <AppShell>
              <RecommendationsPage />
            </AppShell>
          }
        />
        <Route
          path="/history"
          element={
            <AppShell>
              <HistoryPage />
            </AppShell>
          }
        />
        <Route
          path="/compare"
          element={
            <AppShell>
              <ComparePage />
            </AppShell>
          }
        />
        <Route
          path="/reports"
          element={
            <AppShell>
              <ReportsPage />
            </AppShell>
          }
        />
        <Route
          path="/about"
          element={
            <AppShell>
              <AboutPage />
            </AppShell>
          }
        />
        <Route
          path="/account"
          element={
            isAuthenticated ? (
              <AppShell>
                <AccountPage />
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <EcoTrackProvider>
        <AppRoutes />
      </EcoTrackProvider>
    </BrowserRouter>
  );
}
