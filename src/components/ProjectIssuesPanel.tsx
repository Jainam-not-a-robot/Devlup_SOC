import { useState } from 'react';
import { useGithubIssues } from '../hooks/useGithubIssues';

const ProjectIssuesPanel = ({ repoUrl }: { repoUrl: string }) => {
  const { issues, repoStats, loading } = useGithubIssues(repoUrl);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  if (loading) {
    return <div className="text-terminal-dim">Loading issues…</div>;
  }

  if (!repoStats) {
    return <div className="text-terminal-dim">No repo data found.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Repo Info Header */}
      <div className="mb-6 p-4 border border-terminal-dim bg-terminal-dim/10 rounded-lg">
        <a
          href={repoStats.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl sm:text-2xl font-bold text-terminal-accent hover:underline flex items-center gap-2 mb-2"
        >
          {repoStats.name || "Repository"}
        </a>
        {repoStats.description && (
          <p className="text-sm sm:text-base text-terminal-dim">
            {repoStats.description}
          </p>
        )}
      </div>

      {/* Repo stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border p-3 rounded border-terminal-dim">
          <div className="text-xs text-terminal-dim">Open Issues</div>
          <div className="text-xl font-bold text-red-400">
            {repoStats.openIssues}
          </div>
        </div>
        <div className="border p-3 rounded border-terminal-dim">
          <div className="text-xs text-terminal-dim">Stars</div>
          <div className="text-xl font-bold text-yellow-500">
            {repoStats.stars}
          </div>
        </div>
        <div className="border p-3 rounded border-terminal-dim">
          <div className="text-xs text-terminal-dim">Forks</div>
          <div className="text-xl font-bold text-blue-400">
            {repoStats.forks}
          </div>
        </div>
        <div className="border p-3 rounded border-terminal-dim">
          <div className="text-xs text-terminal-dim">Last Updated</div>
          <div className="text-sm font-semibold text-terminal-text mt-1">
            {new Date(repoStats.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Issue list */}
      {issues.length === 0 ? (
        <div className="text-terminal-dim">No open issues 🎉</div>
      ) : (
        <div className="space-y-4">
          {issues.map(issue => {
            const isExpanded = expandedIssue === issue.id;

            return (
              <div
                key={issue.id}
                className="border border-terminal-dim rounded bg-terminal-dim/5 overflow-hidden transition-all duration-300 hover:border-terminal-text"
              >
                <div
                  className="p-3 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-terminal-accent mb-1 pr-4">
                      #{issue.number} {issue.title}
                    </div>
                    <div className="text-xs text-terminal-dim flex items-center gap-4">
                      <span>{issue.comments} comments</span>
                      <span>By {issue.user?.login}</span>
                    </div>
                  </div>
                  <div className="text-terminal-dim">
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Inline Description Body */}
                {isExpanded && (
                  <div className="p-4 border-t border-terminal-dim bg-terminal-dark/50">
                    <div className="text-sm text-terminal-text mb-4 whitespace-pre-wrap break-words">
                      {issue.body ? issue.body : <span className="italic text-terminal-dim">No description provided.</span>}
                    </div>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 inline-flex"
                    >
                      View on GitHub <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectIssuesPanel;
