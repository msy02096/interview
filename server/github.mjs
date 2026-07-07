export async function commitFilesToGitHub(files, message) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || 'msy02096/interview';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('GITHUB_TOKEN is not configured');

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY must use owner/repo format');

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'interview-tracker-ingest'
  };

  const ref = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubFetch(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, { headers });

  const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: files.map((file) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: file.content
      }))
    })
  });

  const commit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [baseCommitSha]
    })
  });

  await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: commit.sha, force: false })
  });

  return { commitSha: commit.sha, branch, repository, files: files.map((file) => file.path) };
}

async function githubFetch(path, options) {
  const response = await fetch(`https://api.github.com${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${text}`);
  }
  return response.json();
}