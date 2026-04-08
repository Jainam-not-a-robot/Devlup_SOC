import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Mentors from "./pages/Mentors";
import Leaderboard from "./pages/Leaderboard";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import ProjectDetail from "./pages/ProjectDetail";
import ApplyPage from "./pages/ApplyPage";
import Contact from "./pages/Contact";
import Stats from "./pages/Stats";
import Timeline from "./pages/Timeline";
import { TerminalProvider } from "./context/TerminalContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ShortcutProvider from "./components/ShortcutProvider";
import SnowEffect from "./components/SnowEffect";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import Entry3D from "./pages/Entry3D";
import EntryLoader from "./pages/EntryLoader";
import {
  LAST_CONTENT_ROUTE_KEY,
  MONITOR_EMBED_QUERY_KEY,
  MONITOR_EMBED_QUERY_VALUE,
  PRESERVE_LAST_CONTENT_ROUTE_STATE,
} from "./constants/navigation";
import FormPage from './pages/form';


const queryClient = new QueryClient();
const WEBSITE_BACK_EXIT_STATE = "__devlupWebsiteBackExitState";
const WEBSITE_BACK_TRAP_STATE = "__devlupWebsiteBackTrapState";

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEntryPage = location.pathname === "/" || location.pathname === "/entry";
  const isMonitorEmbed =
    new URLSearchParams(location.search).get(MONITOR_EMBED_QUERY_KEY) === MONITOR_EMBED_QUERY_VALUE;
  const isProjectDetailPage =
  location.pathname.startsWith("/projects/") &&
  location.pathname !== "/projects";

  const { showSnow } = useTheme();

  useEffect(() => {
    if (isEntryPage || isMonitorEmbed) return;

    if (
      location.pathname === "/home" &&
      location.state &&
      typeof location.state === "object" &&
      PRESERVE_LAST_CONTENT_ROUTE_STATE in location.state &&
      location.state[PRESERVE_LAST_CONTENT_ROUTE_STATE]
    ) {
      return;
    }

    const route = `${location.pathname}${location.search}${location.hash}`;
    window.sessionStorage.setItem(LAST_CONTENT_ROUTE_KEY, route);
  }, [isEntryPage, isMonitorEmbed, location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (isEntryPage || isMonitorEmbed) return;

    const route = `${location.pathname}${location.search}${location.hash}`;
    const historyState = window.history.state ?? {};

    if (!historyState[WEBSITE_BACK_TRAP_STATE]) {
      window.history.replaceState(
        {
          ...historyState,
          [WEBSITE_BACK_EXIT_STATE]: true,
        },
        "",
        route,
      );

      window.history.pushState(
        {
          [WEBSITE_BACK_TRAP_STATE]: true,
        },
        "",
        route,
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      if (!event.state?.[WEBSITE_BACK_EXIT_STATE]) return;
      navigate("/entry", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isEntryPage, isMonitorEmbed, location.hash, location.pathname, location.search, navigate]);

  return (
    <div className="flex flex-col min-h-screen relative">
      {showSnow && !isMonitorEmbed && <SnowEffect />}
      {/* <div className="relative" style={{ zIndex: 10 }}> */}
        {!isEntryPage && <Navbar />}

      {/* </div> */}
      <main className="flex-grow relative" >
        <Routes>
          <Route path="/" element={<EntryLoader />} />
          <Route path="/entry" element={<Entry3D />} />
          <Route path="/home" element={<Home />} />
          <Route path="/terminal" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/ongoing" element={<Projects />} />
          <Route path="/projects/completed" element={<Projects />} />
          <Route path="/projects/archived" element={<Projects />} />
          <Route path="/projects/issues" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/apply/:projectId" element={<ApplyPage />} />
          <Route path="/apply/form" element={<FormPage />} />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* Only render Footer if not on ProjectDetail page (which has its own custom Footer) */}
      {!isEntryPage && !isProjectDetailPage && (
  <div className="relative" style={{ zIndex: 10 }}>
    <Footer />
  </div>
)}

    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <TerminalProvider>
            <BrowserRouter>
              <ShortcutProvider>
                <AppContent />
                {/* Add analytics tracker to record page visits */}
                <AnalyticsTracker />
              </ShortcutProvider>
            </BrowserRouter>
          </TerminalProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
