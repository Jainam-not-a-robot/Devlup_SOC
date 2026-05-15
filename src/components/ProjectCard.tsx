import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  mentor: {
    name: string;
    role: string;
    email: string;
    linkedin?: string;
    github?: string;
  };
  mentor2?: {
    name: string;
    role: string;
    email: string;
    linkedin?: string;
    github?: string;
  };
  mentor3?: {
    name: string;
    role: string;
    email: string;
    linkedin?: string;
    github?: string;
  };
  projectDoc?: string;
  category?: string; // Add category field
  // New optional fields from Sheets
  status?: string; // e.g. 'Completed', 'Ongoing', 'Archived'
  currentDesc?: string; // Short description of current/completed work
  liveLinks?: string[]; // Array of live/demo links
  projectGithub?: string; // optional project github url
  industryMentor?: string; // Industry Mentor name
  industryMentorEmail?: string; // Industry Mentor email
  industryMentorLinkedIn?: string; // Industry Mentor LinkedIn URL
  recommended?: string; // Recommended difficulty level: 'Beginner', 'All', 'All - Tough'
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const mentors = [project.mentor, project.mentor2, project.mentor3].filter(Boolean);
  const { themeId } = useTheme();
  
  // Determine category label and style
  let categoryLabel = '';
  const isSummerTheme = themeId === 2;
  const isOngoing = project.status && project.status.toLowerCase() === 'ongoing';
  const rawCategory = project.category?.trim();
  const normalizedCategory = rawCategory?.toLowerCase();
  const displayCategory = normalizedCategory ? rawCategory : '';
  // For ongoing projects, show WoC '26
  if (isOngoing) {
    categoryLabel = isSummerTheme ? "SoC '26" : "WoC '26";
  } else {
    categoryLabel = 'Projects Archive';
  }

  const badgeBaseClass = 'mt-1 px-2 py-0.5 rounded text-xs font-semibold border';
  const badgeThemeClass =
    themeId === 2
      ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
      : themeId === 1
        ? 'bg-sky-500/20 text-sky-100 border-sky-400/30'
        : 'bg-green-500/20 text-green-200 border-green-400/30';
  return (
    <div className="border border-terminal-dim rounded-lg p-3 sm:p-4 hover:border-terminal-accent transition-all group flex flex-col">
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <Link to={`/projects/${project.id}`}>
            <h2 className="font-bold text-lg sm:text-xl text-terminal-text group-hover:text-terminal-accent break-words">
              {project.name}
            </h2>
          </Link>
          {/* Status badge intentionally not shown on list cards (kept in detail page) */}
          {/* Category badge */}
          {categoryLabel && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`${badgeBaseClass} ${badgeThemeClass}`}>{categoryLabel}</span>
              {isOngoing && displayCategory && (
                <span className={`${badgeBaseClass} ${badgeThemeClass} text-[11px] font-medium`}>
                  {displayCategory}
                </span>
              )}
            </div>
          )}
        </div>
        {project.recommended && (
          <div className="flex-shrink-0 mt-1">
            {project.recommended.toLowerCase() === 'beginner' && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/30 text-white-400 border border-green-500/30">
                Beginner Friendly
              </span>
            )}
            {project.recommended.toLowerCase() === 'all' && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/50 text-white-400 border border-blue-500/30">
                Open to All
              </span>
            )}
            {project.recommended.toLowerCase().includes('tough') && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/30 text-white-400 border border-red-500/30">
                Open to All
              </span>
            )}
          </div>
        )}
      </div>
      {project.status && project.status.toLowerCase() === 'completed' ? (
        <div className="mt-2 sm:mt-3">
          {project.currentDesc ? (
            <p className="text-sm sm:text-base text-terminal-dim mb-2 sm:mb-3">{project.currentDesc}</p>
          ) : (
            <p className="text-sm sm:text-base text-terminal-dim mb-2 sm:mb-3">No summary provided.</p>
          )}

          {project.liveLinks && project.liveLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.liveLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-terminal-dim/20 rounded text-xs text-terminal-accent hover:underline truncate"
                  title={link}
                >
                  {link}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-terminal-dim text-sm">No live links available.</div>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm sm:text-base text-terminal-dim mb-3 sm:mb-4">
            {project.description}
          </p>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Tech Stack with elevated subtle tags */}
            {project.techStack && project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {project.techStack.map((tech, index) => (
                  <span 
                    key={index}
                    className="bg-terminal-dim/20 border border-terminal-dim/30 px-2.5 py-1 text-xs text-terminal-text rounded shadow-sm hover:shadow-md hover:border-terminal-accent/40 transition-all"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            
            {/* Project Documentation */}
            {project.projectDoc && (
              <div className="rounded p-3 sm:p-4 bg-terminal-dim/5">
                <a 
                  href={project.projectDoc.startsWith('http') ? project.projectDoc : `https://${project.projectDoc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-terminal-accent hover:underline text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span className="font-medium">Project Documentation</span>
                </a>
              </div>
            )}
            
            {/* Industry Mentor Section - only show if present */}
            {project.industryMentor && project.industryMentor.trim() && (
              <div className=" pt-3">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-200">
                  Industry Mentor
                </h4>
                <div className="border border-dashed border-purple-500/30 bg-purple-950/30 p-2 rounded shadow-[0_0_10px_rgba(147,51,234,0.2)]">
                  <div className="font-semibold text-sm text-purple-200 break-words">{project.industryMentor}</div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {project.industryMentorEmail && (
                      <a className="text-purple-400 hover:text-purple-300 text-xs" href={`mailto:${project.industryMentorEmail}`}>
                        {project.industryMentorEmail}
                      </a>
                    )}
                    {project.industryMentorLinkedIn && (
                      <a className="text-purple-400 hover:text-purple-300 text-xs" href={project.industryMentorLinkedIn} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Project Mentors Section */}
            {mentors.length > 0 && (
              <div className=" pt-3">
                <h4 className="text-sm font-semibold text-terminal-text mb-2">
                  Project Mentors ({mentors.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mentors.map((m, i) => (
                    <div key={i} className="border border-dashed border-terminal-dim/50 p-2 rounded hover:border-terminal-accent/50 transition-colors">
                      <div className="font-semibold text-sm text-terminal-text break-words">{typeof m === 'string' ? m : m.name}</div>
                      {typeof m !== 'string' && m.role && <div className="text-terminal-dim text-xs mt-0.5">{m.role}</div>}
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {typeof m !== 'string' && m.email && <a className="text-terminal-accent text-xs hover:underline" href={`mailto:${m.email}`}>{m.email}</a>}
                        {typeof m !== 'string' && m.linkedin && <a className="text-terminal-accent text-xs hover:underline" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                        {typeof m !== 'string' && m.github && <a className="text-terminal-accent text-xs hover:underline" href={m.github} target="_blank" rel="noopener noreferrer">Github</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons: Interested & Apply Now */}
            <div className=" pt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-terminal-dim">Interested in contributing to this project?</p>
              </div>
              <Link 
                to="/apply" 
                state={{ selectedProjectId: project.id }}
                className="bg-terminal-accent hover:bg-terminal-accent/80 text-black font-semibold px-4 py-2 rounded transition-colors text-center text-xs sm:text-sm shadow-md hover:shadow-lg"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectCard;
