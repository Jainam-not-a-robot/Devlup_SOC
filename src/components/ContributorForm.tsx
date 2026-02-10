import React, { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

export interface ContributorData {
  name: string;
  email: string;
  profile: string;
  projectId: string;
  note: string;
  proposal?: string;
}

interface ContributorFormProps {
  projects: { id: string; name: string }[];
  onSubmit: (data: ContributorData) => Promise<void>;
  initialProjectId?: string;
}

const ContributorForm: React.FC<ContributorFormProps> = ({ projects, initialProjectId = '' }) => {
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const googleFormUrl = import.meta.env.VITE_GOOGLE_FORM_URL || '';
  
  // Get the selected project name
  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name || '';
    
  useEffect(() => {
    if (initialProjectId) {
      setSelectedProject(initialProjectId);
    }
  }, [initialProjectId]);
  
  // Handle project selection change
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      <div className="bg-terminal-dim/20 p-3 sm:p-4 rounded-md">
        <h3 className="text-sm sm:text-base md:text-lg text-terminal-accent font-medium mb-2 sm:mb-3">Application Process</h3>
        <p className="text-xs sm:text-sm md:text-base text-terminal-text mb-2 sm:mb-3">
          To apply for this project, please submit your application through our Google Form where you can:
        </p>
        <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm text-terminal-dim mb-3 sm:mb-4 space-y-1">
          <li>Provide your contact information</li>
          <li>Share your GitHub/LinkedIn profile</li>
          <li>Submit a proposal document</li>
          <li>Tell us why you're interested in this project</li>
        </ul>
      </div>
      
      <div className="flex justify-center">
        <a 
          href={googleFormUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-terminal-accent hover:bg-terminal-accent/80 text-black font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors flex items-center space-x-2 shadow-lg text-sm sm:text-base"
        >
          <span>Open Application Form</span>
          <ExternalLink size={14} className="sm:w-4 sm:h-4" />
        </a>
      </div>
      
      <p className="text-terminal-dim text-xs sm:text-sm text-center px-2">
        The form will open in a new tab. Please make sure to mention project you want to apply to in the form.
      </p>
    </div>
  );
};

export default ContributorForm;
