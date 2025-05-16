import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/utils/cn'
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider } from 'react-hook-form'

export interface FormProps<TFieldValues extends FieldValues> 
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: FormProvider<TFieldValues>
}

const Form = <TFieldValues extends FieldValues>({ 
  form, 
  children,
  className,
  ...props
}: FormProps<TFieldValues>) => {
  return (
    <form
      className={cn("space-y-6", className)}
      {...props}
    >
      <FormProvider {...form}>
        {children}
      </FormProvider>
    </form>
  )
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <Controller {...props} />
  )
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// Add other form components here...

export {
  Form,
  FormField,
  FormLabel,
  // Export other components...
}