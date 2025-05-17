import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

interface EntityFormProps {
  fields: FormFieldDefinition[];
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  submitLabel?: string;
  loading?: boolean;
}

export const EntityForm: React.FC<EntityFormProps> = ({
  fields,
  onSubmit,
  initialData,
  submitLabel = 'Save',
  loading = false
}) => {
  // Generate Zod schema from field definitions
  const generateSchema = () => {
    const schemaObj: Record<string, any> = {};
    
    fields.forEach(field => {
      let fieldSchema = z.string();
      
      if (field.validation?.required) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      } else {
        fieldSchema = fieldSchema.optional();
      }

      if (field.validation?.minLength) {
        fieldSchema = fieldSchema.min(field.validation.minLength, 
          `${field.label} must be at least ${field.validation.minLength} characters`);
      }

      if (field.validation?.maxLength) {
        fieldSchema = fieldSchema.max(field.validation.maxLength,
          `${field.label} must be no more than ${field.validation.maxLength} characters`);
      }

      if (field.validation?.pattern) {
        fieldSchema = fieldSchema.regex(field.validation.pattern);
      }

      if (field.type === 'number') {
        fieldSchema = z.number({
          required_error: `${field.label} is required`,
          invalid_type_error: `${field.label} must be a number`,
        });

        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validation.min);
        }

        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validation.max);
        }
      }

      schemaObj[field.name] = fieldSchema;
    });

    return z.object(schemaObj);
  };

  const form = useForm({
    resolver: zodResolver(generateSchema()),
    defaultValues: initialData || {},
  });

  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  {...formField}
                />
              ) : field.type === 'select' && field.options ? (
                <Select
                  onValueChange={formField.onChange}
                  value={formField.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  {...formField}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {fields.map(renderField)}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default EntityForm;