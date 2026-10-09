// The first-launch setup, in order. Optional steps can be left for later (Settings has them all).
export type StepKey = 'welcome' | 'theme' | 'folder' | 'python' | 'git' | 'ai' | 'tips' | 'done';

export const STEPS: { key: StepKey; title: string; body?: string; optional?: boolean }[] = [
  {
    key: 'welcome',
    title: 'Welcome to TARKA',
    body: 'A code editor for your phone: write code, run it, use git, and get help from an AI. Setup takes about a minute.',
  },
  { key: 'theme', title: 'How should TARKA look?' },
  {
    key: 'folder',
    title: 'Where should your projects live?',
    body: 'You can change this later in Settings.',
  },
  {
    key: 'python',
    title: 'Installing Python',
    body: "Python runs right on your phone. It's downloaded once (about 10 MB), then it works offline.",
  },
  {
    key: 'git',
    title: 'Your name for git',
    body: 'Commits are signed with your name and email. A token lets you push to GitHub, GitLab or Bitbucket.',
    optional: true,
  },
  {
    key: 'ai',
    title: 'AI agent',
    body: "Bring your own key: Claude, Gemini or any OpenAI-compatible server. Keys stay in the phone's secure storage.",
    optional: true,
  },
  { key: 'tips', title: 'A few phone tricks' },
  {
    key: 'done',
    title: "You're set",
    body: 'Create a project from a template, or clone a repository.',
  },
];
