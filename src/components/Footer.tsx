import React from 'react';
import { Link } from 'react-router-dom';
import { Github ,Mail } from 'lucide-react';

interface FooterProps {
  label?: string;
  showRaidLogo?: boolean;
}

const Footer: React.FC<FooterProps> = ({ label, showRaidLogo = false }) => {
  const currentYear = new Date().getFullYear();
  const footerLabel = label || `DevlUp Projects Archive`;
  
  return (
    <footer className="bg-terminal border-t border-terminal-dim text-terminal-dim py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            <img 
              src="/uploads/a04b4cd1-93e6-496f-a36f-bae3a41203d5.png" 
              alt="DevlUp Labs Logo" 
              className="h-5 w-5 sm:h-6 sm:w-6 mr-2"
            />
            <span className="text-xs sm:text-sm flex items-center flex-wrap">
              <span className="break-words">{footerLabel}</span>
              <span className="mx-1">&copy; {currentYear}</span>
              {showRaidLogo && (
                <img 
                  src="/uploads/raid.png" 
                  alt="RAID Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6 ml-2"
                />
              )}
            </span>
          </div>
          
          <div className="flex space-x-3 sm:space-x-4 items-center">
            <Link 
              to="/contact" 
              className="text-terminal-dim hover:text-terminal-text transition-colors text-xs sm:text-sm flex items-center"
            >
              <Mail className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Contact Us</span>
              <span className="sm:hidden">Contact</span>
            </Link>
            <a 
              href="https://github.com/devlup-labs" 
              target="_blank"
              rel="noopener noreferrer" 
              className="text-terminal-dim hover:text-terminal-text transition-colors text-xs sm:text-sm flex items-center"
            >
              <Github size={14} className="mr-1 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
