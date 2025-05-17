import React from 'react';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  severity?: 'error' | 'warning' | 'info';
  retry?: () => void;
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: AlertCircle
};

const severityStyles = {
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400'
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  severity = 'error',
  retry
}) => {
  const Icon = iconMap[severity];
  const severityStyle = severityStyles[severity];

  return (
    <Alert variant="destructive" className="my-4">
      <Icon className={`h-5 w-5 ${severityStyle}`} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex items-center gap-4">
        <span>{message}</span>
        {retry && (
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};