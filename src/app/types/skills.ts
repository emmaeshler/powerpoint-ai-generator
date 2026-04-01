export interface Skill {
  id: string;
  label: string;
  description: string;
  file: string;              // e.g., 'claude-system-prompt.md'
  bundleId?: string;         // Primary bundle owner
  isPublic?: boolean;        // From GitHub repo
  repoUrl?: string;          // Source repo URL
}

export interface SkillBundle {
  id: string;
  name: string;              // "Emma's Bundle"
  owner: string;             // "Emma"
  description?: string;
  skills: string[];          // Array of skill IDs
  isDefault?: boolean;       // User's default bundle
  repoUrl?: string;          // Optional GitHub repo link
  color?: string;            // Visual distinction color
}

export interface SkillsConfig {
  bundles: SkillBundle[];
  skills: Skill[];
}

// GitHub manifest format
export interface SkillManifest {
  version: string;
  bundle: {
    name: string;
    description: string;
    owner: string;
  };
  skills: Array<{
    id: string;
    label: string;
    description: string;
    file: string;            // Relative path in repo
  }>;
}

// localStorage persistence
export interface SkillsSelection {
  selectedSkills: string[];
  lastModified: number;
  defaultBundle?: string;    // User's preferred default
}
