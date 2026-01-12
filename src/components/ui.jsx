import { forwardRef } from 'react'
import { cn } from '../lib/utils'
import { Loader2 } from 'lucide-react'

// Button
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40',
    secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
    outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

// Input
export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-zinc-400 text-sm font-medium block mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 text-white',
            'placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
            'transition-colors duration-200',
            Icon ? 'pl-12 pr-4' : 'px-4',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea
export const Textarea = forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-zinc-400 text-sm font-medium block mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white',
          'placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
          'transition-colors duration-200 resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Card
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'bg-zinc-800/50 rounded-2xl border border-zinc-700/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Badge
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-zinc-700 text-zinc-300',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  return (
    <Loader2 className={cn('animate-spin text-orange-500', sizes[size], className)} />
  )
}

// Loading screen
export function LoadingScreen({ message = 'Chargement...' }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <Spinner size="xl" />
      <p className="mt-4 text-zinc-400">{message}</p>
    </div>
  )
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-zinc-500" />
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-zinc-500 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        'relative bg-zinc-900 rounded-t-3xl sm:rounded-2xl w-full max-h-[90vh] overflow-hidden',
        sizes[size]
      )}>
        {title && (
          <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <span className="text-zinc-400 text-xl">×</span>
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Progress bar
export function ProgressBar({ value, max = 100, className = '' }) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={cn('h-3 bg-zinc-700 rounded-full overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-out progress-animate"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Stat card
export function StatCard({ icon: Icon, label, value, subtitle, variant = 'default' }) {
  const variants = {
    default: 'bg-zinc-800/50',
    orange: 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/20',
  }

  const iconVariants = {
    default: 'bg-zinc-700',
    success: 'bg-emerald-500/20',
    warning: 'bg-amber-500/20',
    danger: 'bg-red-500/20',
  }

  return (
    <div className={cn('rounded-xl p-4 border border-zinc-700/30', variants[variant])}>
      {Icon && (
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', iconVariants.default)}>
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
      )}
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-zinc-500 text-xs">{label}</p>
      {subtitle && <p className="text-zinc-600 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}
