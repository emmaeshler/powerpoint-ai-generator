import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2, Sparkles, X } from 'lucide-react';

interface SlideEditDialogProps {
  isOpen: boolean;
  slideTitle: string;
  onClose: () => void;
  onSubmit: (editPrompt: string) => void;
  isLoading: boolean;
}

export function SlideEditDialog({ isOpen, slideTitle, onClose, onSubmit, isLoading }: SlideEditDialogProps) {
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEditPrompt('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (editPrompt.trim()) {
      onSubmit(editPrompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#1B6B7B' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#002F4A' }}>
              Edit Slide with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Slide Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Current Slide:</div>
          <div className="text-sm font-medium" style={{ color: '#002F4A' }}>
            {slideTitle || 'Untitled Slide'}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="p-4">
          <label className="block text-sm font-medium mb-2" style={{ color: '#002F4A' }}>
            What would you like to change?
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 'Change the chart to a bar chart', 'Add a stat showing 45% growth', 'Make the title more concise'..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
            autoFocus
          />
          <div className="mt-2 text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to submit
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!editPrompt.trim() || isLoading}
            style={{ backgroundColor: '#1B6B7B', color: '#fff' }}
            className="hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Edit Slide
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}