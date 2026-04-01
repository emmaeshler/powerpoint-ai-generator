import { Power, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface StopServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StopServerModal({ isOpen, onClose, onConfirm }: StopServerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <Power className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#25282A' }}>
              Stop Server?
            </h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              This will shut down the local server completely.
            </p>
          </div>
        </div>

        <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
            <p className="text-xs" style={{ color: '#991B1B' }}>
              Make sure you've <strong>exported any presentations</strong> you want to keep before stopping.
              Once the server is stopped, this page will no longer work until you restart it.
            </p>
          </div>
        </div>

        <div className="rounded-lg p-3 mb-5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p className="text-xs" style={{ color: '#166534' }}>
            To restart later, open your Terminal and run{' '}
            <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">npm start</code>{' '}
            from the project folder. Full instructions will appear on screen after shutdown.
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="text-white"
            style={{ backgroundColor: '#DC2626' }}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            Stop Server
          </Button>
        </div>
      </div>
    </div>
  );
}
