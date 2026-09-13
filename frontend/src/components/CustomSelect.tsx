'use client'
import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full min-w-[140px] px-4 py-2.5 bg-[#15181E] border rounded-xl text-sm transition-all duration-200 focus:outline-none ${
          isOpen 
            ? 'border-accent shadow-[0_0_12px_rgba(52,211,153,0.15)] text-foreground' 
            : 'border-white/[0.08] hover:border-white/[0.15] text-foreground hover:bg-[#1A1D24]'
        }`}
      >
        <span className={!selectedOption ? 'text-muted' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 ml-3 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full min-w-max bg-[#1A1D24]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden py-1 transform opacity-100 scale-100 transition-all duration-200 origin-top">
          <div className="max-h-[300px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected 
                      ? 'bg-accent/10 text-accent font-medium' 
                      : 'text-foreground hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
