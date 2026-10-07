import { Select } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { useBranches } from '../lib/hooks';
import type { UUID } from '../lib/apiTypes';

interface Props {
  value?: UUID;
  onChange: (branchId: UUID | undefined) => void;
  /** Include an "all branches" option (for filters). */
  allowAll?: boolean;
  label?: string;
  className?: string;
}

/**
 * Branch picker wired to `GET /branches` (tenant-scoped). Used both as a filter
 * (allowAll) and as a required selector for per-branch screens (dashboard,
 * reports). Empty value = "all" when allowAll, else unselected.
 */
export function BranchSelect({ value, onChange, allowAll = false, label, className }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useBranches();
  const branches = data ?? [];

  const options = [
    ...(allowAll ? [{ value: '', label: t('bp.common.all') }] : []),
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <Select
      label={label}
      containerClassName={className}
      options={options}
      value={value ?? ''}
      disabled={isLoading}
      placeholder={allowAll ? undefined : t('bp.common.selectBranch')}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}
