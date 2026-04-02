'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GitBranch, GitCommit, Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface GitWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  // Fetch current git status
  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#25282A' }}>Push to GitHub</DialogTitle>
            <DialogDescription style={{ color: '#75787B' }}>
              Manage branches, commit changes, and push to GitHub
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Branch Display */}
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" style={{ color: '#00446A' }} />
                <span className="text-sm font-medium" style={{ color: '#25282A' }}>
                  Current Branch:
                </span>
                <code className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}>
                  {currentBranch || 'Loading...'}
                </code>
              </div>
            </div>

            {/* Create New Branch */}
            <div className="space-y-3">
              <Label htmlFor="new-branch" className="text-sm font-medium" style={{ color: '#25282A' }}>
                Create New Branch
              </Label>
              <div className="flex gap-2">
                <Input
                  id="new-branch"
                  placeholder="feature/my-new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleCreateBranch}
                  disabled={isLoading || !newBranchName.trim()}
                  style={{ backgroundColor: '#00446A' }}
                  className="text-white"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            {/* Switch Branch */}
            <div className="space-y-3">
              <Label htmlFor="switch-branch" className="text-sm font-medium" style={{ color: '#25282A' }}>
                Switch Branch
              </Label>
              <Select
                value={currentBranch}
                onValueChange={handleSwitchBranch}
                disabled={isLoading}
              >
                <SelectTrigger id="switch-branch">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {allBranches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
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
                />
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCommitAndPush}
                  disabled={isLoading || !commitMessage.trim()}
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
            </div>
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
