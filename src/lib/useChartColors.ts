'use client'

import { useState, useEffect } from 'react'

interface ChartColors {
  grid: string
  axis: string
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>({
    grid: '#374151',
    axis: '#9CA3AF'
  })

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      setColors({
        grid: computedStyle.getPropertyValue('--chart-grid').trim() || '#374151',
        axis: computedStyle.getPropertyValue('--chart-axis').trim() || '#9CA3AF'
      })
    }

    // Initial update
    updateColors()

    // Watch for theme changes via class mutations on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateColors()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return colors
}
