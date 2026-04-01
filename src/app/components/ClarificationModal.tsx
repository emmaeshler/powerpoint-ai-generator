import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'multiChoice';
  options?: string[];
  required: boolean;
}

interface ClarificationModalProps {
  isOpen: boolean;
  questions: ClarificationQuestion[];
  originalPrompt: string;
  onClose: () => void;
  onComplete: (enrichedPrompt: string) => void;
}

export function ClarificationModal({
  isOpen,
  questions,
  originalPrompt,
  onClose,
  onComplete
}: ClarificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  if (!isOpen || questions.length === 0) return null;

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return Boolean(answer && answer.trim());
  };

  const handleComplete = () => {
    // Build enriched prompt with answers
    let enrichedPrompt = originalPrompt + '\n\nCLARIFICATIONS PROVIDED:\n';
    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
        enrichedPrompt += `- ${q.question}: ${answerText}\n`;
      }
    });
    enrichedPrompt += '\nPlease regenerate the slide(s) with these clarifications in mind.';
    onComplete(enrichedPrompt);
  };

  const handleChipSelect = (value: string) => {
    if (currentQuestion.type === 'multiChoice') {
      const current = (answers[currentQuestion.id] as string[]) || [];
      const newAnswers = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleTextInput = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ backgroundColor: '#1B6B7B' }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-white" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Need More Information</h2>
              <p className="text-sm text-white/70 mt-0.5">
                Question {currentStep + 1} of {questions.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / questions.length) * 100}%`,
              backgroundColor: '#1B6B7B'
            }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-8 min-h-[320px]">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'choice' || currentQuestion.type === 'multiChoice' ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options?.map((option) => {
                  const isSelected =
                    currentQuestion.type === 'multiChoice'
                      ? ((answers[currentQuestion.id] as string[]) || []).includes(option)
                      : answers[currentQuestion.id] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleChipSelect(option)}
                      className="px-4 py-2 rounded-full border-2 transition-all font-medium"
                      style={{
                        borderColor: isSelected ? '#1B6B7B' : '#d1d5db',
                        backgroundColor: isSelected ? '#1B6B7B' : 'white',
                        color: isSelected ? 'white' : '#374151'
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={(answers[currentQuestion.id] as string) || ''}
                onChange={(e) => handleTextInput(e.target.value)}
                placeholder="Enter your answer here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] resize-none"
                rows={4}
              />
            )}

            {!currentQuestion.required && (
              <p className="text-sm text-gray-500 italic">
                Optional - you can skip this question
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="flex items-center gap-2 text-white"
              style={{ backgroundColor: '#1B6B7B' }}
            >
              Regenerate Slide
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 text-white"
              style={{ backgroundColor: '#1B6B7B' }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
