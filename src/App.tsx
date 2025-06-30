
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from '@/pages/LandingPage';
import RegistrationPage from '@/pages/RegistrationPage';
import StatusCheckPage from '@/pages/StatusCheckPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AboutPage from '@/pages/AboutPage';
import CategoriesPage from '@/pages/CategoriesPage';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register/:categoryId" element={<RegistrationPage />} />
            <Route path="/status" element={<StatusCheckPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
