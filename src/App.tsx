import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import ContentStudio from "./pages/ContentStudio";
import MediaImage from "./pages/MediaImage";
import MediaVideo from "./pages/MediaVideo";
import MediaVoice from "./pages/MediaVoice";
import AssetLibrary from "./pages/AssetLibrary";
import Scheduler from "./pages/Scheduler";
import WalletBilling from "./pages/WalletBilling";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content" element={<ContentStudio />} />
            <Route path="/media/image" element={<MediaImage />} />
            <Route path="/media/video" element={<MediaVideo />} />
            <Route path="/media/voice" element={<MediaVoice />} />
            <Route path="/assets" element={<AssetLibrary />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/wallet" element={<WalletBilling />} />
            <Route path="/members" element={<Members />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
