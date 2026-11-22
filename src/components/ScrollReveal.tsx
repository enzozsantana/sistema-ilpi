import React, { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  threshold?: number
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Em testes ou ambientes sem IntersectionObserver, exibe de imediato
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const getTransformClass = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0 scale-100'

    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-8 scale-[0.99]'
      case 'down':
        return 'opacity-0 -translate-y-8 scale-[0.99]'
      case 'left':
        return 'opacity-0 translate-x-8'
      case 'right':
        return 'opacity-0 -translate-x-8'
      case 'none':
      default:
        return 'opacity-0 scale-[0.98]'
    }
  }

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
      }}
      className={`transition-all duration-700 ease-out transform ${getTransformClass()} ${className}`}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
