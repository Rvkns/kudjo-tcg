'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans select-none ${className}`}
    >
      {/* Dropdown Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded border border-white/10 bg-[#121214] px-3.5 py-2.5 text-xs text-foreground transition-all duration-300 hover:border-bronze/40 focus:border-bronze focus:outline-none cursor-pointer"
      >
        <span className="truncate pr-2 font-medium tracking-wide">
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        {/* Chevron icon */}
        <svg
          className={`h-3 w-3 text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-bronze' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Floating Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-40 mt-1 max-h-60 min-w-full w-max max-w-[320px] overflow-y-auto rounded border border-white/10 bg-[#171513] py-1 shadow-2xl backdrop-blur-md animate-fade-in focus:outline-none scrollbar-thin scrollbar-thumb-neutral-800">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-bronze/10 text-bronze font-semibold'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className="whitespace-nowrap pr-2">{option.label}</span>
                {/* Gold Checkmark icon */}
                {isSelected && (
                  <svg
                    className="h-3.5 w-3.5 text-bronze"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
