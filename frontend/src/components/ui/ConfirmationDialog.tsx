import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconColor = {
    danger: 'text-rose-400 bg-rose-950/40 border-rose-900/60',
    warning: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
    info: 'text-violet-400 bg-violet-950/40 border-violet-900/60',
  };

  const confirmVariant = {
    danger: 'danger' as const,
    warning: 'primary' as const, // Or customize
    info: 'primary' as const,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalBody>
        <div className="flex gap-4 items-start">
          <div className={`flex items-center justify-center p-3 border rounded-xl shrink-0 ${iconColor[variant]}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-display font-semibold text-slate-100 text-sm">{title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed">{message}</p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant[variant]}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
export default ConfirmationDialog;
