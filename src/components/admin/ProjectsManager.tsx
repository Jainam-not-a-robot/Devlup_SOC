import React, { useState, useEffect } from 'react';
import { fetchProjects, createProject, updateProject, deleteProject } from '../../services/apiClient';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Trash2, Edit, Plus, X, Upload, ImageIcon } from 'lucide-react';

type MentorInput = { name: string; role: string; email: string; linkedin: string; github: string; image_url: string };

const emptyMentor = (): MentorInput => ({ name: '', role: 'Project Mentor', email: '', linkedin: '', github: '', image_url: '' });

const defaultForm = () => ({
  project_title: '',
  project_description: '',
  status: 'ongoing',
  type: 'woc',
  year: new Date().getFullYear(),
  preview_link: '',
  github_repo_link: '',
  docs: '',
  is_docs_accessible: false,
  has_issues: false,
  mentors: [emptyMentor()] as MentorInput[],
  tech_stack: '',
  industry_mentor_name: '',
  industry_mentor_email: '',
  industry_mentor_linkedin: '',
  category: '',
  current_desc: '',
  live_links: '',
  recommended: '',
  approval_status: 'accepted',
});

const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [mentorImageUploading, setMentorImageUploading] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // Filter State
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('');

  // Form State
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [formData, setFormData] = useState(defaultForm());

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterYear) params.year = parseInt(filterYear);
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (filterApprovalStatus) params.approval_status = filterApprovalStatus;

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
  }, [filterYear, filterStatus, filterType, filterApprovalStatus]);

  const handleOpenDialog = (project?: any) => {
    if (project) {
      setCurrentProject(project);
      const mentors: MentorInput[] = Array.isArray(project.mentors) && project.mentors.length > 0
        ? project.mentors.map((m: any) => ({
            name: (typeof m === 'object' ? m.name : m) || '',
            role: m?.role || 'Project Mentor',
            email: m?.email || '',
            linkedin: m?.linkedin || '',
            github: m?.github || '',
            image_url: m?.image_url || '',
          }))
        : [emptyMentor()];
      const im = project.industry_mentor || {};
      setFormData({
        project_title: project.project_title || '',
        project_description: project.project_description || '',
        status: project.status || 'ongoing',
        type: project.type || 'woc',
        year: project.year || new Date().getFullYear(),
        preview_link: project.preview_link || '',
        github_repo_link: project.github_repo_link || '',
        docs: project.docs || '',
        is_docs_accessible: project.is_docs_accessible || false,
        has_issues: project.has_issues || false,
        mentors,
        tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : (project.tech_stack || ''),
        industry_mentor_name: im.name || '',
        industry_mentor_email: im.email || '',
        industry_mentor_linkedin: im.linkedin || '',
        category: project.category || '',
        current_desc: project.current_desc || '',
        live_links: Array.isArray(project.live_links) ? project.live_links.join(', ') : (project.live_links || ''),
        recommended: project.recommended || '',
        approval_status: project.approval_status || 'accepted',
      });
    } else {
      setCurrentProject(null);
      setFormData(defaultForm());
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        mentors: formData.mentors.filter(m => m.name.trim() !== ''),
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : [],
        live_links: formData.live_links ? formData.live_links.split(',').map(s => s.trim()).filter(Boolean) : [],
        industry_mentor: formData.industry_mentor_name ? {
          name: formData.industry_mentor_name,
          email: formData.industry_mentor_email || undefined,
          linkedin: formData.industry_mentor_linkedin || undefined,
        } : undefined,
      };
      // Remove flattened industry mentor fields from payload
      delete payload.industry_mentor_name;
      delete payload.industry_mentor_email;
      delete payload.industry_mentor_linkedin;

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

  const handleUpdateApprovalStatus = async (id: string, newStatus: string) => {
    try {
      await updateProject(id, { approval_status: newStatus });
      toast({ title: "Success", description: `Project marked as ${newStatus}.` });
      loadProjects();
    } catch (err) {
      toast({ title: "Error", description: `Failed to mark project as ${newStatus}`, variant: "destructive" });
    }
  };

  const updateMentor = (index: number, field: keyof MentorInput, value: string) => {
    const updated = [...formData.mentors];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, mentors: updated });
  };

  const handleAdminMentorImageUpload = async (index: number, file: File) => {
    setMentorImageUploading(prev => ({ ...prev, [index]: true }));
    try {
      const result = await uploadToCloudinary(file, 'mentor_images');
      updateMentor(index, 'image_url', result.secure_url);
      toast({ title: 'Image uploaded', description: 'Mentor image uploaded successfully.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: 'Failed to upload image. Please try again.', variant: 'destructive' });
    } finally {
      setMentorImageUploading(prev => ({ ...prev, [index]: false }));
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
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent">
            <option value="" className="bg-[#0D1117] text-white">All Years</option>
            <option value="2024" className="bg-[#0D1117] text-white">2024</option>
            <option value="2025" className="bg-[#0D1117] text-white">2025</option>
            <option value="2026" className="bg-[#0D1117] text-white">2026</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Status</Label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent">
            <option value="" className="bg-[#0D1117] text-white">All Status</option>
            <option value="ongoing" className="bg-[#0D1117] text-white">Ongoing</option>
            <option value="completed" className="bg-[#0D1117] text-white">Completed</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Type</Label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent">
            <option value="" className="bg-[#0D1117] text-white">All Types</option>
            <option value="soc" className="bg-[#0D1117] text-white">SOC</option>
            <option value="woc" className="bg-[#0D1117] text-white">WOC</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-terminal-dim">Approval</Label>
          <select value={filterApprovalStatus} onChange={e => setFilterApprovalStatus(e.target.value)} className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent">
            <option value="" className="bg-[#0D1117] text-white">All</option>
            <option value="pending" className="bg-[#0D1117] text-white">Pending</option>
            <option value="accepted" className="bg-[#0D1117] text-white">Accepted</option>
            <option value="rejected" className="bg-[#0D1117] text-white">Rejected</option>
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
                <TableHead className="text-terminal-text">Approval</TableHead>
                <TableHead className="text-terminal-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-terminal-dim py-4">No projects found.</TableCell>
                </TableRow>
              )}
              {projects.map((p) => (
                <TableRow key={p.id} className="border-terminal-dim hover:bg-terminal-dim/20">
                  <TableCell className="font-medium text-white">{p.project_title}</TableCell>
                  <TableCell className="text-terminal-text max-w-[250px] align-top">
                    <div className={expandedDesc[p.id] ? '' : 'line-clamp-2'}>{p.project_description}</div>
                    {p.project_description && p.project_description.length > 60 && (
                      <button onClick={() => setExpandedDesc(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="text-terminal-accent text-xs mt-1 hover:underline focus:outline-none">
                        {expandedDesc[p.id] ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-terminal-text uppercase">{p.type}</TableCell>
                  <TableCell className="text-terminal-text capitalize">{p.status}</TableCell>
                  <TableCell className="text-terminal-text">{p.year}</TableCell>
                  <TableCell className="text-terminal-text">{p.mentors?.map((m: any) => typeof m === 'object' && m !== null ? m.name : m).join(', ') || 'None'}</TableCell>
                  <TableCell>
                    <div className={`text-xs font-bold uppercase tracking-wider ${p.approval_status === 'accepted' ? 'text-green-400' : p.approval_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {p.approval_status || 'accepted'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right flex flex-wrap justify-end gap-1">
                    {p.approval_status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateApprovalStatus(p.id, 'accepted')} className="text-green-400 hover:text-green-300 hover:bg-green-400/10 h-8 w-8 p-0" title="Accept">✅</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateApprovalStatus(p.id, 'rejected')} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0" title="Reject">❌</Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 px-2"><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2"><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ───── Add / Edit Dialog ───── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="terminal-window border-terminal-accent text-terminal-text max-w-3xl bg-[#0D1117] max-h-[90vh] overflow-y-auto modal-scroll">
          <DialogHeader>
            <DialogTitle className="text-terminal-accent text-xl">
              {currentProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Project Title *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={formData.project_title} onChange={e => setFormData({ ...formData, project_title: e.target.value })} />
              </div>
              {/* Description */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Description *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={formData.project_description} onChange={e => setFormData({ ...formData, project_description: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="woc" className="bg-[#0D1117] text-white">WOC</option>
                  <option value="soc" className="bg-[#0D1117] text-white">SOC</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ongoing" className="bg-[#0D1117] text-white">Ongoing</option>
                  <option value="completed" className="bg-[#0D1117] text-white">Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" className="bg-transparent border-terminal-dim" required value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="e.g. Web Development" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>GitHub Repo Link</Label>
                <Input className="bg-transparent border-terminal-dim" value={formData.github_repo_link} onChange={e => setFormData({ ...formData, github_repo_link: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Docs Link *</Label>
                <Input className="bg-transparent border-terminal-dim" required value={formData.docs} onChange={e => setFormData({ ...formData, docs: e.target.value })} />
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="admin_docs_accessible" className="accent-terminal-accent" checked={formData.is_docs_accessible} onChange={e => setFormData({ ...formData, is_docs_accessible: e.target.checked })} />
                  <Label htmlFor="admin_docs_accessible" className="text-sm text-terminal-dim cursor-pointer">Are the docs accessible to all?</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview Link</Label>
                <Input className="bg-transparent border-terminal-dim" value={formData.preview_link} onChange={e => setFormData({ ...formData, preview_link: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Live Links (comma separated)</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="https://..., https://..." value={formData.live_links} onChange={e => setFormData({ ...formData, live_links: e.target.value })} />
              </div>

              {/* ── Project Mentors ── */}
              <div className="space-y-4 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-terminal-accent">Project Mentors</h4>
                  <Button type="button" variant="outline" size="sm" className="bg-transparent border-terminal-dim hover:text-white" onClick={() => setFormData({ ...formData, mentors: [...formData.mentors, emptyMentor()] })}>
                    <Plus size={14} className="mr-1" /> Add Mentor
                  </Button>
                </div>
                {formData.mentors.map((mentor, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 border border-terminal-dim/50 rounded bg-terminal-dim/5 relative">
                    {formData.mentors.length > 1 && (
                      <button type="button" onClick={() => setFormData({ ...formData, mentors: formData.mentors.filter((_, i) => i !== index) })} className="absolute top-2 right-2 text-terminal-dim hover:text-red-400">
                        <X size={16} />
                      </button>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs">Name *</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" required value={mentor.name} onChange={e => updateMentor(index, 'name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Role</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.role} onChange={e => updateMentor(index, 'role', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Email</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" type="email" value={mentor.email} onChange={e => updateMentor(index, 'email', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">LinkedIn URL</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.linkedin} onChange={e => updateMentor(index, 'linkedin', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label className="text-xs">GitHub URL</Label>
                      <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={mentor.github} onChange={e => updateMentor(index, 'github', e.target.value)} />
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
                              if (file) handleAdminMentorImageUpload(index, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {mentor.image_url && (
                          <button type="button" onClick={() => updateMentor(index, 'image_url', '')} className="text-terminal-dim hover:text-red-400 text-xs">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Tech Stack (comma separated)</Label>
                <Input className="bg-transparent border-terminal-dim" placeholder="React, Node.js, Python" value={formData.tech_stack} onChange={e => setFormData({ ...formData, tech_stack: e.target.value })} />
              </div>

              {/* ── Industry Mentor ── */}
              <div className="space-y-2 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <h4 className="text-terminal-accent mb-2">Industry Mentor (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={formData.industry_mentor_name} onChange={e => setFormData({ ...formData, industry_mentor_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" type="email" value={formData.industry_mentor_email} onChange={e => setFormData({ ...formData, industry_mentor_email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">LinkedIn URL</Label>
                    <Input className="bg-transparent border-terminal-dim h-8 text-sm" value={formData.industry_mentor_linkedin} onChange={e => setFormData({ ...formData, industry_mentor_linkedin: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Current Desc & Recommended */}
              <div className="space-y-2 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                <Label>Current Description / Update</Label>
                <Input className="bg-transparent border-terminal-dim" value={formData.current_desc} onChange={e => setFormData({ ...formData, current_desc: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Recommended For</Label>
                <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" value={formData.recommended} onChange={e => setFormData({ ...formData, recommended: e.target.value })}>
                  <option value="" className="bg-[#0D1117] text-white">-- Select --</option>
                  <option value="beginner" className="bg-[#0D1117] text-white">Beginner Friendly</option>
                  <option value="all" className="bg-[#0D1117] text-white">Open to All</option>
                  <option value="all - tough" className="bg-[#0D1117] text-white">Open to All (Tough)</option>
                </select>
              </div>

              {/* Approval Status - only show when editing */}
              {currentProject && (
                <div className="space-y-2 col-span-1 sm:col-span-2 pt-4 border-t border-terminal-dim/30">
                  <Label>Approval Status</Label>
                  <select className="w-full bg-transparent border border-terminal-dim rounded-md h-10 px-3 text-terminal-text focus:outline-none focus:border-terminal-accent" value={formData.approval_status} onChange={e => setFormData({ ...formData, approval_status: e.target.value })}>
                    <option value="accepted" className="bg-[#0D1117] text-white">Accepted</option>
                    <option value="pending" className="bg-[#0D1117] text-white">Pending</option>
                    <option value="rejected" className="bg-[#0D1117] text-white">Rejected</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 gap-2">
              <Button type="button" variant="outline" className="bg-transparent border-terminal-dim hover:text-white hover:bg-terminal-dim/20" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-terminal-accent text-black hover:bg-terminal-accent/80">
                {currentProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManager;
