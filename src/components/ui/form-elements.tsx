import React from 'react';
import { cn } from '@/lib/utils';

interface FormElementProps {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends FormElementProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
}

interface InputProps extends FormElementProps {
  type?: 'text' | 'number' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

interface TextareaProps extends FormElementProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  className,
}) => (
  <div className="form-control">
    {label && (
      <label className="label">
        <span className="label-text">{label}{required && ' *'}</span>
      </label>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={cn(
        'select select-bordered w-full',
        error && 'select-error',
        className
      )}
      required={required}
    >
      <option value="">Select...</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <span className="text-error text-sm mt-1">{error}</span>}
  </div>
);

export const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  className,
}) => (
  <div className="form-control">
    {label && (
      <label className="label">
        <span className="label-text">{label}{required && ' *'}</span>
      </label>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        'input input-bordered w-full',
        error && 'input-error',
        className
      )}
      required={required}
    />
    {error && <span className="text-error text-sm mt-1">{error}</span>}
  </div>
);

export const Textarea: React.FC<TextareaProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  required,
  className,
}) => (
  <div className="form-control">
    {label && (
      <label className="label">
        <span className="label-text">{label}{required && ' *'}</span>
      </label>
    )}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'textarea textarea-bordered w-full',
        error && 'textarea-error',
        className
      )}
      required={required}
    />
    {error && <span className="text-error text-sm mt-1">{error}</span>}
  </div>
);

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}) => (
  <button
    className={cn(
      'btn',
      {
        'btn-primary': variant === 'primary',
        'btn-secondary': variant === 'secondary',
        'btn-error': variant === 'destructive',
        'btn-sm': size === 'sm',
        'btn-md': size === 'md',
        'btn-lg': size === 'lg',
        'loading': loading,
      },
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {children}
  </button>
);
