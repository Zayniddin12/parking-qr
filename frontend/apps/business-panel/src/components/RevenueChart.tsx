import { useTranslation } from '@autoparking/i18n';
import { NoData } from '@autoparking/ui';
import { formatTiyin } from '../lib/money';
import { formatDate } from '../lib/format';
import type { RevenueByDayPoint } from '../lib/apiTypes';

/**
 * Dependency-free SVG bar chart of daily net revenue (integer tiyin). Kept local
 * so the panel ships no charting library. Bars are labelled by date + amount for
 * accessibility (never color-only).
 */
export function RevenueChart({ data }: { data: RevenueByDayPoint[] }) {
  const { t } = useTranslation();
  if (!data.length) return <NoData title={t('bp.common.none')} />;

  const values = data.map((d) => d.net_tiyin);
  const max = Math.max(1, ...values);
  const width = 640;
  const height = 180;
  const pad = 24;
  const barGap = 4;
  const barW = Math.max(2, (width - pad * 2) / data.length - barGap);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={t('bp.dashboard.revenueByDay')}
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const h = Math.round(((height - pad * 2) * d.net_tiyin) / max);
          const x = pad + i * (barW + barGap);
          const y = height - pad - h;
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={Math.max(0, h)} rx={2} fill="#2f81f7">
                <title>{`${formatDate(d.day)}: ${formatTiyin(d.net_tiyin)} UZS (${d.payments})`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
