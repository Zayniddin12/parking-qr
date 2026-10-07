/** A realistic UZ number-plate chip. `size` scales the whole thing. */
export function Plate({ value, size = 'md' }: { value: string; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <span
      className={
        'inline-flex select-none items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm ' +
        (lg ? 'h-14' : 'h-10')
      }
    >
      <span
        className={
          'flex flex-col items-center justify-center bg-primary px-2 font-semibold leading-none text-white ' +
          (lg ? 'text-xs' : 'text-exs')
        }
      >
        <span>UZ</span>
      </span>
      <span
        className={
          'plate-glyph flex items-center px-3 font-bold uppercase text-gray-800 ' +
          (lg ? 'text-3xl' : 'text-lg')
        }
      >
        {value || '—'}
      </span>
    </span>
  );
}
