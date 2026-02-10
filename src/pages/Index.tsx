import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TerminalHeader from '../components/TerminalHeader';
import CommandOutput from '../components/CommandOutput';
import CommandLine from '../components/CommandLine';
import ProjectCard from '../components/ProjectCard';
import { TerminalProvider, useTerminal } from '../context/TerminalContext';
import { Search, Filter, X, Terminal } from 'lucide-react';

const TerminalView: React.FC = () => {
  const { 
    commandHistory, 
    executeCommand, 
    isProcessing, 
    projects, 
    loading, 
    view, 
    setView,
    searchQuery,
    setSearchQuery,
    techFilter,
    setTechFilter
  } = useTerminal();
  
  const navigate = useNavigate();

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

  // Selected tab: one of 'Ongoing' | 'Completed' | 'Archived'
  const [selectedTab, setSelectedTab] = React.useState<'Ongoing' | 'Completed' | 'Archived'>('Ongoing');

  // Projects to display for the active tab (treat missing status as 'Completed' for backward compat)
  const projectsForTab = React.useMemo(() => {
    return filteredProjects.filter(p => {
      const s = (p.status || '').toLowerCase() || 'completed';
      if (selectedTab.toLowerCase() === 'ongoing') return s === 'ongoing';
      if (selectedTab.toLowerCase() === 'archived') return s === 'archived';
      return s === 'completed';
    });
  }, [filteredProjects, selectedTab]);

  // handleCommand now just forwards to executeCommand since CommandLine handles navigation directly
  const handleCommand = (command: string) => {
    executeCommand(command);
  };

  return (
    <div className="terminal-window max-w-4xl w-full mx-auto my-8">
      <TerminalHeader title={
        view === 'terminal' ? 'DevlUp Projects Archive Terminal' : 
        view === 'projects' ? 'Projects Dashboard' : 
        'Contributor Application Form'
      } />
      
      {/* Navigation buttons */}
  <div className="bg-terminal-dim/30 p-2 flex space-x-2">
        <button 
          className={`px-3 py-1 rounded text-sm flex items-center ${view === 'terminal' ? 'bg-terminal-accent text-black' : 'hover:bg-terminal-dim'}`}
          onClick={() => setView('terminal')}
        >
          <Terminal size={14} className="mr-1" />
          Terminal
        </button>
        <button 
          className={`px-3 py-1 rounded text-sm flex items-center ${view === 'projects' ? 'bg-terminal-accent text-black' : 'hover:bg-terminal-dim'}`}
          onClick={() => setView('projects')}
        >
          <Filter size={14} className="mr-1" />
          Projects
        </button>
        {/* Apply is disabled while applications are closed
        <Link 
          to="/apply" 
          className={`px-3 py-1 rounded text-sm flex items-center hover:bg-terminal-dim`}
        >
          <Terminal size={14} className="mr-1" />
          Apply
        </Link>
        */}
      </div>
      
      <div className="terminal-body min-h-[500px] max-h-[70vh] overflow-y-auto">
        {view === 'terminal' && (
          <>
            <CommandOutput output={commandHistory} />
            <CommandLine onCommand={handleCommand} isProcessing={isProcessing} />
          </>
        )}
        
        {view === 'projects' && (
          <div className="space-y-4">
            {/* Page heading and tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-terminal-text">
                  {selectedTab === 'Ongoing' ? 'Live Projects' : selectedTab === 'Completed' ? 'Completed Projects' : 'Archived Projects'}
                </h2>
                <p className="text-terminal-dim">Browse projects by status. Use search or technology filter to narrow results.</p>
              </div>

              <div className="flex items-center gap-2">
                {(['Ongoing','Completed','Archived'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-3 py-1 rounded text-sm ${selectedTab === tab ? (tab === 'Completed' ? 'bg-emerald-600 text-white' : tab === 'Ongoing' ? 'bg-amber-400 text-black' : 'bg-gray-600 text-white') : 'bg-terminal-dim/20'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and filter controls */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-2.5 text-terminal-dim" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full bg-terminal-dim/20 border border-terminal-dim/50 rounded focus:outline-none focus:border-terminal-accent"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-2.5 text-terminal-dim hover:text-terminal-text"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {/* Tech stack filter */}
              <div className="w-full md:w-64">
                <select
                  value={techFilter || ''}
                  onChange={(e) => setTechFilter(e.target.value || null)}
                  className="w-full px-3 py-2 bg-terminal-dim/20 border border-terminal-dim/50 rounded focus:outline-none focus:border-terminal-accent appearance-none"
                >
                  <option value="">All Technologies</option>
                  {allTechStacks.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Projects list for selected tab */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-terminal-accent">Loading projects...</p>
              </div>
            ) : (
              <div>
                <div className="mb-3 text-terminal-dim">Showing <span className="font-semibold text-terminal-text">{selectedTab}</span> projects ({projectsForTab.length})</div>

                {projectsForTab.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-terminal-dim">No {selectedTab.toLowerCase()} projects available.</p>
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
                ) : (
                  <div className="space-y-4">
                    {projectsForTab.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <TerminalProvider>
      <div className="min-h-screen bg-terminal flex flex-col items-center p-4">
        <header className="mb-8 text-center pt-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/uploads/a04b4cd1-93e6-496f-a36f-bae3a41203d5.png" 
              alt="DevlUp Labs Logo" 
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-terminal-text mb-2">DevlUp Projects Archive</h1>
          <p className="text-terminal-dim max-w-2xl">Explore all projects and programs. Connect with mentors and contribute to exciting initiatives.</p>
        </header>
        <TerminalView />
        <footer className="mt-auto py-4 text-terminal-dim text-sm text-center">
          <p>DevlUp Labs &copy; {new Date().getFullYear()} | Terminal Interface for Projects Archive</p>
        </footer>
      </div>
    </TerminalProvider>
  );
};

export default Index;
