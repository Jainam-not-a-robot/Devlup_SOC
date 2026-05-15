import React from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import TerminalHeader from "../components/TerminalHeader";

const ApplyPage = () => {
  return (
    <div className="min-h-screen bg-terminal/95 flex flex-col items-center p-2 sm:p-4">
      <div className="terminal-window max-w-4xl w-full mx-auto my-4 sm:my-8">
        <TerminalHeader title="Applications Coming Soon" />

        <div className="terminal-body min-h-[500px] overflow-y-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto text-center space-y-5 sm:space-y-6 py-6 sm:py-10">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-terminal-text">
                Mentee applications will be live soon.
              </h2>
              <p className="text-sm sm:text-base text-terminal-dim leading-relaxed">
                We’re currently preparing the application cycle. When submissions open, this page will be updated with the full application flow.
              </p>
              <p className="text-sm sm:text-base text-terminal-dim leading-relaxed">
                If you’re facing any other issues or need help right now, please reach out through our Contact page.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-terminal-accent hover:bg-terminal-accent/80 text-black font-semibold px-5 py-3 rounded-md transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <Mail size={18} />
                <span>Contact DevlUp</span>
              </Link>

              <Link
                to="/projects"
                className="inline-flex items-center justify-center gap-2 bg-terminal-dim/20 hover:bg-terminal-dim/30 text-terminal-text font-medium px-5 py-3 rounded-md transition-all border border-terminal-dim text-sm sm:text-base"
              >
                <span>Go to Projects</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;
