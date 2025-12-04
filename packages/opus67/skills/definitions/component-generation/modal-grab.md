# MODAL-GRAB Skill

## Overview
Generate production-ready modal and dialog components with animations, accessibility features, and various layouts. Supports alerts, confirmations, forms, and complex modal workflows.

## Metadata
- **ID**: `modal-grab`
- **Category**: Component Generation
- **Complexity**: Advanced
- **Prerequisites**: React 18+, TypeScript, Portal API, Focus Management
- **Estimated Time**: 15-25 minutes

## Capabilities
- Basic modals with overlay and close functionality
- Animated modals with enter/exit transitions
- Alert and confirmation dialogs
- Form modals with validation
- Multi-step modal workflows
- Drawer/slide-out panels
- Full-screen modals
- Nested modals support
- Accessibility features (focus trapping, keyboard navigation)
- Mobile-responsive modal layouts

## Modal Component Patterns

### 1. Base Modal Component
```typescript
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${overlayClassName}
      `}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-black transition-opacity duration-300
          ${isOpen ? 'opacity-50' : 'opacity-0'}
        `}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}
          transform transition-all duration-300
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          ${className}
        `}
        onAnimationEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
```

### 2. Confirmation Dialog
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const variantStyles = {
    default: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={false}
    >
      <div className="text-center">
        {icon && (
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${styles.icon}`}>
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${styles.button}
            `}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 3. Form Modal
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormModalProps<T extends z.ZodSchema> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  title: string;
  schema: T;
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  submitText?: string;
  cancelText?: string;
}

export function FormModal<T extends z.ZodSchema>({
  isOpen,
  onClose,
  onSubmit,
  title,
  schema,
  fields,
  submitText = 'Submit',
  cancelText = 'Cancel',
}: FormModalProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      closeOnOverlay={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                {...register(field.name)}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                {...register(field.name)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type || 'text'}
                {...register(field.name)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}

            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

### 4. Drawer/Slide-out Panel
```typescript
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  size = 'md',
  className = '',
}: DrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const positionClasses = {
    left: `left-0 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`,
    right: `right-0 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`,
  };

  const drawerContent = (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-black transition-opacity duration-300
          ${isOpen ? 'opacity-50' : 'opacity-0'}
        `}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          absolute top-0 h-full bg-white shadow-xl ${sizeClasses[size]} w-full
          ${positionClasses[position]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close drawer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto h-full">{children}</div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
```

### 5. Multi-step Modal
```typescript
interface Step {
  title: string;
  component: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface MultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void | Promise<void>;
  steps: Step[];
  title?: string;
}

export function MultiStepModal({
  isOpen,
  onClose,
  onComplete,
  steps,
  title,
}: MultiStepModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    const step = steps[currentStep];
    if (step.validate) {
      setIsLoading(true);
      const isValid = await step.validate();
      setIsLoading(false);

      if (!isValid) return;
    }

    if (isLastStep) {
      setIsLoading(true);
      await onComplete();
      setIsLoading(false);
      onClose();
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {index + 1}
                </div>
                <span className="mt-2 text-xs text-gray-600">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-2
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">{steps[currentStep].component}</div>

        {/* Navigation */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          {!isFirstStep && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

## Usage Examples

### Basic Modal
```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Welcome"
  size="md"
>
  <p>This is a basic modal with default settings.</p>
</Modal>
```

### Confirmation Dialog
```typescript
<ConfirmDialog
  isOpen={isDeleteOpen}
  onClose={() => setIsDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete Account"
  message="Are you sure you want to delete your account? This action cannot be undone."
  confirmText="Delete"
  variant="danger"
  icon={<TrashIcon />}
/>
```

### Form Modal
```typescript
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user']),
});

<FormModal
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  onSubmit={handleSubmit}
  title="Add User"
  schema={userSchema}
  fields={[
    { name: 'name', label: 'Name', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
      ],
    },
  ]}
/>
```

## Best Practices

1. **Accessibility**
   - Trap focus within modal
   - Support Escape key to close
   - Use proper ARIA attributes
   - Announce modal opening to screen readers

2. **Performance**
   - Use portals for proper rendering
   - Prevent body scroll when open
   - Cleanup event listeners
   - Lazy load modal content

3. **User Experience**
   - Animate entry and exit
   - Show loading states
   - Prevent accidental closes during actions
   - Provide clear close mechanisms

4. **Mobile Responsiveness**
   - Use full-screen on small devices
   - Ensure touch-friendly buttons
   - Handle keyboard on mobile
   - Test with different screen sizes

## Generated: 2025-01-04
Version: 1.0.0
