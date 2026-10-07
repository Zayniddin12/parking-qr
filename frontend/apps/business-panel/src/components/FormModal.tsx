import type { FormEvent, ReactNode } from 'react';
import { Button, Modal, type ModalSize } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { errorMessage } from '../lib/format';

interface Props {
  show: boolean;
  title: string;
  size?: ModalSize;
  submitLabel?: string;
  submitting?: boolean;
  error?: unknown;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal wrapping a form: submit/cancel footer + an inline error banner for the
 * mutation. `onSubmit` is called on native form submit (Enter works).
 */
export function FormModal({
  show,
  title,
  size = 'md',
  submitLabel,
  submitting = false,
  error,
  onSubmit,
  onClose,
  children,
}: Props) {
  const { t } = useTranslation();
  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <Modal show={show} title={title} size={size} onClose={onClose} dismissable={!submitting}>
      <form onSubmit={handle} className="flex flex-col gap-4">
        {children}
        {error != null && (
          <div className="rounded-2lg border border-red-200 bg-red-50 px-3 py-2 text-2xs text-red-700">
            {errorMessage(error)}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitLabel ?? t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
