import { Star } from "lucide-react"

import {
  GitHubStarsButton,
  GitHubStarsButtonIcon,
  GitHubStarsButtonLogo,
  GitHubStarsButtonNumber,
  GitHubStarsButtonParticles
} from "@/components/animate-ui/buttons/github-stars"

export default function GithubStars({ repoUrl }: { repoUrl: string }) {
  return (
    <div>
      <GitHubStarsButton
        username="Dallas-Ng"
        repo="ntu-mods"
        className="dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        asChild>
        <a
          href={repoUrl}
          aria-label="View NTUMods on GitHub and give it a star">
          <GitHubStarsButtonLogo />
          <span>Star on GitHub</span>
          <GitHubStarsButtonNumber />
          <GitHubStarsButtonParticles>
            <GitHubStarsButtonIcon icon={Star} />
          </GitHubStarsButtonParticles>
        </a>
      </GitHubStarsButton>
    </div>
  )
}
