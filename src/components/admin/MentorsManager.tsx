import React, { useState, useEffect } from 'react';
import { fetchMentors, createMentor, updateMentor, deleteMentor } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Trash2, Edit, Plus } from 'lucide-react';

const MentorsManager: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Form State
  const [currentMentor, setCurrentMentor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    github: '',
    email: '',
    description: '',
    linkedin: '',
    image: '',
    role: 'Mentor',
    year: new Date().getFullYear()
  });

  const loadMentors = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMentors();
      setMentors(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load mentors", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const handleOpenDialog = (mentor?: any) => {
    if (mentor) {
      setCurrentMentor(mentor);
      setFormData({
        name: mentor.name || '',
        github: mentor.github || '',
        email: mentor.email || '',
        description: mentor.description || '',
        linkedin: mentor.linkedin || '',
        image: mentor.image || '',
        role: mentor.role || 'Mentor',
        year: mentor.year || new Date().getFullYear()
      });
    } else {
      setCurrentMentor(null);
      setFormData({
        name: '', github: '', email: '', description: '', linkedin: '', image: '', role: 'Mentor', year: new Date().getFullYear()
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMentor) {
        await updateMentor(currentMentor.id, formData);
        toast({ title: "Success", description: "Mentor updated." });
      } else {
        await createMentor(formData);
        toast({ title: "Success", description: "Mentor created." });
      }
      setIsDialogOpen(false);
      loadMentors();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save mentor", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this mentor?")) {
      try {
        await deleteMentor(id);
        toast({ title: "Success", description: "Mentor deleted." });
        loadMentors();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete mentor", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-terminal-accent">Mentors</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-terminal-accent text-black hover:bg-terminal-accent/80 flex items-center gap-2">
          <Plus size={16} /> Add Mentor
        </Button>
      </div>

      <div className="terminal-window border border-terminal-dim p-4">
        {isLoading ? (
          <p className="text-terminal-dim text-center py-4">Loading mentors...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-terminal-dim">
                <TableHead className="text-terminal-text">Name</TableHead>
                <TableHead className="text-terminal-text">GitHub</TableHead>
                <TableHead className="text-terminal-text">Role</TableHead>
                <TableHead className="text-terminal-text">Year</TableHead>
                <TableHead className="text-terminal-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center text-terminal-dim py-4">No mentors found.</TableCell>
                 </TableRow>
              )}
              {mentors.map((m) => (
                <TableRow key={m.id} className="border-terminal-dim hover:bg-terminal-dim/20">
                  <TableCell className="font-medium text-white">
                    <div>{m.name}</div>
                    <div className="text-xs text-terminal-dim">{m.email}</div>
                  </TableCell>
                  <TableCell className="text-terminal-text">@{m.github}</TableCell>
                  <TableCell className="text-terminal-text">{m.role}</TableCell>
                  <TableCell className="text-terminal-text">{m.year}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(m)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
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
              {currentMentor ? "Edit Mentor" : "New Mentor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Name</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Email</Label>
                 <Input type="email" className="bg-transparent border-terminal-dim" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>GitHub Username</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>LinkedIn URL</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} />
               </div>
               <div className="space-y-2 col-span-2">
                 <Label>Image URL</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Role</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Year</Label>
                 <Input type="number" className="bg-transparent border-terminal-dim" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
               </div>
            </div>
            <div className="space-y-2 col-span-2">
                 <Label>Description</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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

export default MentorsManager;
