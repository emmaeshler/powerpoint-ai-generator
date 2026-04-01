'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Globe, Loader2, Pencil, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { SKILLS_CONFIG } from '../constants/skillsConfig';
import { Skill, SkillBundle, SkillManifest, SkillsConfig } from '../types/skills';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkills: string[];
  onSelectionChange: (skills: string[]) => void;
  userDefaultBundle?: string;
  onShowGuide?: () => void;
}

export function SkillsModal({
  isOpen,
  onClose,
  selectedSkills,
  onSelectionChange,
  userDefaultBundle = 'emma-bundle',
  onShowGuide
}: SkillsModalProps) {
  const [activeBundle, setActiveBundle] = useState<string | null>(null);
  const [localSelectedSkills, setLocalSelectedSkills] = useState<string[]>(selectedSkills);
  const [skillsConfig, setSkillsConfig] = useState<SkillsConfig>(SKILLS_CONFIG);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [showRepoInput, setShowRepoInput] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [renamingBundleId, setRenamingBundleId] = useState<string | null>(null);
  const [newBundleName, setNewBundleName] = useState('');
  const [bundleNameOverrides, setBundleNameOverrides] = useState<Record<string, string>>({});

  // Load bundle name overrides from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('bundleNameOverrides');
    if (cached) {
      try {
        setBundleNameOverrides(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to load bundle name overrides:', e);
      }
    }
  }, []);

  useEffect(() => {
    setLocalSelectedSkills(selectedSkills);
  }, [selectedSkills]);

  useEffect(() => {
    // Load cached bundles from both GitHub and manual uploads
    const cachedSkills: Skill[] = [];
    const cachedBundlesList: SkillBundle[] = [];

    // Load GitHub repos
    const githubCached = localStorage.getItem('githubSkillRepos');
    if (githubCached) {
      try {
        const githubRepos = JSON.parse(githubCached);
        githubRepos.forEach((item: any) => {
          cachedBundlesList.push(item.bundle);
          cachedSkills.push(...item.skills);
        });
      } catch (e) {
        console.error('Failed to load cached GitHub repos:', e);
      }
    }

    // Load uploaded bundles
    const uploadedCached = localStorage.getItem('uploadedSkillBundles');
    if (uploadedCached) {
      try {
        const uploadedBundles = JSON.parse(uploadedCached);
        uploadedBundles.forEach((item: any) => {
          cachedBundlesList.push(item.bundle);
          cachedSkills.push(...item.skills);
        });
      } catch (e) {
        console.error('Failed to load uploaded bundles:', e);
      }
    }

    if (cachedSkills.length > 0) {
      setSkillsConfig({
        skills: [...SKILLS_CONFIG.skills, ...cachedSkills],
        bundles: [...SKILLS_CONFIG.bundles, ...cachedBundlesList],
      });
    }
  }, []);

  if (!isOpen) return null;

  const getBundleDisplayName = (bundle: SkillBundle): string => {
    return bundleNameOverrides[bundle.id] || bundle.name;
  };

  const handleStartRename = (bundleId: string, currentName: string) => {
    setRenamingBundleId(bundleId);
    setNewBundleName(bundleNameOverrides[bundleId] || currentName);
  };

  const handleSaveRename = () => {
    if (!renamingBundleId || !newBundleName.trim()) {
      setRenamingBundleId(null);
      return;
    }

    const updatedOverrides = {
      ...bundleNameOverrides,
      [renamingBundleId]: newBundleName.trim(),
    };

    setBundleNameOverrides(updatedOverrides);
    localStorage.setItem('bundleNameOverrides', JSON.stringify(updatedOverrides));
    setRenamingBundleId(null);
    setNewBundleName('');
  };

  const handleCancelRename = () => {
    setRenamingBundleId(null);
    setNewBundleName('');
  };

  const handleBundleClick = (bundleId: string) => {
    const bundle = skillsConfig.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    // Toggle bundle selection
    if (activeBundle === bundleId) {
      setActiveBundle(null);
    } else {
      setActiveBundle(bundleId);
      // Pre-select all skills in this bundle
      setLocalSelectedSkills(bundle.skills);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    if (localSelectedSkills.includes(skillId)) {
      setLocalSelectedSkills(localSelectedSkills.filter(id => id !== skillId));
    } else {
      setLocalSelectedSkills([...localSelectedSkills, skillId]);
    }
    // Clear active bundle when manually toggling skills
    setActiveBundle(null);
  };

  const handleClearAll = () => {
    setLocalSelectedSkills([]);
    setActiveBundle(null);
  };

  const handleApply = () => {
    onSelectionChange(localSelectedSkills);
  };

  const handleConnectRepo = async () => {
    if (!repoUrl.trim()) return;

    setIsLoadingRepo(true);
    setRepoError(null);

    try {
      // Parse repo URL to extract owner/repo
      const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL. Expected format: https://github.com/owner/repo');
      }

      const [, owner, repo] = match;
      const repoSlug = `${owner}/${repo}`;
      const tempDir = `/tmp/gh-skills-${Date.now()}`;

      // Clone repo using gh CLI
      const cloneResponse = await fetch('/api/gh-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSlug, tempDir }),
      });

      if (!cloneResponse.ok) {
        const error = await cloneResponse.text();
        throw new Error(error || 'Failed to clone repository');
      }

      const { skillFile, manifest } = await cloneResponse.json();

      // Create bundle from manifest or skill file
      const bundleId = `github-${owner}-${repo}-${Date.now()}`;
      let newSkills: Skill[];
      let newBundle: SkillBundle;

      if (manifest) {
        // Standard manifest format
        newSkills = manifest.skills.map((skill: any) => ({
          ...skill,
          bundleId: bundleId,
          isPublic: true,
          repoUrl: repoUrl,
        }));

        newBundle = {
          id: bundleId,
          name: manifest.bundle.name,
          owner: manifest.bundle.owner,
          description: manifest.bundle.description,
          skills: newSkills.map(s => s.id),
          repoUrl: repoUrl,
          color: '#8B5CF6',
        };
      } else if (skillFile) {
        // Single SKILL.md file
        newSkills = [{
          id: `${repo}-skill`,
          label: skillFile.name || `${repo} Skill`,
          description: skillFile.description || `Skill from ${repoSlug}`,
          file: skillFile.path,
          bundleId: bundleId,
          isPublic: true,
          repoUrl: repoUrl,
        }];

        newBundle = {
          id: bundleId,
          name: repo,
          owner: owner,
          description: skillFile.description || `Skills from ${repoSlug}`,
          skills: newSkills.map(s => s.id),
          repoUrl: repoUrl,
          color: '#8B5CF6',
        };
      } else {
        throw new Error('No skill-manifest.json or SKILL.md found in repository');
      }

      // Update config
      const updatedConfig = {
        skills: [...skillsConfig.skills, ...newSkills],
        bundles: [...skillsConfig.bundles, newBundle],
      };
      setSkillsConfig(updatedConfig);

      // Cache in localStorage
      const cached = localStorage.getItem('githubSkillRepos');
      const cachedRepos = cached ? JSON.parse(cached) : [];
      cachedRepos.push({
        repoUrl: repoUrl,
        lastFetched: Date.now(),
        bundle: newBundle,
        skills: newSkills,
      });
      localStorage.setItem('githubSkillRepos', JSON.stringify(cachedRepos));

      // Reset
      setRepoUrl('');
      setShowRepoInput(false);
    } catch (error) {
      setRepoError(error instanceof Error ? error.message : 'Failed to connect repository');
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingManifest(true);
    setManifestError(null);

    try {
      const text = await file.text();
      const manifest: SkillManifest = JSON.parse(text);

      // Validate manifest
      if (!manifest.version || !manifest.bundle || !manifest.skills) {
        throw new Error('Invalid manifest format. Required fields: version, bundle, skills');
      }

      // Create bundle and skills from manifest
      const bundleId = `uploaded-${Date.now()}`;

      const newSkills: Skill[] = manifest.skills.map(skill => ({
        ...skill,
        bundleId: bundleId,
        isPublic: true,
      }));

      const newBundle: SkillBundle = {
        id: bundleId,
        name: manifest.bundle.name,
        owner: manifest.bundle.owner,
        description: manifest.bundle.description,
        skills: newSkills.map(s => s.id),
        color: '#8B5CF6', // Purple for uploaded bundles
      };

      // Update config
      const updatedConfig = {
        skills: [...skillsConfig.skills, ...newSkills],
        bundles: [...skillsConfig.bundles, newBundle],
      };
      setSkillsConfig(updatedConfig);

      // Cache in localStorage
      const cached = localStorage.getItem('uploadedSkillBundles');
      const cachedBundles = cached ? JSON.parse(cached) : [];
      cachedBundles.push({
        uploaded: Date.now(),
        bundle: newBundle,
        skills: newSkills,
      });
      localStorage.setItem('uploadedSkillBundles', JSON.stringify(cachedBundles));

      // Reset file input
      event.target.value = '';
    } catch (error) {
      setManifestError(error instanceof Error ? error.message : 'Failed to parse manifest file');
    } finally {
      setIsLoadingManifest(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#002F4A' }}>
          <div>
            <h2 className="text-lg font-semibold text-white">Select Skills</h2>
            <p className="text-sm text-white/70 mt-0.5">Choose skills to reference during generation</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Bundle Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Skill Bundles</h3>
            <div className="flex flex-wrap gap-2">
              {skillsConfig.bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="flex items-center gap-1"
                >
                  {renamingBundleId === bundle.id ? (
                    // Rename input
                    <div className="flex items-center gap-1 px-3 py-1.5 border-2 rounded-full bg-white" style={{ borderColor: bundle.color }}>
                      <input
                        type="text"
                        value={newBundleName}
                        onChange={(e) => setNewBundleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="outline-none text-sm font-medium min-w-[120px]"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveRename}
                        className="p-0.5 hover:bg-gray-100 rounded"
                      >
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-0.5 hover:bg-gray-100 rounded"
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleBundleClick(bundle.id)}
                        className="px-4 py-2 rounded-full border-2 transition-all font-medium text-sm flex items-center gap-2"
                        style={{
                          borderColor: activeBundle === bundle.id ? bundle.color : '#d1d5db',
                          backgroundColor: activeBundle === bundle.id ? bundle.color : 'white',
                          color: activeBundle === bundle.id ? 'white' : '#374151'
                        }}
                      >
                        {bundle.isDefault && <Briefcase className="w-3.5 h-3.5" />}
                        {bundle.repoUrl && <Globe className="w-3.5 h-3.5" />}
                        <span>{getBundleDisplayName(bundle)}</span>
                        <span className="text-xs opacity-70">({bundle.skills.length})</span>
                      </button>
                      <button
                        onClick={() => handleStartRename(bundle.id, bundle.name)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Rename bundle"
                      >
                        <Pencil className="w-3 h-3 text-gray-500" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Click a bundle to select all its skills, or check individual skills below. Click the pencil icon to rename.
            </p>
          </div>

          {/* Add Skills */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add Skills</h3>

            {/* GitHub Repository Connection */}
            {!showRepoInput ? (
              <button
                onClick={() => setShowRepoInput(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1B6B7B] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                style={{ color: '#1B6B7B' }}
              >
                <Globe className="w-4 h-4" />
                Connect GitHub Repository
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent"
                  />
                  <Button
                    onClick={handleConnectRepo}
                    disabled={isLoadingRepo || !repoUrl.trim()}
                    className="px-4"
                    style={{ backgroundColor: '#1B6B7B' }}
                  >
                    {isLoadingRepo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRepoInput(false);
                      setRepoUrl('');
                      setRepoError(null);
                    }}
                    variant="outline"
                    className="px-4"
                  >
                    Cancel
                  </Button>
                </div>
                {repoError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {repoError}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p className="font-medium mb-1">Repository should contain:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>skill-manifest.json (standard format), or</li>
                    <li>SKILL.md (single skill file)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label
                htmlFor="manifest-upload"
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1B6B7B] transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                style={{ color: '#1B6B7B' }}
              >
                {isLoadingManifest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading manifest...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Upload Manifest File
                  </>
                )}
              </label>
              <input
                id="manifest-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoadingManifest}
              />

              {manifestError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {manifestError}
                </div>
              )}

              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer text-[#1B6B7B] hover:underline">
                  View manifest format
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-[10px] overflow-x-auto">
{`{
  "version": "1.0",
  "bundle": {
    "name": "My Skills",
    "description": "Custom skills",
    "owner": "Your Name"
  },
  "skills": [
    {
      "id": "my-skill",
      "label": "My Skill",
      "description": "Description",
      "file": "path/to/skill.md"
    }
  ]
}`}
                </pre>
              </details>
            </div>

            {/* Helper: Manual Upload */}
            {onShowGuide && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onShowGuide();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Or manually add a skill file
                </button>
              </div>
            )}
          </div>

          {/* Skills Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Available Skills
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({localSelectedSkills.length} selected)
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {skillsConfig.skills.map((skill) => {
                const isSelected = localSelectedSkills.includes(skill.id);
                const skillBundle = skillsConfig.bundles.find(b => b.id === skill.bundleId);

                return (
                  <div
                    key={skill.id}
                    onClick={() => handleSkillToggle(skill.id)}
                    className="p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md"
                    style={{
                      borderColor: isSelected ? '#1B6B7B' : '#e5e7eb',
                      backgroundColor: isSelected ? '#f0f9ff' : 'white',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSkillToggle(skill.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {skill.label}
                          </h4>
                          {skill.isPublic && (
                            <Globe className="w-3 h-3 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                        <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {skill.file}
                        </code>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {skill.description}
                        </p>
                        {skillBundle && (
                          <div className="mt-2 flex items-center gap-1">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: skillBundle.color + '20',
                                color: skillBundle.color,
                              }}
                            >
                              {getBundleDisplayName(skillBundle)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            onClick={handleClearAll}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            Clear All
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{localSelectedSkills.length}</span> skill{localSelectedSkills.length === 1 ? '' : 's'} selected
            </div>
            <Button
              onClick={handleApply}
              className="px-6"
              style={{ backgroundColor: '#1B6B7B' }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
