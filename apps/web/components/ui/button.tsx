import React from 'react'

export function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#ffd21e] to-[#ff9500] text-black font-semibold hover:scale-105 transition-transform',
    secondary: 'bg-[#121826] border border-[#1f2937] text-[#ffd21e] font-semibold hover:border-[#ffd21e] transition-colors',
    ghost: 'hover:bg-[#1f2937] text-white transition-colors'
  }

  return (
    <button
      className={`px-4 py-2 rounded-lg ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
