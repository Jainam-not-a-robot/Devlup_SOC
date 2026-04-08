const GITHUB_API = 'https://api.github.com';

const getHeaders = () => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  // Ignore empty tokens or the default placeholder string
  if (token && token !== 'github_fine_grained_token_here') {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const getRepoInfo = async (owner: string, repo: string) => {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch repo info');
  return res.json();
};

export const getIssues = async (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') => {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?state=${state}&per_page=20`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${state} issues`);

  const data = await res.json();

  // Remove pull requests
  return data.filter((issue: any) => !issue.pull_request);
};
