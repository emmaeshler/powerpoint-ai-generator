'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Globe, Loader2, Pencil, Check, Plus, Lock } from 'lucide-react';
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
  const [activeBundle, setActiveBundle] = useState<string | null>(null); // null = show all (no filter)

  // Universal bundle skills are always selected and cannot be deselected
  const universalSkillIds = SKILLS_CONFIG.bundles
    .filter(b => b.id === 'universal-bundle')
    .flatMap(b => b.skills);

  const ensureUniversal = (ids: string[]) =>
    [...new Set([...universalSkillIds, ...ids])];

  const [localSelectedSkills, setLocalSelectedSkills] = useState<string[]>(ensureUniversal(selectedSkills));
  const [skillsConfig, setSkillsConfig] = useState<SkillsConfig>(SKILLS_CONFIG);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
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
    // Toggle filter: clicking active bundle clears the filter
    setActiveBundle(prev => prev === bundleId ? null : bundleId);
  };

  const handleSelectAll = () => {
    const visibleSkills = activeBundle
      ? skillsConfig.skills.filter(s => s.bundleId === activeBundle)
      : skillsConfig.skills;
    const visibleIds = visibleSkills.map(s => s.id);
    const allSelected = visibleIds.every(id => localSelectedSkills.includes(id));
    if (allSelected) {
      // Deselect all visible — but keep universal skills
      setLocalSelectedSkills(ensureUniversal(localSelectedSkills.filter(id => !visibleIds.includes(id))));
    } else {
      // Select all visible (merge with existing)
      setLocalSelectedSkills([...new Set([...localSelectedSkills, ...visibleIds])]);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    // Universal bundle skills cannot be deselected
    if (universalSkillIds.includes(skillId)) return;
    if (localSelectedSkills.includes(skillId)) {
      setLocalSelectedSkills(ensureUniversal(localSelectedSkills.filter(id => id !== skillId)));
    } else {
      setLocalSelectedSkills([...localSelectedSkills, skillId]);
    }
    // Clear active bundle when manually toggling skills
    setActiveBundle(null);
  };

  const handleClearAll = () => {
    // Keep universal bundle skills — they're always on
    setLocalSelectedSkills(universalSkillIds);
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
      setShowAddSkillModal(false);
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

      // Reset file input and close nested modal
      event.target.value = '';
      setShowAddSkillModal(false);
    } catch (error) {
      setManifestError(error instanceof Error ? error.message : 'Failed to parse manifest file');
    } finally {
      setIsLoadingManifest(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col relative"
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

        {/* Body: sidebar + skills panel */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto py-2">

              {/* All */}
              <button
                onClick={() => setActiveBundle(null)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                  activeBundle === null
                    ? 'bg-white font-semibold border-r-4'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                }`}
                style={activeBundle === null
                  ? { color: '#002F4A', borderRightColor: '#002F4A', backgroundColor: '#F0F4F8' }
                  : {}}
              >
                <span>All</span>
                <span className="text-xs text-gray-400">{skillsConfig.skills.length}</span>
              </button>

              <div className="mx-3 my-1 border-t border-gray-200" />

              {/* Bundle rows — universal bundle is excluded (it's always-on, not a filter) */}
              {skillsConfig.bundles.filter(b => b.id !== 'universal-bundle').map((bundle) => (
                <div key={bundle.id} className="group relative">
                  {renamingBundleId === bundle.id ? (
                    <div className="flex items-center gap-1 px-3 py-2">
                      <input
                        type="text"
                        value={newBundleName}
                        onChange={(e) => setNewBundleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="flex-1 text-sm border border-gray-300 rounded px-1.5 py-0.5 outline-none focus:ring-1"
                        autoFocus
                      />
                      <button onClick={handleSaveRename} className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </button>
                      <button onClick={handleCancelRename} className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBundleClick(bundle.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all text-left ${
                        activeBundle === bundle.id
                          ? 'font-semibold border-r-4'
                          : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                      }`}
                      style={activeBundle === bundle.id
                        ? { color: bundle.color, borderRightColor: bundle.color, backgroundColor: (bundle.color || '#000') + '12' }
                        : {}}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white"
                        style={{ backgroundColor: bundle.color || '#9ca3af' }}
                      />
                      <span className="flex-1 truncate">{getBundleDisplayName(bundle)}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: activeBundle === bundle.id ? bundle.color + 'aa' : '#9ca3af' }}>{bundle.skills.length}</span>
                    </button>
                  )}
                  {/* Rename pencil — visible on hover */}
                  {renamingBundleId !== bundle.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartRename(bundle.id, bundle.name); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Always-included universal skills */}
            {(() => {
              const universalBundle = skillsConfig.bundles.find(b => b.id === 'universal-bundle');
              const universalSkills = skillsConfig.skills.filter(s => universalSkillIds.includes(s.id));
              if (!universalBundle || universalSkills.length === 0) return null;
              return (
                <div className="mx-3 mb-2">
                  <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor: (universalBundle.color) + '12', border: `1px solid ${universalBundle.color}30` }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lock className="w-3 h-3 flex-shrink-0" style={{ color: universalBundle.color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: universalBundle.color }}>
                        Always Included
                      </span>
                    </div>
                    {universalSkills.map(s => (
                      <div key={s.id} className="text-[11px] text-gray-500 truncate pl-0.5">{s.label}</div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Add bundle button — sticky at sidebar bottom */}
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => setShowAddSkillModal(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-gray-300 hover:border-[#1B6B7B] text-xs font-medium transition-colors"
                style={{ color: '#1B6B7B' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bundle
              </button>
            </div>
          </div>

          {/* Right: skills panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
              <span className="text-sm font-semibold text-gray-700">
                {activeBundle
                  ? getBundleDisplayName(skillsConfig.bundles.find(b => b.id === activeBundle)!)
                  : 'All Skills'}
                <span className="ml-2 font-normal text-gray-400">
                  {(() => {
                    const visible = activeBundle
                      ? skillsConfig.skills.filter(s => s.bundleId === activeBundle)
                      : skillsConfig.skills;
                    const selected = visible.filter(s => localSelectedSkills.includes(s.id)).length;
                    return `${selected} / ${visible.length} selected`;
                  })()}
                </span>
              </span>
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                style={{ color: '#374151' }}
              >
                {(() => {
                  const visibleIds = (activeBundle
                    ? skillsConfig.skills.filter(s => s.bundleId === activeBundle)
                    : skillsConfig.skills
                  ).map(s => s.id);
                  return visibleIds.every(id => localSelectedSkills.includes(id)) ? 'Deselect All' : 'Select All';
                })()}
              </button>
            </div>

            {/* Skills grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skillsConfig.skills.filter(skill => !activeBundle || skill.bundleId === activeBundle).map((skill) => {
                  const isSelected = localSelectedSkills.includes(skill.id);
                  const skillBundle = skillsConfig.bundles.find(b => b.id === skill.bundleId);
                  const isUniversal = universalSkillIds.includes(skill.id);

                  return (
                    <div
                      key={skill.id}
                      onClick={() => !isUniversal && handleSkillToggle(skill.id)}
                      className={`p-4 border-2 rounded-lg transition-all ${isUniversal ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                      style={{
                        borderColor: isSelected ? (skillBundle?.color || '#1B6B7B') : '#e5e7eb',
                        backgroundColor: isSelected ? (skillBundle?.color || '#1B6B7B') + '10' : 'white',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {isUniversal ? (
                          <div className="mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0" title="Always included">
                            <Lock className="w-3.5 h-3.5" style={{ color: skillBundle?.color || '#F59E0B' }} />
                          </div>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSkillToggle(skill.id)}
                            className="mt-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {skill.label}
                            </h4>
                            {skill.isPublic && <Globe className="w-3 h-3 text-purple-600 flex-shrink-0" />}
                            {isUniversal && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ backgroundColor: (skillBundle?.color || '#F59E0B') + '20', color: skillBundle?.color || '#F59E0B' }}>
                                always on
                              </span>
                            )}
                          </div>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {skill.file}
                          </code>
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{skill.description}</p>
                          {!activeBundle && skillBundle && (
                            <div className="mt-2">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: skillBundle.color + '20', color: skillBundle.color }}
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
        </div>

        {/* Add Skill nested modal */}
        {showAddSkillModal && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg"
            onClick={() => {
              setShowAddSkillModal(false);
              setRepoUrl('');
              setRepoError(null);
              setManifestError(null);
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-6 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nested header */}
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h3 className="text-base font-semibold" style={{ color: '#002F4A' }}>Add Skill Bundle</h3>
                <button
                  onClick={() => {
                    setShowAddSkillModal(false);
                    setRepoUrl('');
                    setRepoError(null);
                    setManifestError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nested content */}
              <div className="px-5 py-5 space-y-4">
                {/* GitHub */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Connect a GitHub Repository</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleConnectRepo(); }}
                      placeholder="https://github.com/owner/repo"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent"
                      autoFocus
                    />
                    <Button
                      onClick={handleConnectRepo}
                      disabled={isLoadingRepo || !repoUrl.trim()}
                      style={{ backgroundColor: '#1B6B7B' }}
                    >
                      {isLoadingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                    </Button>
                  </div>
                  {repoError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {repoError}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Repo should contain a <code className="bg-gray-100 px-1 rounded">skill-manifest.json</code> or <code className="bg-gray-100 px-1 rounded">SKILL.md</code>
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">or</span>
                  </div>
                </div>

                {/* File upload */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Upload a Manifest File</p>
                  <label
                    htmlFor="manifest-upload"
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1B6B7B] transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    style={{ color: '#1B6B7B' }}
                  >
                    {isLoadingManifest ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                    ) : (
                      <><Globe className="w-4 h-4" /> Upload manifest.json</>
                    )}
                  </label>
                  <input id="manifest-upload" type="file" accept=".json" onChange={handleFileUpload} className="hidden" disabled={isLoadingManifest} />
                  {manifestError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{manifestError}</div>
                  )}
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer text-[#1B6B7B] hover:underline">View manifest format</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-[10px] overflow-x-auto">{`{\n  "version": "1.0",\n  "bundle": { "name": "My Skills", "description": "...", "owner": "You" },\n  "skills": [{ "id": "my-skill", "label": "My Skill", "description": "...", "file": "skill.md" }]\n}`}</pre>
                  </details>
                </div>

                {onShowGuide && (
                  <button
                    onClick={() => { setShowAddSkillModal(false); onClose(); onShowGuide(); }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Or manually add a skill file
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
