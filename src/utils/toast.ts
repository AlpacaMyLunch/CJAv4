import type { ToastProps } from '@/components/ui/toast'

/**
 * Type for the addToast function from useToast hook
 */
type AddToastFn = (toast: Omit<ToastProps, 'id' | 'onClose'>) => void

/**
 * Show a success toast notification
 * @param addToast - The addToast function from useToast hook
 * @param message - The success message to display
 *
 * @example
 * const { addToast } = useToast()
 * showSuccessToast(addToast, 'Review saved successfully')
 */
export function showSuccessToast(addToast: AddToastFn, message: string) {
  addToast({
    title: 'Success',
    description: message,
    variant: 'success'
  })
}

/**
 * Show an error toast notification
 * @param addToast - The addToast function from useToast hook
 * @param message - The error message to display
 *
 * @example
 * const { addToast } = useToast()
 * showErrorToast(addToast, 'Failed to save review')
 */
export function showErrorToast(addToast: AddToastFn, message: string) {
  addToast({
    title: 'Error',
    description: message,
    variant: 'destructive'
  })
}

/**
 * Show an authentication required toast notification
 * @param addToast - The addToast function from useToast hook
 *
 * @example
 * const { addToast } = useToast()
 * showAuthRequiredToast(addToast)
 */
export function showAuthRequiredToast(addToast: AddToastFn) {
  addToast({
    title: 'Authentication Required',
    description: 'Please sign in to continue',
    variant: 'destructive'
  })
}
