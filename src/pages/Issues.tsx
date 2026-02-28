import React from 'react';
import { Terminal } from 'lucide-react';
import ProjectIssuesPanel from '../components/ProjectIssuesPanel';

const Issues = () => {
    return (
        <div className="min-h-screen bg-terminal-dark text-terminal-text py-12 px-4 sm:px-6 lg:px-8 mt-16 relative z-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-terminal-dim pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold text-terminal-accent mb-2 flex items-center gap-3">
                            <Terminal className="h-8 w-8 md:h-12 md:w-12" />
                            Project Issues
                        </h1>
                        <p className="text-terminal-dim text-lg">
                            Track and contribute to open issues
                        </p>
                    </div>
                </div>

                <div className="bg-terminal border border-terminal-dim rounded-lg p-6">
                    <ProjectIssuesPanel repoUrl="rishiy1308-hue/rishiyadaviitj.github.io" />
                </div>
            </div>
        </div>
    );
};

export default Issues;
