import React from 'react'
import { SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  name?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  disabled?: boolean
}

export function Select({
  children,
  name,
  value,
  onChange,
  className = '',
  disabled = false,
  ...props
}: SelectProps) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`px-3 py-2 border rounded-md ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  )
}