import React, { useState, useEffect } from 'react';
import { fetchApplications, deleteApplication, updateApplication } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../../hooks/use-toast';
import { Trash2, ExternalLink } from 'lucide-react';

const ApplicationsManager: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      try {
        await deleteApplication(id);
        toast({ title: "Success", description: "Application deleted." });
        loadApplications();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete application", variant: "destructive" });
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: string, projectNum: number) => {
    try {
      const payload = projectNum === 1 ? { status_1: status } : { status_2: status };
      await updateApplication(id, payload);
      toast({ title: "Success", description: `Project ${projectNum} marked as ${status}.` });
      loadApplications();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update application status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-terminal-accent">Applications</h2>
        <Button onClick={loadApplications} variant="outline" className="border-terminal-dim text-terminal-text hover:text-white hover:bg-terminal-dim/20 bg-transparent">
          Refresh
        </Button>
      </div>

      <div className="terminal-window border border-terminal-dim p-4">
        {isLoading ? (
          <p className="text-terminal-dim text-center py-4">Loading applications...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-terminal-dim">
                <TableHead className="text-terminal-text">Applicant</TableHead>
                <TableHead className="text-terminal-text">Roll No.</TableHead>
                <TableHead className="text-terminal-text">GitHub</TableHead>
                <TableHead className="text-terminal-text">Projects & Status</TableHead>
                <TableHead className="text-terminal-text">Created</TableHead>
                <TableHead className="text-terminal-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center text-terminal-dim py-4">No applications pending.</TableCell>
                 </TableRow>
              )}
              {applications.map((app) => (
                <TableRow key={app.id} className="border-terminal-dim hover:bg-terminal-dim/20">
                  <TableCell className="font-medium text-white">
                    <div>{app.mentee_name}</div>
                    <div className="text-xs text-terminal-dim">{app.mentee_email_id}</div>
                  </TableCell>
                  <TableCell className="text-terminal-text">{app.mentee_roll_number}</TableCell>
                  <TableCell className="text-terminal-text">@{app.mentee_github_id}</TableCell>
                  <TableCell className="text-terminal-text text-sm">
                    {/* Project 1 */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-terminal-dim/30">
                      <div>
                        <div className="font-semibold text-white">{app.project_name_1 || 'N/A'}</div>
                        <div className={`text-xs uppercase tracking-wider mt-1 ${app.status_1 === 'accepted' ? 'text-green-400' : app.status_1 === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {app.status_1 || 'pending'}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4 bg-[#0D1117] rounded-md p-1 border border-terminal-dim/30">
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'accepted', 1)} className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10" title="Accept for Project 1">✅</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'rejected', 1)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10" title="Reject for Project 1">❌</Button>
                      </div>
                    </div>

                    {/* Project 2 */}
                    {app.project_name_2 && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{app.project_name_2}</div>
                          <div className={`text-xs uppercase tracking-wider mt-1 ${app.status_2 === 'accepted' ? 'text-green-400' : app.status_2 === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {app.status_2 || 'pending'}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4 bg-[#0D1117] rounded-md p-1 border border-terminal-dim/30">
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'accepted', 2)} className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10" title="Accept for Project 2">✅</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'rejected', 2)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10" title="Reject for Project 2">❌</Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-terminal-dim text-sm align-top pt-5">{new Date(app.created_at || Date.now()).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2 items-start pt-4">
                    {app.mentee_proposal_url && (
                      <a href={app.mentee_proposal_url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="text-terminal-accent hover:text-terminal-accent/80 hover:bg-terminal-accent/10">
                          <ExternalLink size={16} /> <span className="ml-2 hidden sm:inline">Review File</span>
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(app.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ApplicationsManager;
