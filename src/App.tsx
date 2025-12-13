import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import CustomerDashboard from "./pages/CustomerDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CameraManagement from "./pages/CameraManagement";
import DetectionSettings from "./pages/DetectionSettings";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import CustomerHeatmaps from "./pages/CustomerHeatmaps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'admin' ? '/admin' : '/customer';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Public Route (redirects if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin' : '/customer';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/requests" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRequests />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/company/:companyId" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CompanyDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/company/:companyId/cameras" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CameraManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cameras" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CameraManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/detection" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DetectionSettings />
          </ProtectedRoute>
        } 
      />

      {/* Customer Routes */}
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/analytics" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerAnalytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/heatmaps" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerHeatmaps />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/cameras" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CameraManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/detection" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <DetectionSettings />
          </ProtectedRoute>
        } 
      />

      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
