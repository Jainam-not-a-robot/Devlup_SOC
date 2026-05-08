import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ProjectsManager from '../components/admin/ProjectsManager';
import ApplicationsManager from '../components/admin/ApplicationsManager';
import MentorsManager from '../components/admin/MentorsManager';
import TimelineManager from '../components/admin/TimelineManager';

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/home', { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16 min-h-[80vh]">
      <div className="flex justify-between items-center mb-8 border-b border-terminal-accent pb-4">
        <h1 className="text-3xl font-bold text-terminal-accent flex items-center gap-3">
           <span className="text-4xl">&gt;_</span> Admin Control Panel
        </h1>
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 bg-transparent"
        >
          Logout
        </Button>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-terminal-dim/20 mb-8 border border-terminal-dim h-12">
          <TabsTrigger value="projects" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-black text-terminal-text h-full font-bold">Projects</TabsTrigger>
          <TabsTrigger value="mentors" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-black text-terminal-text h-full font-bold">Mentors</TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-black text-terminal-text h-full font-bold">Applications</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-black text-terminal-text h-full font-bold">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <ProjectsManager />
        </TabsContent>
        <TabsContent value="mentors">
          <MentorsManager />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsManager />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
