import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './ChatPage';
import FileManager from './FileManager';
import ManagementCenter from './ManagementCenter';
import TracePage from './TracePage';
import EvalSetsPage from './EvalSetsPage';
import EvalSetDetail from './EvalSetDetail';
import EvaluationRunDetail from './EvaluationRunDetail';
import SemanticService from './SemanticService';
import TaskScheduler from './TaskScheduler';
import McpTools from './McpTools';
import LoginPage from './LoginPage';
import Layout from './Layout';
import { AppProvider, useApp } from './AppContext';
import './index.css';

window.global = window;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loadingAuth } = useApp();
  
  if (loadingAuth) {
      return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  
  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  // Clone Layout to pass children, but Layout handles logic internally now
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<LoginPage />} />
            
            <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/file-manager" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
            <Route path="/semantic-service" element={<ProtectedRoute><SemanticService /></ProtectedRoute>} />
            <Route path="/mcp-tools" element={<ProtectedRoute><McpTools /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute><TaskScheduler /></ProtectedRoute>} />
            <Route path="/management" element={<ProtectedRoute><ManagementCenter /></ProtectedRoute>} />
            <Route path="/evaluation/trace" element={<ProtectedRoute><TracePage /></ProtectedRoute>} />
            <Route path="/evaluation/sets" element={<ProtectedRoute><EvalSetsPage /></ProtectedRoute>} />
            <Route path="/evaluation/sets/:id" element={<ProtectedRoute><EvalSetDetail /></ProtectedRoute>} />
            <Route path="/evaluation/runs/:id" element={<ProtectedRoute><EvaluationRunDetail /></ProtectedRoute>} />
        </Routes>
    );
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);