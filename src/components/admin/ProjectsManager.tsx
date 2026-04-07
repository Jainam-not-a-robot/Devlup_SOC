import React, { useState, useEffect } from 'react';
import { fetchProjects, createProject, updateProject, deleteProject } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Trash2, Edit, Plus } from 'lucide-react';

const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Filter State
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Form State
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    project_title: '',
    project_description: '',
    status: 'ongoing',
    type: 'woc',
    year: new Date().getFullYear(),
    preview_link: '',
    github_repo_link: '',
    docs: '',
    has_issues: false,
    mentors: ''
  });

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterYear) params.year = parseInt(filterYear);
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      
      const data = await fetchProjects(params);
      const mappedData = data.map((p: any) => ({ ...p, id: p.id || p._id }));
      setProjects(mappedData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [filterYear, filterStatus, filterType]);

  const handleOpenDialog = (project?: any) => {
    if (project) {
      setCurrentProject(project);
      setFormData({
        project_title: project.project_title || '',
        project_description: project.project_description || '',
        status: project.status || 'ongoing',
        type: project.type || 'woc',
        year: project.year || new Date().getFullYear(),
        preview_link: project.preview_link || '',
        github_repo_link: project.github_repo_link || '',
        docs: project.docs || '',
        has_issues: project.has_issues || false,
        mentors: Array.isArray(project.mentors) ? project.mentors.map((m: any) => typeof m === 'object' && m !== null ? m.name : m).join(', ') : (project.mentors || '')
      });
    } else {
      setCurrentProject(null);
      setFormData({
        project_title: '', project_description: '', status: 'ongoing', type: 'woc', 
        year: new Date().getFullYear(), preview_link: '', github_repo_link: '', docs: '', has_issues: false, mentors: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        mentors: formData.mentors.split(',').map(m => m.trim()).filter(Boolean).map(name => ({ name }))
      };

      if (currentProject) {
        await updateProject(currentProject.id, payload);
        toast({ title: "Success", description: "Project updated." });
      } else {
        await createProject(payload);
        toast({ title: "Success", description: "Project created." });
      }
      setIsDialogOpen(false);
      loadProjects();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save project", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
        toast({ title: "Success", description: "Project deleted." });
        loadProjects();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-terminal-accent">Projects</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-terminal-accent text-black hover:bg-terminal-accent/80 flex items-center gap-2">
          <Plus size={16} /> Add Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Year</Label>
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value)}
            className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent"
          >
            <option value="" className="bg-[#0D1117] text-white">All Years</option>
            <option value="2024" className="bg-[#0D1117] text-white">2024</option>
            <option value="2025" className="bg-[#0D1117] text-white">2025</option>
            <option value="2026" className="bg-[#0D1117] text-white">2026</option>
          </select>
        </div>
        
        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Status</Label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent"
          >
            <option value="" className="bg-[#0D1117] text-white">All Statuses</option>
            <option value="ongoing" className="bg-[#0D1117] text-white">Ongoing</option>
            <option value="completed" className="bg-[#0D1117] text-white">Completed</option>
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Type</Label>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent"
          >
            <option value="" className="bg-[#0D1117] text-white">All Types</option>
            <option value="soc" className="bg-[#0D1117] text-white">SOC</option>
            <option value="woc" className="bg-[#0D1117] text-white">WOC</option>
          </select>
        </div>
      </div>

      <div className="terminal-window border border-terminal-dim p-4">
        {isLoading ? (
          <p className="text-terminal-dim text-center py-4">Loading projects...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-terminal-dim">
                <TableHead className="text-terminal-text">Title</TableHead>
                <TableHead className="text-terminal-text">Description</TableHead>
                <TableHead className="text-terminal-text">Type</TableHead>
                <TableHead className="text-terminal-text">Status</TableHead>
                <TableHead className="text-terminal-text">Year</TableHead>
                <TableHead className="text-terminal-text">Mentors</TableHead>
                <TableHead className="text-terminal-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center text-terminal-dim py-4">No projects found.</TableCell>
                 </TableRow>
              )}
              {projects.map((p) => (
                <TableRow key={p.id} className="border-terminal-dim hover:bg-terminal-dim/20">
                  <TableCell className="font-medium text-white">{p.project_title}</TableCell>
                  <TableCell className="text-terminal-text max-w-[250px] align-top">
                    <div className={expandedDesc[p.id] ? '' : 'line-clamp-2'}>
                      {p.project_description}
                    </div>
                    {p.project_description && p.project_description.length > 60 && (
                      <button 
                        onClick={() => setExpandedDesc(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className="text-terminal-accent text-xs mt-1 hover:underline focus:outline-none"
                      >
                        {expandedDesc[p.id] ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-terminal-text uppercase">{p.type}</TableCell>
                  <TableCell className="text-terminal-text capitalize">{p.status}</TableCell>
                  <TableCell className="text-terminal-text">{p.year}</TableCell>
                  <TableCell className="text-terminal-text">{p.mentors?.map((m: any) => typeof m === 'object' && m !== null ? m.name : m).join(', ') || 'None'}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="terminal-window border-terminal-accent text-terminal-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-terminal-accent text-xl">
              {currentProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2 col-span-2">
                 <Label>Project Title</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.project_title} onChange={e => setFormData({...formData, project_title: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Type</Label>
                 <Input className="bg-transparent border-terminal-dim" placeholder="woc/winter" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Status</Label>
                 <Input className="bg-transparent border-terminal-dim" placeholder="ongoing/completed" required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Year</Label>
                 <Input type="number" className="bg-transparent border-terminal-dim" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
               </div>
               <div className="space-y-2">
                 <Label>Preview Link</Label>
                 <Input className="bg-transparent border-terminal-dim" value={formData.preview_link} onChange={e => setFormData({...formData, preview_link: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>GitHub Repo Link</Label>
                 <Input className="bg-transparent border-terminal-dim" value={formData.github_repo_link} onChange={e => setFormData({...formData, github_repo_link: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Docs Link</Label>
                 <Input className="bg-transparent border-terminal-dim" value={formData.docs} onChange={e => setFormData({...formData, docs: e.target.value})} />
               </div>
               <div className="space-y-2 col-span-2">
                 <Label>Mentors (comma separated)</Label>
                 <Input className="bg-transparent border-terminal-dim" placeholder="Mentor 1, Mentor 2" value={formData.mentors} onChange={e => setFormData({...formData, mentors: e.target.value})} />
               </div>
            </div>
            <div className="space-y-2 col-span-2">
                 <Label>Description</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.project_description} onChange={e => setFormData({...formData, project_description: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4 gap-2">
               <Button type="button" variant="outline" className="bg-transparent border-terminal-dim hover:text-white hover:bg-terminal-dim/20" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button type="submit" className="bg-terminal-accent text-black hover:bg-terminal-accent/80">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManager;
