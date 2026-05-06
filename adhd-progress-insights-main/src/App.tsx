import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Overview from "./pages/Overview";
import ChildAnalytics from "./pages/ChildAnalytics";
import GameAnalytics from "./pages/GameAnalytics";
import Reports from "./pages/Reports";
import AddChild from "./pages/AddChild";
import Settings from "./pages/Settings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/child-analytics" element={<ChildAnalytics />} />
              <Route path="/add-child" element={<AddChild />} />
              <Route path="/game-analytics" element={<GameAnalytics />} />

              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
