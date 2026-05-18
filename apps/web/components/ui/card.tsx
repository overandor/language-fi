import React from 'react'

export function Card({ children, className = '', ...props }: any) {
  return (
    <div
      className={`rounded-2xl bg-[#121826] border border-[#1f2937] hover:border-[#ffd21e] transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
