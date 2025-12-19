import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import CustomerHeatmaps from "./pages/CustomerHeatmaps";
import CameraManagement from "./pages/CameraManagement";
import DetectionSettings from "./pages/DetectionSettings";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import SupabaseTest from "./pages/SupabaseTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/index" element={<Index />} />
          <Route path="/supabase-test" element={<SupabaseTest />} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/analytics" element={<CustomerAnalytics />} />
          <Route path="/customer/heatmaps" element={<CustomerHeatmaps />} />
          <Route path="/customer/cameras" element={<CameraManagement />} />
          <Route path="/customer/detection" element={<DetectionSettings />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Company Routes */}
          <Route path="/company" element={<CompanyDashboard />} />

          {/* Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
