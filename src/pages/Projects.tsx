import React from 'react';
import { useTerminal } from '../context/TerminalContext';
import ProjectCard from '../components/ProjectCard';
import TerminalHeader from '../components/TerminalHeader';
import RepoSocialPreview from '../components/RepoSocialPreview';
import { Search, Filter, X, FileText, Github, ExternalLink, Mail, Linkedin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Projects = () => {
  const { 
    projects, 
    loading,
    searchQuery,
    setSearchQuery,
    techFilter,
    setTechFilter
  } = useTerminal();
  
  // Get all unique tech stacks
  const allTechStacks = React.useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach(project => {
      if (project.techStack && Array.isArray(project.techStack)) {
        project.techStack.forEach(tech => techSet.add(tech));
      }
    });
    return Array.from(techSet).sort();
  }, [projects]);

  // Filter projects based on search query and tech filter
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchQuery ? 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) : 
        true;
      
      const matchesTech = techFilter ? 
        project.techStack.some(tech => tech.toLowerCase() === techFilter.toLowerCase()) : 
        true;
      
      return matchesSearch && matchesTech;
    });
  }, [projects, searchQuery, techFilter]);

  // Selected tab (Ongoing / Completed / Archived) derived from URL
  const navigate = useNavigate();
  const location = useLocation();
  const showArchived = import.meta.env.VITE_SHOW_ARCHIVED === '1';

  // Selected tab (Ongoing / Completed / Archived) derived from URL
  const getTabFromPath = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    // parts might be ['projects'] or ['projects','ongoing']
    if (parts[1] === 'ongoing') return 'Ongoing';
    if (parts[1] === 'completed') return 'Completed';
    if (parts[1] === 'archived' && showArchived) return 'Archived';
    return 'Ongoing';
  };

  const [selectedTab, setSelectedTab] = React.useState<'Ongoing' | 'Completed' | 'Archived'>(getTabFromPath(location.pathname));

  React.useEffect(() => {
    const t = getTabFromPath(location.pathname);
    setSelectedTab(t);
  }, [location.pathname, showArchived]);

  const projectsForTab = React.useMemo(() => {
    return filteredProjects.filter(p => {
      const s = (p.status || '').toLowerCase() || 'completed';
      if (selectedTab.toLowerCase() === 'ongoing') return s === 'ongoing';
      if (selectedTab.toLowerCase() === 'archived') return s === 'archived';
      return s === 'completed';
    });
  }, [filteredProjects, selectedTab]);

  // Small inline preview component for Completed projects (preview-only)
  const InlineSitePreview: React.FC<{ url: string }> = ({ url }) => {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const [loaded, setLoaded] = React.useState(false);
    const [failed, setFailed] = React.useState(false);

    // Use a ref for the timeout so we can clear it when iframe loads
    const timeoutRef = React.useRef<number | null>(null);

    // Domains known to block framing (will refuse to connect). If domain is blocked,
    // skip attempting an iframe and immediately show the fallback. Note: github is
    // handled specially to show a social-thumbnail instead of an attempted iframe.
    const blockedDomains = React.useMemo(() => new Set([
      'gitlab.com', 'youtube.com', 'docs.google.com', 'drive.google.com', 'linkedin.com', 'medium.com'
    ]), []);

    // quick detection if url points to a github repo (owner/repo)
    const isGithubRepo = React.useMemo(() => {
      if (!normalized) return false;
      try {
        const u = new URL(normalized);
        if (!u.hostname.includes('github.com')) return false;
        const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean);
        return parts.length >= 2;
      } catch (e) {
        return false;
      }
    }, [normalized]);

    React.useEffect(() => {
      setLoaded(false);
      setFailed(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!normalized || isGithubRepo) return;

      // quick domain check
      let domain = '';
      try {
        domain = new URL(normalized).hostname.replace(/^www\./, '');
      } catch (e) {
        domain = '';
      }

      if (domain && blockedDomains.has(domain)) {
        // Known-blocking domains: mark failed immediately so we don't try to iframe
        setFailed(true);
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        setFailed(true);
        timeoutRef.current = null;
      }, 4000);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [normalized, blockedDomains, isGithubRepo]);

    // If it's a GitHub repo, render the social-preview thumbnail instead of an iframe
    if (isGithubRepo && normalized) {
      return (
        <div className="border border-terminal-dim rounded overflow-hidden" style={{ minHeight: 200 }}>
          <RepoSocialPreview repoUrl={normalized} className="w-full h-64 object-cover" />
        </div>
      );
    }

    return (
      <div>
        <div className="border border-terminal-dim rounded overflow-hidden" style={{ minHeight: 200 }}>
          {!failed && (
            <iframe
              src={normalized}
              title={`preview-${normalized}`}
              className="w-full h-64"
              onLoad={() => {
                setLoaded(true);
                setFailed(false);
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
              }}
              sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
            />
          )}

          {(failed || !normalized) && (
            // Show fallback image when preview fails after timeout
            <div className="w-full h-64 flex items-center justify-center bg-terminal-dim/10">
              <img src="/uploads/a04b4cd1-93e6-496f-a36f-bae3a41203d5.png" alt="DevlUp" className="max-h-56 object-contain" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Component to render a completed project's compact card with tabs (Preview | Docs | Mentors | Links)
  const CompletedProjectCard: React.FC<{ project: any }> = ({ project }) => {
    const [panel, setPanel] = React.useState<'Preview' | 'Docs' | 'Mentors' | 'Links'>('Preview');

    const mentors = [project.mentor, project.mentor2, project.mentor3].filter(Boolean);

    return (
      <div className="border border-terminal-dim rounded-lg p-3 sm:p-4 hover:border-terminal-accent transition-all group">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-terminal-text break-words">{project.name}</h3>
            {project.currentDesc && (
              // allow current description to wrap to next line(s) on narrow screens
              <p className="text-terminal-dim text-xs sm:text-sm mt-1 whitespace-normal break-words">{project.currentDesc}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 mb-2 sm:mb-3 flex-wrap">
          {(['Preview','Mentors','Links'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setPanel(tab)}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${panel === tab ? 'bg-terminal-accent text-black font-semibold' : 'bg-terminal-dim/20'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
          {panel === 'Preview' && (
            <div>
                            {project.liveLinks && project.liveLinks.length > 0 ? (
                project.liveLinks.map((link, idx) => {
                  const url = link.startsWith('http') ? link : `https://${link}`;
                  const domain = (() => { try { return new URL(url).hostname; } catch { return link; }})();
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded hover:border-terminal-accent min-w-0"
                    >
                      <ExternalLink size={16} className="text-terminal-accent" />
                      <div className="flex-1 min-w-0">
                        <div className="text-terminal-text truncate">{domain}</div>
                        {/* <div className="text-terminal-dim text-sm truncate">{url}</div> */}
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="text-terminal-dim">No live links provided.</div>
              )}

              {project.liveLinks && project.liveLinks.length > 0 ? (
                <div className="relative">
                  {/* Open button to go to the actual site
                  <button
                    onClick={() => {
                      const u = project.liveLinks[0].startsWith('http') ? project.liveLinks[0] : `https://${project.liveLinks[0]}`;
                      window.open(u, '_blank', 'noopener');
                    }}
                    className="absolute right-2 top-2 z-30 px-2 py-1 rounded bg-terminal-accent text-black text-sm"
                  >
                    Open
                  </button> */}

                  {/* preview container with translucent overlay to highlight Open */}
                  <div className="relative">
                    <InlineSitePreview url={project.liveLinks[0]} />
                    <div className="absolute inset-0 bg-blue/20 rounded pointer-events-none z-200" />
                  </div>
                </div>
              ) : (
                <div className="text-terminal-dim">No live links available for preview.</div>
              )}
            </div>
          )}

          {/* {panel === 'Docs' && (
            <div>
              {project.projectDoc ? (
                <a href={project.projectDoc.startsWith('http') ? project.projectDoc : `https://${project.projectDoc}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-terminal-accent hover:underline">
                  <span className="text-sm font-medium">Project Documentation</span>
                </a>
              ) : (
                <div className="text-terminal-dim">No documentation link provided.</div>
              )}
            </div>
          )} */}

          {panel === 'Mentors' && (
            <div>
              {/* Industry Mentor Section - only show if present */}
              {project.industryMentor && project.industryMentor.trim() && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg text-terminal-text mb-2 sm:mb-3 flex items-center gap-2">
                    Industry Mentor
                    {project.status && project.status.toLowerCase() === 'ongoing' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-600/90 text-white industry-mentor-badge">
                        <span className="relative z-10">Industry Mentor</span>
                      </span>
                    )}
                  </h3>
                  <div className="border border-purple-500/50 bg-purple-950/30 p-2 sm:p-3 rounded shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    <div className="font-semibold text-sm sm:text-base text-purple-200 break-words">{project.industryMentor}</div>
                    <div className="text-purple-300/80 text-xs sm:text-sm mt-1 mb-2">Industry Mentor</div>
                    <div className="mt-2 space-y-1 flex flex-wrap gap-2">
                      {project.industryMentorEmail && (
                        <a className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm" href={`mailto:${project.industryMentorEmail}`}>
                          Email
                        </a>
                      )}
                      {project.industryMentorLinkedIn && (
                        <a className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm" href={project.industryMentorLinkedIn} target="_blank" rel="noopener noreferrer">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Project Mentors Section */}
              <div>
                <h3 className="text-base sm:text-lg text-terminal-text mb-2 sm:mb-3">Project Mentors ({mentors.length})</h3>
                {mentors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {mentors.map((m, i) => (
                      <div key={i} className="border border-terminal-dim p-2 sm:p-3 rounded">
                        <div className="font-semibold text-sm sm:text-base text-terminal-text break-words">{m.name || m}</div>
                        {m.role && <div className="text-terminal-dim text-xs sm:text-sm">{m.role}</div>}
                        <div className="mt-2 space-y-1 flex flex-wrap gap-2">
                          {m.email && <a className="text-terminal-accent text-xs sm:text-sm" href={`mailto:${m.email}`}>Email</a>}
                          {m.linkedin && <a className="text-terminal-accent text-xs sm:text-sm" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                          {m.github && <a className="text-terminal-accent text-xs sm:text-sm" href={m.github} target="_blank" rel="noopener noreferrer">Github</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-terminal-dim text-sm">No mentors listed.</div>
                )}
              </div>
            </div>
          )}

          {panel === 'Links' && (
            
            <div className="space-y-2">
              {/* Project documentation */}
              {project.projectDoc ? (
                <a
                  href={project.projectDoc.startsWith('http') ? project.projectDoc : `https://${project.projectDoc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-terminal-dim p-2 rounded hover:border-terminal-accent min-w-0"
                >
                  <FileText size={18} className="text-terminal-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-terminal-text font-medium truncate">Project Documentation</div>
                    {/* <div className="text-terminal-dim text-sm truncate">{project.projectDoc.replace(/^https?:\/\//, '')}</div> */}
                  </div>
                </a>
              ) : (
                <div className="text-terminal-dim">No documentation link provided.</div>
              )}

              {/* Project Github */}
              {project.projectGithub && (
                <a
                  href={project.projectGithub.startsWith('http') ? project.projectGithub : `https://${project.projectGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-terminal-dim p-2 rounded hover:border-terminal-accent min-w-0"
                >
                  <Github size={18} className="text-terminal-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-terminal-text font-medium truncate">Project Github</div>
                    {/* <div className="text-terminal-dim text-sm truncate">{project.projectGithub.replace(/^https?:\/\//, '')}</div> */}
                  </div>
                </a>
              )}

              {/* Live links */}
              {project.liveLinks && project.liveLinks.length > 0 ? (
                project.liveLinks.map((link, idx) => {
                  const url = link.startsWith('http') ? link : `https://${link}`;
                  const domain = (() => { try { return new URL(url).hostname; } catch { return link; }})();
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 border border-terminal-dim p-2 rounded hover:border-terminal-accent min-w-0"
                    >
                      <ExternalLink size={16} className="text-terminal-accent" />
                      <div className="flex-1 min-w-0">
                        <div className="text-terminal-text truncate">{domain}</div>
                        {/* <div className="text-terminal-dim text-sm truncate">{url}</div> */}
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="text-terminal-dim">No live links provided.</div>
              )}
              {/* Mentor contact rows (uniform icon + link rows) */}
              {/* {mentors.length > 0 ? (
                <div className="pt-3">
                  <div className="text-terminal-text font-semibold mb-2">Mentor Contacts</div>
                  <div className="space-y-2">
                    {mentors.map((m, mi) => (
                      <div key={mi} className="border border-terminal-dim p-2 rounded">
                        <div className="font-medium text-terminal-text mb-1">{m.name || m}</div>
                        <div className="space-y-1">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="flex items-center gap-3 text-terminal-accent hover:underline">
                              <Mail size={16} />
                              <div className="flex-1">
                                <div className="text-terminal-text truncate">{m.email}</div>
                                <div className="text-terminal-dim text-sm">Email</div>
                              </div>
                            </a>
                          )}

                          {m.linkedin && (
                            <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-terminal-accent hover:underline">
                              <Linkedin size={16} />
                              <div className="flex-1">
                                <div className="text-terminal-text truncate">{m.linkedin.replace(/^https?:\/\//, '')}</div>
                                <div className="text-terminal-dim text-sm">LinkedIn</div>
                              </div>
                            </a>
                          )}

                          {m.github && (
                            <a href={m.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-terminal-accent hover:underline">
                              <Github size={16} />
                              <div className="flex-1">
                                <div className="text-terminal-text truncate">{m.github.replace(/^https?:\/\//, '')}</div>
                                <div className="text-terminal-dim text-sm">Github</div>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null} */}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-terminal/95 flex flex-col items-center p-2 sm:p-4">
      <div className="terminal-window max-w-6xl w-full mx-auto my-4 sm:my-8">
        <TerminalHeader title="DevlUp Projects Archive" />
        <div className="terminal-body min-h-[500px] overflow-y-auto p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-terminal-text mb-2 sm:mb-3">{selectedTab === 'Ongoing' ? 'Live Projects' : selectedTab === 'Completed' ? 'Completed Projects' : 'Archived Projects'}</h1>
            <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-3">
              {(
                showArchived ? (['Ongoing','Completed','Archived'] as const) : (['Ongoing','Completed'] as const)
              ).map(tab => (
                <button
                  key={tab}
                  onClick={() => navigate(`/projects/${tab.toLowerCase()}`)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${selectedTab === tab ? (tab === 'Completed' ? 'bg-blue-300 text-black' : tab === 'Ongoing' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white') : 'bg-terminal-dim/20 hover:bg-terminal-dim/30'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <p className="text-terminal-dim mt-2 sm:mt-3 text-xs sm:text-sm md:text-base">Use the tabs to switch between Live, Completed and Archived projects.</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Search and filter controls */}
            <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
              {/* Search input */}
              <div className="relative max-w-md">
                <Search size={14} className="absolute left-2.5 top-2 text-black" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 py-1.5 w-full text-sm text-black bg-terminal-dim/20 border border-terminal-dim/50 rounded focus:outline-none focus:border-terminal-accent placeholder:text-terminal-dim"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-2.5 top-2 text-terminal-dim hover:text-terminal-text"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Tech stack filter (disabled for now) */}
              {/**
              <div className="w-full md:w-64">
                <select
                  value={techFilter || ''}
                  onChange={(e) => setTechFilter(e.target.value || null)}
                  className="w-full px-3 py-2 bg-terminal-dim/20 border border-terminal-dim/50 rounded focus:outline-none focus:bg-terminal appearance-none"
                >
                  <option value="">All Technologies</option>
                  {allTechStacks.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
              **/}
            </div>
            
            {/* Projects list */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-terminal-accent">Loading projects...</p>
              </div>
            ) : projectsForTab.length > 0 ? (
              <div className="space-y-4">
                {projectsForTab.map((project) => {
                  if (selectedTab === 'Archived') {
                    return (
                      <div key={project.id} className="opacity-60 filter grayscale">
                        <ProjectCard project={project} />
                      </div>
                    );
                  }

                  if (selectedTab === 'Completed') {
                    // Render completed-project compact card with tabs
                    return (
                      <div key={project.id}>
                        <CompletedProjectCard project={project} />
                      </div>
                    );
                  }

                  // Default: ongoing or other
                  return <ProjectCard key={project.id} project={project} />;
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-terminal-error">No {selectedTab} Projects Available! Try Again Later</p>
                <button 
                  className="mt-3 text-terminal-accent hover:underline"
                  onClick={() => {
                    setSearchQuery('');
                    setTechFilter(null);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
