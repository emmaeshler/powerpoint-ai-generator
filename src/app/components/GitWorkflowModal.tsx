'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GitBranch, GitCommit, Upload, RefreshCw, AlertTriangle, Plus, ArrowLeftRight, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';

interface GitWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangesSummary {
  branch: string;
  hasChanges: boolean;
  skills: { added: string[]; modified: string[]; removed: string[] };
  components: string[];
  generators: string[];
  other: string[];
}

export function GitWorkflowModal({ isOpen, onClose }: GitWorkflowModalProps) {
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [allBranches, setAllBranches] = useState<string[]>([]);
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [overrideNote, setOverrideNote] = useState<string>('');
  const [branchToOverride, setBranchToOverride] = useState<string>('');
  const [changesSummary, setChangesSummary] = useState<ChangesSummary | null>(null);
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  // Fetch current git status
  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
      fetchChangesSummary();
    }
  }, [isOpen]);

  async function fetchGitStatus() {
    try {
      setIsLoading(true);

      // Get current branch
      const currentResponse = await fetch('http://localhost:4000/git/current-branch');
      const currentData = await currentResponse.json();
      setCurrentBranch(currentData.branch || '');

      // Get all branches
      const branchesResponse = await fetch('http://localhost:4000/git/branches');
      const branchesData = await branchesResponse.json();
      setAllBranches(branchesData.branches || []);
    } catch (error) {
      console.error('Failed to fetch git status:', error);
      toast.error('Failed to load git status');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChangesSummary() {
    try {
      const response = await fetch('http://localhost:4000/git/summary');
      const data = await response.json();
      setChangesSummary(data);

      // Auto-generate commit message if there are changes
      if (data.hasChanges && !commitMessage) {
        const parts: string[] = [];
        if (data.skills.added.length > 0) {
          parts.push(`Add ${data.skills.added.join(', ')}`);
        }
        if (data.skills.modified.length > 0) {
          parts.push(`Update ${data.skills.modified.join(', ')}`);
        }
        if (data.components.length > 0 || data.generators.length > 0) {
          parts.push('improve preview and export');
        }
        const generatedMessage = parts.join('; ') || 'Update slide generator';
        setCommitMessage(generatedMessage);
      }
    } catch (error) {
      console.error('Failed to fetch changes summary:', error);
    }
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    // Check if branch already exists
    if (allBranches.includes(newBranchName)) {
      setBranchToOverride(newBranchName);
      setShowOverrideWarning(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/git/create-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName: newBranchName }),
      });

      if (!response.ok) throw new Error('Failed to create branch');

      toast.success(`Branch "${newBranchName}" created and checked out`);
      setNewBranchName('');
      setShowNewBranchInput(false);
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to create branch:', error);
      toast.error('Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCommitAndPush() {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    try {
      setIsLoading(true);

      // Stage all changes
      await fetch('http://localhost:4000/git/stage-all', { method: 'POST' });

      // Commit
      const commitResponse = await fetch('http://localhost:4000/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage }),
      });

      if (!commitResponse.ok) throw new Error('Failed to commit');

      // Push
      const pushResponse = await fetch('http://localhost:4000/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: currentBranch }),
      });

      if (!pushResponse.ok) throw new Error('Failed to push');

      toast.success('Changes committed and pushed successfully');
      setCommitMessage('');
      setChangesSummary(null);
      onClose();
    } catch (error) {
      console.error('Failed to commit and push:', error);
      toast.error('Failed to commit and push changes');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSwitchBranch(branchName: string) {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/git/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName }),
      });

      if (!response.ok) throw new Error('Failed to switch branch');

      toast.success(`Switched to branch "${branchName}"`);
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to switch branch:', error);
      toast.error('Failed to switch branch');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOverrideConfirm() {
    if (!overrideNote.trim()) {
      toast.error('Please provide a reason for overriding this branch');
      return;
    }

    try {
      setIsLoading(true);

      // Switch to the branch
      await fetch('http://localhost:4000/git/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName: branchToOverride }),
      });

      // Save the override note
      await fetch('http://localhost:4000/git/save-override-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: branchToOverride,
          note: overrideNote,
          timestamp: new Date().toISOString(),
        }),
      });

      toast.success(`Switched to "${branchToOverride}" with override note saved`);
      setShowOverrideWarning(false);
      setOverrideNote('');
      setBranchToOverride('');
      setNewBranchName('');
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to override branch:', error);
      toast.error('Failed to override branch');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen && !showOverrideWarning} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle style={{ color: '#25282A' }}>Push to GitHub</DialogTitle>
            <DialogDescription style={{ color: '#75787B' }}>
              Review changes and push to your repository
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {/* Current Branch with Actions */}
            <div className="rounded-lg p-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" style={{ color: '#00446A' }} />
                  <span className="text-xs font-medium" style={{ color: '#75787B' }}>Branch:</span>
                  <code className="text-sm px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}>
                    {currentBranch || 'Loading...'}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowBranchSelector(!showBranchSelector)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    title="Switch branch"
                    disabled={isLoading}
                  >
                    <ArrowLeftRight className="w-4 h-4" style={{ color: '#00446A' }} />
                  </button>
                  <button
                    onClick={() => setShowNewBranchInput(!showNewBranchInput)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    title="Create new branch"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4" style={{ color: '#00446A' }} />
                  </button>
                </div>
              </div>

              {/* Branch Selector (expandable) */}
              {showBranchSelector && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium" style={{ color: '#25282A' }}>
                      Switch to: <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}>
                        {allBranches.length} branch{allBranches.length !== 1 ? 'es' : ''}
                      </span>
                    </Label>
                    <button
                      onClick={() => {
                        fetchGitStatus();
                        toast.info('Refreshing branches...');
                      }}
                      disabled={isLoading}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Refresh from remote"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} style={{ color: '#00446A' }} />
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {allBranches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => {
                          handleSwitchBranch(branch);
                          setShowBranchSelector(false);
                        }}
                        disabled={branch === currentBranch || isLoading}
                        className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono">{branch}</span>
                          {branch === currentBranch && (
                            <Check className="w-3 h-3" style={{ color: '#00446A' }} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New Branch Input (expandable) */}
              {showNewBranchInput && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <Label className="text-xs font-medium mb-2" style={{ color: '#25282A' }}>
                    New branch name:
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="feature/my-feature"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      disabled={isLoading}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newBranchName.trim()) {
                          handleCreateBranch();
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        handleCreateBranch();
                        setShowNewBranchInput(false);
                      }}
                      disabled={isLoading || !newBranchName.trim()}
                      size="sm"
                      style={{ backgroundColor: '#00446A' }}
                      className="text-white"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setShowNewBranchInput(false);
                        setNewBranchName('');
                      }}
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Changes Summary */}
            {changesSummary && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#25282A' }}>
                  📋 Changes Summary
                </h3>
                {!changesSummary.hasChanges ? (
                  <div className="text-center py-6 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div className="text-gray-400 mb-2">
                      <GitCommit className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-sm" style={{ color: '#75787B' }}>No changes to commit</p>
                  </div>
                ) : (
                <div className="space-y-2.5">
                  {/* Skills */}
                  {(changesSummary.skills.added.length > 0 ||
                    changesSummary.skills.modified.length > 0 ||
                    changesSummary.skills.removed.length > 0) && (
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#EEF4F7', border: '1px solid #D1E5EC' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium" style={{ color: '#00446A' }}>📦 Skills</span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        {changesSummary.skills.added.map(skill => (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="text-green-600 font-mono">+</span>
                            <span style={{ color: '#25282A' }}>{skill}</span>
                          </div>
                        ))}
                        {changesSummary.skills.modified.map(skill => (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="text-blue-600 font-mono">~</span>
                            <span style={{ color: '#25282A' }}>{skill}</span>
                          </div>
                        ))}
                        {changesSummary.skills.removed.map(skill => (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="text-red-600 font-mono">-</span>
                            <span style={{ color: '#25282A' }}>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Components */}
                  {changesSummary.components.length > 0 && (
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#F5F3FF', border: '1px solid #E9D5FF' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium" style={{ color: '#7C3AED' }}>🎨 UI Components</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {changesSummary.components.map(comp => (
                          <span
                            key={comp}
                            className="px-2 py-0.5 rounded text-[11px]"
                            style={{ backgroundColor: '#E9D5FF', color: '#6B21A8' }}
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generators */}
                  {changesSummary.generators.length > 0 && (
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium" style={{ color: '#C2410C' }}>⚙️ Generators</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {changesSummary.generators.map(gen => (
                          <span
                            key={gen}
                            className="px-2 py-0.5 rounded text-[11px]"
                            style={{ backgroundColor: '#FED7AA', color: '#9A3412' }}
                          >
                            {gen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Files */}
                  {changesSummary.other.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer hover:underline" style={{ color: '#75787B' }}>
                        Other changes ({changesSummary.other.length} files)
                      </summary>
                      <ul className="mt-2 ml-4 space-y-1">
                        {changesSummary.other.map(file => (
                          <li key={file} className="font-mono text-[10px]" style={{ color: '#4A6070' }}>
                            {file}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                )}
              </div>
            )}

            {/* Commit Message Section */}
            <div className="space-y-3">
              <Label htmlFor="commit-message" className="text-sm font-medium" style={{ color: '#25282A' }}>
                Commit Message
              </Label>
              <Textarea
                id="commit-message"
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 border-t pt-4 flex gap-2" style={{ borderColor: '#E5E7EB' }}>
            <Button
              onClick={handleCommitAndPush}
              disabled={isLoading || !commitMessage.trim() || !changesSummary?.hasChanges}
              className="flex-1 text-white"
              style={{ backgroundColor: '#00446A' }}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Commit & Push
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Warning Modal */}
      <Dialog open={showOverrideWarning} onOpenChange={() => setShowOverrideWarning(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: '#F59E0B' }} />
              </div>
              <DialogTitle style={{ color: '#25282A' }}>Branch Already Exists</DialogTitle>
            </div>
            <DialogDescription style={{ color: '#75787B' }}>
              The branch "{branchToOverride}" already exists. Please provide a reason for overriding it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="override-note" className="text-sm font-medium" style={{ color: '#25282A' }}>
                Override Reason
              </Label>
              <Textarea
                id="override-note"
                placeholder="Example: Emma overrode this because the previous version had layout issues..."
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOverrideConfirm}
                disabled={isLoading || !overrideNote.trim()}
                className="flex-1 text-white"
                style={{ backgroundColor: '#F59E0B' }}
              >
                Override Branch
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOverrideWarning(false);
                  setOverrideNote('');
                  setBranchToOverride('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
