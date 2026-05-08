import React from 'react';
import { useTerminal } from '../context/TerminalContext';
import ProjectCard from '../components/ProjectCard';
import TerminalHeader from '../components/TerminalHeader';
import RepoSocialPreview from '../components/RepoSocialPreview';
import { Search, Filter, X, FileText, Github, ExternalLink, Mail, Linkedin, Plus, Upload, ImageIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGithubIssues } from '../hooks/useGithubIssues';
import ProjectIssuesPanel from '../components/ProjectIssuesPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { submitProject } from '../services/apiClient';
import { uploadToCloudinary } from '../services/cloudinaryService';

type MentorInput = { name: string; role: string; email: string; linkedin: string; github: string; image_url: string };

const Projects = () => {
  const {
    projects,
    loading,
    searchQuery,
    setSearchQuery,
    techFilter,
    setTechFilter,
    refreshProjects
  } = useTerminal();

  React.useEffect(() => {
    refreshProjects();
  }, []);

  const { toast } = useToast();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [mentorImageUploading, setMentorImageUploading] = React.useState<Record<number, boolean>>({});
  const [submitFormData, setSubmitFormData] = React.useState({
    project_title: '',
    project_description: '',
    status: 'ongoing',
    type: 'woc',
    year: new Date().getFullYear(),
    preview_link: '',
    github_repo_link: '',
    docs: '',
    is_docs_accessible: false,
    mentors: [{ name: '', role: 'Project Mentor', email: '', linkedin: '', github: '', image_url: '' }] as MentorInput[],
    tech_stack: '',
    industry_mentor_name: '',
    industry_mentor_email: '',
    industry_mentor_linkedin: '',
    category: '',
    current_desc: '',
    live_links: '',
    recommended: ''
  });

  const handleMentorImageUpload = async (index: number, file: File) => {
    setMentorImageUploading(prev => ({ ...prev, [index]: true }));
    try {
      const result = await uploadToCloudinary(file, 'mentor_images');
      const newMentors = [...submitFormData.mentors];
      newMentors[index] = { ...newMentors[index], image_url: result.secure_url };
      setSubmitFormData({ ...submitFormData, mentors: newMentors });
      toast({ title: 'Image uploaded', description: 'Mentor image uploaded successfully.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: 'Failed to upload image. Please try again.', variant: 'destructive' });
    } finally {
      setMentorImageUploading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...submitFormData,
        tech_stack: submitFormData.tech_stack ? submitFormData.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : [],
        mentors: submitFormData.mentors.filter(m => m.name.trim() !== ''),
        live_links: submitFormData.live_links ? submitFormData.live_links.split(',').map(s => s.trim()).filter(Boolean) : [],
        industry_mentor: submitFormData.industry_mentor_name ? {
          name: submitFormData.industry_mentor_name,
          email: submitFormData.industry_mentor_email || undefined,
          linkedin: submitFormData.industry_mentor_linkedin || undefined
        } : undefined
      };
      await submitProject(payload);
      toast({ title: "Success", description: "Project submitted! It will be reviewed by admins." });
      setIsSubmitModalOpen(false);
      setSubmitFormData({
        project_title: '', project_description: '', status: 'ongoing', type: 'woc',
        year: new Date().getFullYear(), preview_link: '', github_repo_link: '', docs: '', is_docs_accessible: false,
        mentors: [{ name: '', role: 'Project Mentor', email: '', linkedin: '', github: '', image_url: '' }], tech_stack: '', industry_mentor_name: '', industry_mentor_email: '',
        industry_mentor_linkedin: '', category: '', current_desc: '', live_links: '', recommended: ''
      });
      setMentorImageUploading({});
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit project. Please try again.", variant: "destructive" });
    }
  };

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
    if (parts[1] === 'issues') return 'Issues';
    if (parts[1] === 'archived' && showArchived) return 'Archived';
    return 'Ongoing';
  };
  const [selectedTab, setSelectedTab] = React.useState<
    'Ongoing' | 'Completed' | 'Issues' | 'Archived'
  >(getTabFromPath(location.pathname));


  React.useEffect(() => {
    const t = getTabFromPath(location.pathname);
    setSelectedTab(t);
  }, [location.pathname, showArchived]);

  const projectsForTab = React.useMemo(() => {
    return filteredProjects.filter(p => {
      const s = (p.status || '').toLowerCase() || 'completed';
      if (selectedTab.toLowerCase() === 'ongoing') return s === 'ongoing';
      if (selectedTab === 'Issues') return s === 'issues';
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
          {(['Preview', 'Mentors', 'Links'] as const).map(tab => (
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
                  const domain = (() => { try { return new URL(url).hostname; } catch { return link; } })();
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
                  const domain = (() => { try { return new URL(url).hostname; } catch { return link; } })();
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
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-terminal-text">{selectedTab === 'Ongoing' ? 'Live Projects' : selectedTab === 'Completed' ? 'Completed Projects' : 'Archived Projects'}</h1>
              <Button onClick={() => setIsSubmitModalOpen(true)} className="bg-terminal-accent text-black hover:bg-terminal-accent/80 flex items-center gap-2">
                <Plus size={16} /> Submit Project
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-3">
              {(
                showArchived ? (['Ongoing', 'Completed', 'Archived'] as const) : (['Ongoing', 'Completed'] as const)
              ).map(tab => (
                <button
                  key={tab}
                  onClick={() => navigate(`/projects/${tab.toLowerCase()}`)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${selectedTab === tab ? (tab === 'Completed' ? 'bg-blue-300 text-black' : tab === 'Ongoing' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white') : 'bg-terminal-dim/20 hover:bg-terminal-dim/30'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <p className="text-terminal-dim mt-2 sm:mt-3 text-xs sm:text-sm md:text-base">Use the tabs to switch between Live, Completed, and Archived projects.</p>
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
            ) : selectedTab === 'Issues' ? (
              <div className="space-y-4">
                <ProjectIssuesPanel repoUrl="https://devlup-labs.github.io/" />
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
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="terminal-window border-terminal-accent text-terminal-text max-w-3xl bg-[#0D1117] max-h-[90vh] overflow-y-auto modal-scroll">
          <DialogHeader>
            <DialogTitle className="text-terminal-accent text-xl">Submit a Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Project Title *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={submitFormData.project_title} onChange={e => setSubmitFormData({ ...submitFormData, project_title: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Description *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={submitFormData.project_description} onChange={e => setSubmitFormData({ ...submitFormData, project_description: e.target.value })} />
              </div>
              
              <div className="space-y-2">
                <Label>Type *</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" required value={submitFormData.type} onChange={e => setSubmitFormData({ ...submitFormData, type: e.target.value })}>
                  <option value="woc" className="bg-[#0D1117] text-white">WOC</option>
                  <option value="soc" className="bg-[#0D1117] text-white">SOC</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" required value={submitFormData.status} onChange={e => setSubmitFormData({ ...submitFormData, status: e.target.value })}>
                  <option value="ongoing" className="bg-[#0D1117] text-white">Ongoing</option>
                  <option value="completed" className="bg-[#0D1117] text-white">Completed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" className="bg-transparent border-terminal-dim" required value={submitFormData.year} onChange={e => setSubmitFormData({ ...submitFormData, year: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="e.g. Web Development" value={submitFormData.category} onChange={e => setSubmitFormData({ ...submitFormData, category: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>GitHub Repo Link</Label>
                <Input className="bg-transparent border-terminal-dim" value={submitFormData.github_repo_link} onChange={e => setSubmitFormData({ ...submitFormData, github_repo_link: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Docs Link *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={submitFormData.docs} onChange={e => setSubmitFormData({ ...submitFormData, docs: e.target.value })} />
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="docs_accessible" className="accent-terminal-accent bg-transparent border-terminal-dim" checked={submitFormData.is_docs_accessible} onChange={e => setSubmitFormData({ ...submitFormData, is_docs_accessible: e.target.checked })} />
                  <Label htmlFor="docs_accessible" className="text-sm text-terminal-dim cursor-pointer">Are the docs accessible to all?</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview Link</Label>
                <Input className="bg-transparent border-terminal-dim" value={submitFormData.preview_link} onChange={e => setSubmitFormData({ ...submitFormData, preview_link: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Live Links (comma separated)</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="https://..., https://..." value={submitFormData.live_links} onChange={e => setSubmitFormData({ ...submitFormData, live_links: e.target.value })} />
              </div>

              <div className="space-y-4 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-terminal-accent">Project Mentors</h4>
                  <Button type="button" variant="outline" size="sm" className="bg-transparent border-terminal-dim hover:text-white" onClick={() => setSubmitFormData({ ...submitFormData, mentors: [...submitFormData.mentors, { name: '', role: 'Project Mentor', email: '', linkedin: '', github: '', image_url: '' }] })}>
                    <Plus size={14} className="mr-1" /> Add Mentor
                  </Button>
                </div>
                {submitFormData.mentors.map((mentor, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 border border-terminal-dim/50 rounded bg-terminal-dim/5 relative group">
                    {submitFormData.mentors.length > 1 && (
                      <button type="button" onClick={() => setSubmitFormData({ ...submitFormData, mentors: submitFormData.mentors.filter((_, i) => i !== index) })} className="absolute top-2 right-2 text-terminal-dim hover:text-red-400">
                        <X size={16} />
                      </button>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs">Name *</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" required value={mentor.name} onChange={e => {
                        const newMentors = [...submitFormData.mentors];
                        newMentors[index].name = e.target.value;
                        setSubmitFormData({ ...submitFormData, mentors: newMentors });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Role</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.role} onChange={e => {
                        const newMentors = [...submitFormData.mentors];
                        newMentors[index].role = e.target.value;
                        setSubmitFormData({ ...submitFormData, mentors: newMentors });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Email</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" type="email" value={mentor.email} onChange={e => {
                        const newMentors = [...submitFormData.mentors];
                        newMentors[index].email = e.target.value;
                        setSubmitFormData({ ...submitFormData, mentors: newMentors });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">LinkedIn URL</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.linkedin} onChange={e => {
                        const newMentors = [...submitFormData.mentors];
                        newMentors[index].linkedin = e.target.value;
                        setSubmitFormData({ ...submitFormData, mentors: newMentors });
                      }} />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label className="text-xs">GitHub URL</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.github} onChange={e => {
                        const newMentors = [...submitFormData.mentors];
                        newMentors[index].github = e.target.value;
                        setSubmitFormData({ ...submitFormData, mentors: newMentors });
                      }} />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label className="text-xs">Mentor Image</Label>
                      <div className="flex items-center gap-3">
                        {mentor.image_url ? (
                          <img src={mentor.image_url} alt={`${mentor.name || 'Mentor'} avatar`} className="w-10 h-10 rounded-full object-cover border border-terminal-dim" />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-dashed border-terminal-dim/50 flex items-center justify-center">
                            <ImageIcon size={16} className="text-terminal-dim" />
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded border border-terminal-dim/50 bg-terminal-dim/10 hover:bg-terminal-dim/20 cursor-pointer text-xs text-terminal-text transition-colors">
                          {mentorImageUploading[index] ? (
                            <span className="animate-pulse">Uploading...</span>
                          ) : (
                            <>
                              <Upload size={14} />
                              <span>{mentor.image_url ? 'Change' : 'Upload'}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={mentorImageUploading[index]}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleMentorImageUpload(index, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {mentor.image_url && (
                          <button type="button" onClick={() => {
                            const newMentors = [...submitFormData.mentors];
                            newMentors[index] = { ...newMentors[index], image_url: '' };
                            setSubmitFormData({ ...submitFormData, mentors: newMentors });
                          }} className="text-terminal-dim hover:text-red-400 text-xs">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Tech Stack (comma separated)</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="React, Node.js, Python" value={submitFormData.tech_stack} onChange={e => setSubmitFormData({ ...submitFormData, tech_stack: e.target.value })} />
              </div>
              
              <div className="space-y-2 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <h4 className="text-terminal-accent mb-2">Industry Mentor (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={submitFormData.industry_mentor_name} onChange={e => setSubmitFormData({ ...submitFormData, industry_mentor_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" type="email" value={submitFormData.industry_mentor_email} onChange={e => setSubmitFormData({ ...submitFormData, industry_mentor_email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">LinkedIn URL</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={submitFormData.industry_mentor_linkedin} onChange={e => setSubmitFormData({ ...submitFormData, industry_mentor_linkedin: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <Label>Current Description / Update</Label>
                <Input className="bg-transparent border-terminal-dim" value={submitFormData.current_desc} onChange={e => setSubmitFormData({ ...submitFormData, current_desc: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Recommended For</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" value={submitFormData.recommended} onChange={e => setSubmitFormData({ ...submitFormData, recommended: e.target.value })}>
                  <option value="" className="bg-[#0D1117] text-white">-- Select --</option>
                  <option value="beginner" className="bg-[#0D1117] text-white">Beginner Friendly</option>
                  <option value="all" className="bg-[#0D1117] text-white">Open to All</option>
                  <option value="all - tough" className="bg-[#0D1117] text-white">Open to All (Tough)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 gap-2">
              <Button type="button" variant="outline" className="bg-transparent border-terminal-dim hover:text-white hover:bg-terminal-dim/20" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-terminal-accent text-black hover:bg-terminal-accent/80">Submit Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
