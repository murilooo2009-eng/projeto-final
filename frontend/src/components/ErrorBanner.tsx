import { IconAlertCircle } from './Icon';

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-banner">
      <IconAlertCircle size={18} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="error-banner-retry" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
