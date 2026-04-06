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
      id: 'branded-pptx-slide',
      label: "Will's Slide Builder (PFP)",
      description: 'Single slide generation with INSIGHT/PFP branding - panels, flows, tables',
      file: 'wills-slide-design.md',
      bundleId: 'wills-bundle',
    },
    {
      id: 'branded-pptx-deck',
      label: "Will's Deck Builder (PFP)",
      description: 'Full deck orchestration — discovery, outlining, parallel slide generation',
      file: '~/.claude/skills/branded-pptx-deck/SKILL.md',
      bundleId: 'wills-bundle',
      isPublic: true,
      repoUrl: 'https://github.com/PRICE-FOR-PROFIT/poc-branded-pptx-deck',
    },
    {
      id: 'narrative-slide',
      label: 'Narrative Slide Skill (Test)',
      description: 'Test skill - narrative sections structure, no templates',
      file: 'narrative-slide-skill.md',
      bundleId: 'test-bundle',
    },
    {
      id: 'clarification-questions',
      label: 'Interactive Clarifications',
      description: 'Ask follow-up questions when prompts are vague or ambiguous - works with any bundle',
      file: 'clarification-questions.md',
      bundleId: 'universal-bundle',
    },
  ],
  bundles: [
    {
      id: 'universal-bundle',
      name: 'Universal Bundle',
      owner: 'Everyone',
      description: 'Skills that work alongside any bundle',
      skills: ['clarification-questions'],
      color: '#F59E0B',
      capabilities: {
        layouts: false,
        referenceSlides: false,
        audience: true,
        components: false,
      },
    },
    {
      id: 'emma-bundle',
      name: "Emma's Bundle",
      owner: 'Emma',
      description: 'Core design system and layout rules',
      skills: ['design-system', 'brand-guide', 'reference-rules', 'composition-engine', 'layout-templates', 'figma-updates'],
      isDefault: true,
      color: '#0EA5E9',
      defaultPreview: 'pptx',
      capabilities: {
        layouts: true,           // Has layout-templates.json
        referenceSlides: true,   // Has reference-rules.md
        audience: true,          // Can tailor to audiences
        components: true,        // Has full component library
      },
    },
    {
      id: 'test-bundle',
      name: 'Test Bundle',
      owner: 'Testing',
      description: 'Test narrative slide structure - no templates',
      skills: ['narrative-slide'],
      color: '#A855F7',
      capabilities: {
        layouts: false,
        referenceSlides: false,
        audience: false,
        components: false,
      },
    },
    {
      id: 'wills-bundle',
      name: "Will's Bundle (PFP)",
      owner: 'Will / PRICE-FOR-PROFIT',
      description: 'INSIGHT/PFP branding - slide builder for single slides, deck builder for full presentations',
      skills: ['branded-pptx-slide', 'branded-pptx-deck'],
      repoUrl: 'https://github.com/PRICE-FOR-PROFIT/poc-branded-pptx-deck',
      color: '#10B981',
      capabilities: {
        layouts: true,           // Supports panels, flows, tables
        referenceSlides: false,  // Uses its own structure
        audience: true,          // Business/executive focus
        components: true,        // Icons, panels, flows
      },
    },
  ],
};
