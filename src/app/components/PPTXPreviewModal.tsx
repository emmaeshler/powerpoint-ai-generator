'use client';

import { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Slide } from '../types';
import { generatePowerPointBlob } from '../utils/pptx-generator';

interface PPTXPreviewModalProps {
  slides: Slide[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
}

export function PPTXPreviewModal({ slides, isOpen, onClose, onConfirmDownload }: PPTXPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasLibreOffice, setHasLibreOffice] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function generatePreview() {
      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setPptxUrl(null);
      setMessage(null);

      try {
        // Generate PPTX blob on client-side
        const pptxBlob = await generatePowerPointBlob(slides);

        // Convert blob to base64
        const base64 = await blobToBase64(pptxBlob);

        // Upload to server for PDF conversion and preview
        const response = await fetch('http://localhost:4000/api/upload-pptx-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pptxBase64: base64 })
        });

        const data = await response.json();

        if (data.success) {
          setPdfUrl(data.pdfUrl ? `http://localhost:4000${data.pdfUrl}` : null);
          setPptxUrl(data.pptxUrl ? `http://localhost:4000${data.pptxUrl}` : null);
          setMessage(data.message);
          setHasLibreOffice(!!data.pdfUrl);
        } else {
          setError(data.error || 'Preview generation failed');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect to preview server');
      } finally {
        setIsLoading(false);
      }
    }

    generatePreview();
  }, [isOpen, slides]);

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function detectFormat(slide: Slide): 'emma' | 'will-code' | 'will-sections' {
    const slideData = slide as any;
    const pptxCode = slideData?.content?.pptxCode || slideData?.content?.rawOutput;

    if (pptxCode) {
      return 'will-code';
    } else if (slideData.content?.sections && Array.isArray(slideData.content.sections)) {
      return 'will-sections';
    }
    return 'emma';
  }

  function handleDownload() {
    onConfirmDownload();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#00446A' }}>
              Preview Your Presentation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review your slides before downloading
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 500 }}>
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-current mb-4" style={{ color: '#00446A' }} />
                <div className="text-gray-700 text-lg mb-2">Generating preview...</div>
                <div className="text-gray-500 text-sm">This may take a few seconds</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center" style={{ minHeight: 500 }}>
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-red-600 text-lg font-semibold mb-2">Preview Error</div>
                <div className="text-red-500 text-sm mb-4">{error}</div>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col items-center">
              <iframe
                src={pdfUrl}
                className="border rounded-lg shadow-sm mb-4"
                style={{ width: '100%', height: 600 }}
                title="PPTX Preview"
              />
              {message && (
                <div className="text-sm text-green-600 mb-2">✓ {message}</div>
              )}
            </div>
          ) : pptxUrl ? (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 500 }}>
              <div className="text-center max-w-lg">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-blue-900 text-xl font-semibold mb-2">PDF Preview Not Available</div>
                {message && (
                  <div className="text-blue-700 text-sm mb-4">{message}</div>
                )}
                <div className="text-gray-600 text-sm mb-6">
                  To see a PDF preview in your browser, you need to install LibreOffice:
                </div>
                <code className="block bg-gray-100 px-4 py-3 rounded text-sm mb-6 font-mono">
                  brew install --cask libreoffice
                </code>
                <div className="text-gray-600 text-sm mb-6">
                  Or you can download the PPTX file now and open it in PowerPoint.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: 500 }}>
              <div className="text-gray-500">No preview available</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {slides.length} slide{slides.length !== 1 ? 's' : ''} ready to export
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              className="text-white"
              style={{ backgroundColor: '#00446A' }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PPTX
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
