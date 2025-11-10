'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { images } from './imagesFallback'

interface DesktopMenuProps {
  cartItemsCount: number
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none"
    className={`chevron-icon ${isOpen ? 'open' : ''}`}
  >
    <path 
      d="M6 9L12 15L18 9" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

export default function DesktopMenu({ cartItemsCount }: DesktopMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="desktop-menu-container" ref={menuRef}>
      <button 
        className="desktop-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        Menu
        <ChevronIcon isOpen={isOpen} />
      </button>
      
      {isOpen && (
        <div className="desktop-dropdown">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Image src={images.food} alt="Plats" width={18} height={18} />
            Plats
          </Link>
          <Link href="/boissons" onClick={() => setIsOpen(false)}>
            <Image src={images.glass} alt="Boissons" width={18} height={18} />
            Boissons
          </Link>
          <Link href="/panier" onClick={() => setIsOpen(false)}>
            <Image src={images.carts} alt="Panier" width={18} height={18} />
            Panier {cartItemsCount > 0 && `(${cartItemsCount})`}
          </Link>
        </div>
      )}
    </div>
  )
}