import React from 'react'

export function Badge({ children, variant = 'default', className = '', ...props }: any) {
  const variants = {
    default: 'bg-gradient-to-r from-[#ffd21e] to-[#ff9500] text-black',
    success: 'bg-green-500 text-black',
    warning: 'bg-yellow-500 text-black',
    error: 'bg-red-500 text-black'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
