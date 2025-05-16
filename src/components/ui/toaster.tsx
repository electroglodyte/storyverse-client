import { useToast } from '@/hooks/use-toast'
import { Toast } from '@/components/ui/toast'
import { Toaster as ToasterPrimitive } from 'react-hot-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToasterPrimitive
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 5000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    >
      {(t) => (
        <Toast
          key={t.id}
          type={t.type}
          title={t.title}
          description={t.description}
          onDismiss={() => t.dismiss()}
        />
      )}
    </ToasterPrimitive>
  )
}