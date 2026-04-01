import { SkillsConfig } from '../types/skills';

export const SKILLS_CONFIG: SkillsConfig = {
  skills: [
    {
      id: 'design-system',
      label: 'Design System Prompt',
      description: 'Core slide design rules — layout selection, editorial rules, brand colors',
      file: 'claude-system-prompt.md',
      bundleId: 'emma-bundle',
    },
    {
      id: 'brand-guide',
      label: 'INSIGHT2PROFIT Design Guide',
      description: 'Brand philosophy, typography, slide anatomy, layout patterns',
      file: 'insight2profit-design-guide.md',
      bundleId: 'emma-bundle',
    },
    {
      id: 'reference-rules',
      label: 'Reference Slide Rules',
      description: 'Composition rules for each reference layout — when to use, anti-patterns',
      file: 'reference-rules.md',
      bundleId: 'emma-bundle',
    },
    {
      id: 'composition-engine',
      label: 'Composition Engine',
      description: 'How components are sized, spaced, and centered on the slide canvas',
      file: 'composition-engine.txt',
      bundleId: 'emma-bundle',
    },
    {
      id: 'layout-templates',
      label: 'Layout Templates',
      description: 'Grid system — single, two, three, and four region template definitions',
      file: 'layout-templates.json',
      bundleId: 'emma-bundle',
    },
    {
      id: 'figma-updates',
      label: 'Figma Component Updates',
      description: 'Slot variants, highlighted columns, stat sizing, comparison bars',
      file: 'figma-updates.md',
      bundleId: 'emma-bundle',
    },
    {
      id: 'branded-pptx-deck',
      label: 'Branded PowerPoint Deck Builder',
      description: 'Full deck orchestration — discovery, outlining, parallel slide generation, and assembly into .pptx',
      file: '~/.claude/skills/branded-pptx-deck/SKILL.md',
      bundleId: 'pfp-bundle',
      isPublic: true,
      repoUrl: 'https://github.com/PRICE-FOR-PROFIT/poc-branded-pptx-deck',
    },
  ],
  bundles: [
    {
      id: 'emma-bundle',
      name: "Emma's Bundle",
      owner: 'Emma',
      description: 'Core design system and layout rules',
      skills: ['design-system', 'brand-guide', 'reference-rules', 'composition-engine', 'layout-templates', 'figma-updates'],
      isDefault: true,
      color: '#1B6B7B',
    },
    {
      id: 'pfp-bundle',
      name: 'PRICE-FOR-PROFIT',
      owner: 'PFP Team',
      description: 'Full presentation deck creation with narrative flow',
      skills: ['branded-pptx-deck'],
      repoUrl: 'https://github.com/PRICE-FOR-PROFIT/poc-branded-pptx-deck',
      color: '#E8610A',
    },
  ],
};
