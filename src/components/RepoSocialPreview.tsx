import React, { useMemo, useState } from 'react'

type Props = {
  repoUrl: string
  fallback?: string
  className?: string
}

const RepoSocialPreview: React.FC<Props> = ({ repoUrl, fallback = '/devlup-black-white.png', className = '' }) => {
  const [imgError, setImgError] = useState(false)

  const { owner, repo, repoPath, thumbnailUrl } = useMemo(() => {
    let owner = ''
    let repo = ''
    try {
      const u = new URL(repoUrl.startsWith('http') ? repoUrl : `https://${repoUrl}`)
      const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean)
      if (parts.length >= 2) {
        owner = parts[0]
        repo = parts[1]
      }
    } catch (e) {
      // ignore
    }

    const repoPath = owner && repo ? `https://github.com/${owner}/${repo}` : ''
    const thumbnailUrl = repoPath ? `https://v1.opengraph.11ty.dev/${encodeURIComponent(repoPath)}/small/` : ''
    return { owner, repo, repoPath, thumbnailUrl }
  }, [repoUrl])

  // If not a repo path, render a centered fallback image with a message
  if (!owner || !repo) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full h-40 sm:h-48 md:h-64 bg-terminal-dim/10 flex items-center justify-center rounded overflow-hidden">
          <img src={fallback} alt="Preview unavailable" className="max-h-32 object-contain" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full rounded overflow-hidden ${className}`}>
      <div className="w-full h-40 sm:h-48 md:h-64 bg-terminal-dim/10 flex items-center justify-center overflow-hidden">
        <img
          src={imgError || !thumbnailUrl ? fallback : thumbnailUrl}
          alt={`Social preview for ${owner}/${repo}`}
          className="w-full h-full object-cover object-center"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Repo name overlay - visible on all sizes */}
      <div className="absolute left-3 bottom-3 bg-black/60 text-white px-2 py-1 rounded text-sm pointer-events-none max-w-[90%]">
        <div className="font-semibold truncate">{owner}/{repo}</div>
      </div>
    </div>
  )
}

export default RepoSocialPreview
