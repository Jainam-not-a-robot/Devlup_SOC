import { useState } from 'react';
import { useGithubIssues } from '../hooks/useGithubIssues';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X } from 'lucide-react';

const ProjectIssuesPanel = ({ repoUrl }: { repoUrl: string }) => {
  const [issueState, setIssueState] = useState<'open' | 'closed' | 'all' | 'none'>('none');
  const { issues, repoStats, loading } = useGithubIssues(repoUrl, issueState);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [issueSearchQuery, setIssueSearchQuery] = useState('');

  const filteredIssues = issues.filter((issue) =>
    issueSearchQuery ? issue.number.toString().includes(issueSearchQuery) : true
  );

  if (loading && !repoStats) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 mb-4 gap-3">
        <h3 className="text-xl font-bold text-terminal-accent">Issues</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-2.5 top-2 text-terminal-dim" />
            <input
              type="text"
              placeholder="Search by issue #"
              value={issueSearchQuery}
              onChange={(e) => setIssueSearchQuery(e.target.value)}
              className="pl-8 pr-8 py-1.5 w-full text-sm text-terminal-text bg-terminal-dark border border-terminal-dim rounded focus:outline-none focus:border-terminal-accent placeholder:text-terminal-dim"
            />
            {issueSearchQuery && (
              <button
                className="absolute right-2.5 top-2 text-terminal-dim hover:text-terminal-text"
                onClick={() => setIssueSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Select value={issueState} onValueChange={(v: 'open' | 'closed' | 'all' | 'none') => setIssueState(v)}>
            <SelectTrigger className="w-[110px] bg-terminal-dark border-terminal-dim h-8 text-sm shrink-0">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-terminal-dim">Loading issues...</div>
      ) : issueState === 'none' ? (
        null
      ) : filteredIssues.length === 0 ? (
        <div className="text-terminal-dim">
          {issueSearchQuery ? 'No matching issues found.' : `No ${issueState === 'all' ? 'issues found' : `${issueState} issues`} ${issueState === 'open' ? '🎉' : ''}`}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue: any) => {
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
