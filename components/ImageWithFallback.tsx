'use client'

import { useState } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

export default function ImageWithFallback({ src, alt, className, style }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // Try to get image from Firebase Storage
      const filename = src.split('/').pop()
      if (filename) {
        const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/menu-et-gestion-stock-ea-14886.firebasestorage.app/o/images%2F${encodeURIComponent(filename)}?alt=media`
        setImgSrc(firebaseUrl)
      }
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  )
}