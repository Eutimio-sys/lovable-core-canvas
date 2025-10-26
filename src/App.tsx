import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ContentStudio from "./pages/ContentStudio";
import MediaImage from "./pages/MediaImage";
import MediaVideo from "./pages/MediaVideo";
import MediaVoice from "./pages/MediaVoice";
import AssetLibrary from "./pages/AssetLibrary";
import Scheduler from "./pages/Scheduler";
import Connections from "./pages/Connections";
import AutomationBuilder from "./pages/AutomationBuilder";
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
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContentStudio />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/image"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MediaImage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/video"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MediaVideo />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/voice"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MediaVoice />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AssetLibrary />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduler"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Scheduler />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Connections />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/automation"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AutomationBuilder />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WalletBilling />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Members />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
