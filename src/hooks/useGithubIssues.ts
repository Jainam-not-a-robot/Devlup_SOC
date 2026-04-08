import { useEffect, useState } from 'react';
import { getRepoInfo, getIssues } from '../services/github';

const extractRepo = (repoUrl?: string) => {
  if (!repoUrl) return null;

  // Handle https://api.github.com/repos/owner/repo format
  if (repoUrl.includes('api.github.com/repos/')) {
    const parts = repoUrl.split('api.github.com/repos/')[1].split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  }

  // Handle github.io domain formats (e.g. https://devlup-labs.github.io/)
  if (repoUrl.includes('.github.io')) {
    const cleanUrl = repoUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    const owner = parts[0].split('.')[0]; 
    const repo = parts.length > 1 ? parts[1] : parts[0];
    return { owner, repo };
  }

  // Handle standard https://github.com/owner/repo format
  let standardUrl = repoUrl.replace('https://github.com/', '');
  // Remove any trailing periods or slashes from the end
  standardUrl = standardUrl.replace(/[./]+$/, '');
  const parts = standardUrl.split('/');
  return { owner: parts[0], repo: parts[1] };
};

export const useGithubIssues = (repoUrl?: string, state: 'open' | 'closed' | 'all' | 'none' = 'none') => {
  const [issues, setIssues] = useState<any[]>([]);
  const [repoStats, setRepoStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const repo = extractRepo(repoUrl);
    console.log("Extracted Repo Result:", repo, "from URL:", repoUrl);
    if (!repo) return;

    setLoading(true);

    Promise.all([
      getRepoInfo(repo.owner, repo.repo),
      state === 'none' ? Promise.resolve([]) : getIssues(repo.owner, repo.repo, state as any),
    ])
      .then(([repoInfo, issues]) => {
        setRepoStats({
          name: repoInfo.full_name,
          description: repoInfo.description,
          url: repoInfo.html_url,
          openIssues: issues.length,
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          updatedAt: repoInfo.updated_at,
        });
        setIssues(issues);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoUrl, state]);
  return { issues, repoStats, loading };
};
