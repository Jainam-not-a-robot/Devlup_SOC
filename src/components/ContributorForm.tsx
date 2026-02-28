import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

interface ContributorFormProps {
  projects: { id: string; name: string }[];
  onSubmit: (data: any) => Promise<void>;
  initialProjectId?: string;
}

const ContributorForm: React.FC<ContributorFormProps> = ({
  projects,
  initialProjectId = '',
}) => {
  const [selectedProject, setSelectedProject] = useState(initialProjectId);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProject(initialProjectId);
    }
  }, [initialProjectId]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-terminal-dim/20 p-3 sm:p-4 rounded-md">
        <h3 className="text-terminal-accent font-medium mb-2">
          Application Process
        </h3>

        <ul className="list-disc pl-5 text-sm text-terminal-dim space-y-1">
          <li>Provide your contact information</li>
          <li>Share your GitHub / LinkedIn profile</li>
          <li>Submit a proposal document</li>
          <li>Tell us why you're interested in the project</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() =>
            navigate('/form')
          }
          className="bg-terminal-accent hover:bg-terminal-accent/80 text-black font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-md transition flex items-center gap-2 shadow-lg"
        >
            Open Application Form
          <ExternalLink size={14} />
        </button>
      </div>

      <p className="text-terminal-dim text-xs text-center">
        You will be redirected to the application page.
      </p>
    </div>
  );
};

export default ContributorForm;
