import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BuildingDetail from "./pages/BuildingDetail";
import RoomsList from "./pages/RoomsList";
import RoomDetail from "./pages/RoomDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ApplicationForm from "./pages/ApplicationForm";
import NotFound from "./pages/NotFound";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/okitipupa" element={<BuildingDetail />} />
          <Route path="/okitipupa/rooms" element={<RoomsList />} />
          <Route path="/okitipupa/rooms/:roomName" element={<RoomDetail />} />
          <Route path="/apply/:roomName" element={<ApplicationForm />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Catch-all for any building slug */}
          <Route path="/:buildingSlug" element={<BuildingDetail />} />
          <Route path="/:buildingSlug/rooms" element={<RoomsList />} />
          <Route path="/:buildingSlug/rooms/:roomName" element={<RoomDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
