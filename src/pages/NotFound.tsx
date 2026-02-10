import React from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import TerminalHeader from "../components/TerminalHeader";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-terminal/95 flex flex-col items-center p-2 sm:p-4">
      <div className="terminal-window max-w-4xl w-full mx-auto my-4 sm:my-8 flex-grow flex flex-col">
        <TerminalHeader title="404 - Page Not Found" />
        <div className="terminal-body flex-grow flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md mx-auto w-full">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 text-terminal-error">
                404
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-terminal-dim mb-2 sm:mb-3">
                Oops! Page not found
              </p>
              <p className="text-sm sm:text-base text-terminal-dim/80 mb-6 sm:mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 bg-terminal-accent hover:bg-terminal-accent/80 text-black font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <Home size={18} className="sm:w-5 sm:h-5" />
                <span>Return to Home</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 bg-terminal-dim/20 hover:bg-terminal-dim/30 text-terminal-text font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-all border border-terminal-dim text-sm sm:text-base"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                <span>Go Back</span>
              </button>
            </div>
            
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-terminal-dim">
              <p className="text-xs sm:text-sm text-terminal-dim/60 mb-2">
                Tried to access:
              </p>
              <code className="block text-xs sm:text-sm text-terminal-accent bg-terminal-dim/20 px-3 py-2 rounded break-all">
                {location.pathname}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
