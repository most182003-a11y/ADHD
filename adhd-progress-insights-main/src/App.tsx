import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Overview from "./pages/Overview";
import ChildAnalytics from "./pages/ChildAnalytics";
import GameAnalytics from "./pages/GameAnalytics";
import Reports from "./pages/Reports";
import AddChild from "./pages/AddChild";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import GamesCatalog from "./pages/GamesCatalog";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// A simple protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard if not allowed
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    if (role === 'Doctor') return <Navigate to="/doctor" replace />;
    if (role === 'Parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = ({ darkMode, setDarkMode }: any) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes inside Dashboard Layout */}
      <Route element={
        isAuthenticated ? 
        <DashboardLayout darkMode={darkMode} onToggleDark={() => setDarkMode((d: boolean) => !d)}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><Overview /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/games" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor']}><GamesCatalog /></ProtectedRoute>} />
            <Route path="/child-analytics" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor']}><ChildAnalytics /></ProtectedRoute>} />
            <Route path="/add-child" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor']}><AddChild /></ProtectedRoute>} />
            <Route path="/game-analytics" element={<ProtectedRoute allowedRoles={['Admin']}><GameAnalytics /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor']}><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings darkMode={darkMode} onToggleDark={() => setDarkMode((d: boolean) => !d)} /></ProtectedRoute>} />
            
            {/* Redirect / to the appropriate dashboard */}
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} /> 
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
        : <Navigate to="/login" replace />
      }>
        <Route path="/*" element={null} />
      </Route>
    </Routes>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes darkMode={darkMode} setDarkMode={setDarkMode} />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
