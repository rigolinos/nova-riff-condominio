import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import LoadingScreen from "./pages/LoadingScreen";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EventCreatedShare from "./pages/EventCreatedShare";
import EventProfile from "./pages/EventProfile";
import EditEvent from "./pages/EditEvent";
import EventParticipants from "./pages/EventParticipants";
import UserProfile from "./pages/UserProfile";
import MyEvents from "./pages/MyEvents";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import EditProfilePage from "./pages/EditProfilePage";
import EventEvaluation from "./pages/EventEvaluation";
import Matchmaking from "./pages/Matchmaking";
import Amenities from "./pages/Amenities";
import GuestList from "./pages/GuestList";
import PortariaDashboard from "./pages/PortariaDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import SecurityHeaders from "./components/SecurityHeaders";
import { BottomNav } from "./components/layout/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SecurityHeaders />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loading" element={<LoadingScreen />} />
          
          {/* Public Routes - Viewable by all, actions require auth */}
          <Route path="/events" element={<PublicRoute><Events /></PublicRoute>} />
          <Route path="/event/:id" element={<PublicRoute><EventProfile /></PublicRoute>} />
          <Route path="/profile/:id" element={<PublicRoute><UserProfile /></PublicRoute>} />
          
          {/* App Dashboard (New Condominium Home) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/portaria" element={<ProtectedRoute><PortariaDashboard /></ProtectedRoute>} />
          <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
          <Route path="/amenities" element={<ProtectedRoute><Amenities /></ProtectedRoute>} />
          <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/event-created/:eventId" element={<ProtectedRoute><EventCreatedShare /></ProtectedRoute>} />
          <Route path="/event/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
          <Route path="/event/:id/participants" element={<ProtectedRoute><EventParticipants /></ProtectedRoute>} />
          <Route path="/event/:id/guests" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />
          <Route path="/event-evaluation/:eventId" element={<ProtectedRoute><EventEvaluation /></ProtectedRoute>} />
          <Route path="/profile/current" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
