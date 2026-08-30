import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className, children, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;
  return (
    <label className="field" htmlFor={selectId}>
      {label && <span className="field-label">{label}</span>}
      <select
        id={selectId}
        ref={ref}
        className={['field-input', 'field-select', error ? 'field-input-error' : '', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
});
