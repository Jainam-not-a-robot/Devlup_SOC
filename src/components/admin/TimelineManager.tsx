import React, { useState, useEffect } from 'react';
import { fetchTimelines, createTimeline, updateTimeline, deleteTimeline } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Trash2, Edit, Plus } from 'lucide-react';

const TimelineManager: React.FC = () => {
  const [timelines, setTimelines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Form State
  const [currentTimeline, setCurrentTimeline] = useState<any>(null);
  const [formData, setFormData] = useState({
    timeline_topic: '',
    program_name: 'Winter of Code',
    start_date: '',
    end_date: '',
    timeline_description: ''
  });

  const loadTimelines = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTimelines();
      setTimelines(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load timelines", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimelines();
  }, []);

  const handleOpenDialog = (time_item?: any) => {
    if (time_item) {
      setCurrentTimeline(time_item);
      setFormData({
        timeline_topic: time_item.timeline_topic || '',
        program_name: time_item.program_name || 'Winter of Code',
        start_date: time_item.start_date || '',
        end_date: time_item.end_date || '',
        timeline_description: time_item.timeline_description || ''
      });
    } else {
      setCurrentTimeline(null);
      setFormData({
        timeline_topic: '', program_name: 'Winter of Code', start_date: '', end_date: '', timeline_description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTimeline) {
        await updateTimeline(currentTimeline.time_id, formData);
        toast({ title: "Success", description: "Timeline updated." });
      } else {
        await createTimeline(formData);
        toast({ title: "Success", description: "Timeline created." });
      }
      setIsDialogOpen(false);
      loadTimelines();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save timeline", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this timeline event?")) {
      try {
        await deleteTimeline(id);
        toast({ title: "Success", description: "Timeline deleted." });
        loadTimelines();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete timeline", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-terminal-accent">Timeline Events</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-terminal-accent text-black hover:bg-terminal-accent/80 flex items-center gap-2">
          <Plus size={16} /> Add Event
        </Button>
      </div>

      <div className="terminal-window border border-terminal-dim p-4">
        {isLoading ? (
          <p className="text-terminal-dim text-center py-4">Loading timeline events...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-terminal-dim">
                <TableHead className="text-terminal-text">Program</TableHead>
                <TableHead className="text-terminal-text">Topic</TableHead>
                <TableHead className="text-terminal-text">Start Date</TableHead>
                <TableHead className="text-terminal-text">End Date</TableHead>
                <TableHead className="text-terminal-text">Description</TableHead>
                <TableHead className="text-terminal-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timelines.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center text-terminal-dim py-4">No events found.</TableCell>
                 </TableRow>
              )}
              {timelines.map((t) => (
                <TableRow key={t.time_id} className="border-terminal-dim hover:bg-terminal-dim/20">
                  <TableCell className="text-terminal-dim">{t.program_name}</TableCell>
                  <TableCell className="font-medium text-white">{t.timeline_topic}</TableCell>
                  <TableCell className="text-terminal-text">{t.start_date}</TableCell>
                  <TableCell className="text-terminal-text">{t.end_date}</TableCell>
                  <TableCell className="text-terminal-text">{t.timeline_description}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(t)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.time_id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
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
              {currentTimeline ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Program Name</Label>
                   <Input className="bg-transparent border-terminal-dim" required placeholder="e.g. Winter of Code" value={formData.program_name} onChange={e => setFormData({...formData, program_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Event Topic</Label>
                   <Input className="bg-transparent border-terminal-dim" required value={formData.timeline_topic} onChange={e => setFormData({...formData, timeline_topic: e.target.value})} />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Start Date/Label</Label>
                   <Input className="bg-transparent border-terminal-dim" required placeholder="e.g. Till 20th December" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>End Date (Optional)</Label>
                   <Input className="bg-transparent border-terminal-dim" placeholder="e.g. 20th December" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Description</Label>
                 <Input className="bg-transparent border-terminal-dim" required value={formData.timeline_description} onChange={e => setFormData({...formData, timeline_description: e.target.value})} />
               </div>
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

export default TimelineManager;
