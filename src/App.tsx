import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/AuthProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BuildingDetail from "./pages/BuildingDetail";
import RoomsList from "./pages/RoomsList";
import RoomDetail from "./pages/RoomDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LandlordDashboard from "./pages/LandlordDashboard";
import PaymentSuccess from "./pages/PaymentSuccess"; // Added import for PaymentSuccess
import ApplicationForm from "./pages/ApplicationForm";
import NotFound from "./pages/NotFound";
import SeedDatabase from "@/pages/SeedDatabase";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/seed" element={<SeedDatabase />} />
            <Route path="/application/:roomId" element={<ApplicationForm />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/dashboard/success" element={<PaymentSuccess />} />
            {/* Dynamic building routes */}
            <Route path="/:buildingSlug" element={<BuildingDetail />} />
            <Route path="/:buildingSlug/rooms" element={<RoomsList />} />
            <Route path="/:buildingSlug/rooms/:roomId" element={<RoomDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
