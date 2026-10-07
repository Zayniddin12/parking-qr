import { Button, Modal } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';

interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Yes/No confirmation dialog (archive, delete). */
export function ConfirmModal({
  show,
  title,
  message,
  confirmLabel,
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      show={show}
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('common.delete')}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
