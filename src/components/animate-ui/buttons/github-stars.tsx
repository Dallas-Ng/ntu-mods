"use client"

import * as React from "react"
import {
  Button,
  type ButtonProps
} from "@animate-ui/react/primitives/buttons/button"
import {
  GithubStars,
  GithubStarsIcon,
  GithubStarsLogo,
  GithubStarsNumber,
  GithubStarsParticles,
  type GithubStarsIconProps,
  type GithubStarsLogoProps,
  type GithubStarsNumberProps,
  type GithubStarsParticlesProps
} from "@animate-ui/react/primitives/github-stars"
import type { UseIsInViewOptions } from "@animate-ui/react/utils/use-is-in-view"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const githubStarsButtonVariants = buttonVariants

type GitHubStarsButtonProps = ButtonProps &
  UseIsInViewOptions &
  VariantProps<typeof githubStarsButtonVariants> & {
    username?: string
    repo?: string
    value?: number
    delay?: number
  }

function GitHubStarsButton({
  ref,
  username,
  repo,
  value,
  delay,
  inView,
  inViewMargin,
  inViewOnce,
  variant,
  size,
  className,
  ...props
}: GitHubStarsButtonProps) {
  return (
    <GithubStars
      asChild
      ref={ref as React.Ref<HTMLDivElement>}
      username={username}
      repo={repo}
      value={value}
      delay={delay}
      inView={inView}
      inViewMargin={inViewMargin}
      inViewOnce={inViewOnce}>
      <Button
        data-slot="github-stars-button"
        className={cn(githubStarsButtonVariants({ variant, size }), className)}
        {...props}
      />
    </GithubStars>
  )
}

const GitHubStarsButtonLogo = GithubStarsLogo
const GitHubStarsButtonNumber = GithubStarsNumber
const GitHubStarsButtonIcon = GithubStarsIcon
const GitHubStarsButtonParticles = GithubStarsParticles

type GitHubStarsButtonLogoProps = GithubStarsLogoProps
type GitHubStarsButtonNumberProps = GithubStarsNumberProps
type GitHubStarsButtonIconProps<T extends React.ElementType> =
  GithubStarsIconProps<T>
type GitHubStarsButtonParticlesProps = GithubStarsParticlesProps

export {
  GitHubStarsButton,
  GitHubStarsButtonLogo,
  GitHubStarsButtonNumber,
  GitHubStarsButtonIcon,
  GitHubStarsButtonParticles,
  githubStarsButtonVariants,
  type GitHubStarsButtonProps,
  type GitHubStarsButtonLogoProps,
  type GitHubStarsButtonNumberProps,
  type GitHubStarsButtonIconProps,
  type GitHubStarsButtonParticlesProps
}
