'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Download, Loader2, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useNotification } from './NotificationContext'

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportMode, setExportMode] = useState<'current' | 'all' | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { showNotification } = useNotification()

  const getPageTitle = (path?: string) => {
      const titles: Record<string, string> = {
        '/': 'Visual Breakdown',
        '/analytics': 'Workroom Data',
        '/labor': 'Total Sales & Vendor Debit',
        '/performance': 'Performance Index',
        '/store': 'Store Overview',
        '/workroom-summary': 'Workroom Summary',
        '/survey-misc': 'Survey Misc',
      }
    return titles[path || pathname] || 'Dashboard Report'
  }

  const allPages = [
    { path: '/', title: 'Visual Breakdown' },
    { path: '/analytics', title: 'Workroom Data' },
    { path: '/sales', title: 'Sales by Workroom' },
    { path: '/labor', title: 'Total Sales & Vendor Debit' },
    { path: '/performance', title: 'Performance Index' },
    { path: '/store', title: 'Store Overview' },
    { path: '/workroom-summary', title: 'Workroom Summary' },
  ]

  const captureAllPagesInOneView = async (): Promise<HTMLCanvasElement | null> => {
    return new Promise(async (resolve) => {
      const sidebar = document.querySelector('.dashboard-sidebar')
      const header = document.querySelector('.dashboard-header')
      const footer = document.querySelector('.dashboard-footer')
      const mainContent = document.querySelector('.dashboard-main')

      if (!mainContent) {
        resolve(null)
        return
      }

      // Store original visibility
      const sidebarDisplay = sidebar ? (sidebar as HTMLElement).style.display : null
      const headerDisplay = header ? (header as HTMLElement).style.display : null
      const footerDisplay = footer ? (footer as HTMLElement).style.display : null

      // Hide sidebar, header, and footer
      if (sidebar) (sidebar as HTMLElement).style.display = 'none'
      if (header) (header as HTMLElement).style.display = 'none'
      if (footer) (footer as HTMLElement).style.display = 'none'

      // Scroll to top
      mainContent.scrollTop = 0

      // Wait for DOM to update
      await new Promise((r) => setTimeout(r, 500))

      try {
        // Capture the entire main content area (all pages should be visible or scrollable)
        const canvas = await html2canvas(mainContent as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: (mainContent as HTMLElement).scrollWidth,
          windowHeight: (mainContent as HTMLElement).scrollHeight,
          scrollX: 0,
          scrollY: 0,
        })

        // Restore visibility
        if (sidebar) (sidebar as HTMLElement).style.display = sidebarDisplay || ''
        if (header) (header as HTMLElement).style.display = headerDisplay || ''
        if (footer) (footer as HTMLElement).style.display = footerDisplay || ''

        resolve(canvas)
      } catch (error) {
        console.error('Error capturing content:', error)
        // Restore visibility
        if (sidebar) (sidebar as HTMLElement).style.display = sidebarDisplay || ''
        if (header) (header as HTMLElement).style.display = headerDisplay || ''
        if (footer) (footer as HTMLElement).style.display = footerDisplay || ''
        resolve(null)
      }
    })
  }

  const addPageHeader = async (pdf: jsPDF, pageTitle: string, logoDataUrl: string | null, pdfWidth: number) => {
    // Add header
    pdf.setFillColor(128, 135, 93)
    pdf.rect(0, 0, pdfWidth, 25, 'F')

    // Add logo if available
    if (logoDataUrl) {
      try {
        const tempImg = new Image()
        tempImg.src = logoDataUrl
        await new Promise((resolve) => {
          if (tempImg.complete) {
            const logoWidth = 35
            const logoHeight = (tempImg.height / tempImg.width) * logoWidth
            const logoY = (25 - Math.min(logoHeight, 18)) / 2
            pdf.addImage(logoDataUrl, 'PNG', 10, logoY, logoWidth, Math.min(logoHeight, 18))
            resolve(null)
          } else {
            tempImg.onload = () => {
              const logoWidth = 35
              const logoHeight = (tempImg.height / tempImg.width) * logoWidth
              const logoY = (25 - Math.min(logoHeight, 18)) / 2
              pdf.addImage(logoDataUrl, 'PNG', 10, logoY, logoWidth, Math.min(logoHeight, 18))
              resolve(null)
            }
            tempImg.onerror = () => resolve(null)
          }
        })
      } catch (error) {
        console.error('Error adding logo:', error)
      }
    }

    // Add page title and date
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(pageTitle, logoDataUrl ? 50 : 10, 12)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Generated: ${new Date().toLocaleString()}`, logoDataUrl ? 50 : 10, 18)
    pdf.setTextColor(0, 0, 0)
  }

  const loadLogo = async (): Promise<string | null> => {
    try {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = window.location.origin + '/logo.png'

      return new Promise((resolve) => {
        const handleLoad = () => {
          try {
            const logoCanvas = document.createElement('canvas')
            logoCanvas.width = logoImg.width
            logoCanvas.height = logoImg.height
            const ctx = logoCanvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(logoImg, 0, 0)
              resolve(logoCanvas.toDataURL('image/png'))
            } else {
              resolve(null)
            }
          } catch (error) {
            console.error('Error converting logo:', error)
            resolve(null)
          }
        }

        logoImg.onload = handleLoad
        logoImg.onerror = () => resolve(null)
        if (logoImg.complete) handleLoad()
      })
    } catch (error) {
      console.error('Error loading logo:', error)
      return null
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)

    try {
      showNotification('Exporting complete dashboard report...', 'info')

      // Load logo once
      const logoDataUrl = await loadLogo()

      // Capture all content on current page view
      const canvas = await captureAllPagesInOneView()

      if (!canvas) {
        showNotification('Failed to capture dashboard content', 'error')
        setIsExporting(false)
        return
      }

      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth

      // Create PDF - use landscape if content is wider
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight + 30, 297)], // Add space for header
      })

      // Add header with "Complete Dashboard Report"
      await addPageHeader(pdf, 'Complete Dashboard Report', logoDataUrl, pdfWidth)

      // Add content to PDF
      const imgData = canvas.toDataURL('image/png')
      const contentY = 30 // Start after header
      pdf.addImage(imgData, 'PNG', 0, contentY, pdfWidth, pdfHeight)

      // Save PDF
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `fis-complete-report-${dateStr}.pdf`
      pdf.save(filename)

      showNotification('Complete dashboard exported successfully!', 'success')
    } catch (error) {
      console.error('Export error:', error)
      showNotification('Failed to export dashboard. Please try again.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCurrent = async () => {
    setIsExporting(true)
    try {
      // Hide sidebar and header for clean export
      const sidebar = document.querySelector('.dashboard-sidebar')
      const header = document.querySelector('.dashboard-header')
      const footer = document.querySelector('.dashboard-footer')
      const mainContent = document.querySelector('.dashboard-main')

      if (!mainContent) {
        showNotification('Could not find content to export', 'error')
        setIsExporting(false)
        return
      }

      // Store original visibility
      const sidebarDisplay = sidebar ? (sidebar as HTMLElement).style.display : null
      const headerDisplay = header ? (header as HTMLElement).style.display : null
      const footerDisplay = footer ? (footer as HTMLElement).style.display : null

      // Hide sidebar, header, and footer for export
      if (sidebar) (sidebar as HTMLElement).style.display = 'none'
      if (header) (header as HTMLElement).style.display = 'none'
      if (footer) (footer as HTMLElement).style.display = 'none'

      // Wait a bit for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Capture the main content area
      const canvas = await html2canvas(mainContent as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: (mainContent as HTMLElement).scrollWidth,
        windowHeight: (mainContent as HTMLElement).scrollHeight,
      })

      // Restore visibility
      if (sidebar) (sidebar as HTMLElement).style.display = sidebarDisplay || ''
      if (header) (header as HTMLElement).style.display = headerDisplay || ''
      if (footer) (footer as HTMLElement).style.display = footerDisplay || ''

      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth

      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight, 297)], // A4 height is 297mm
      })

      // Load logo and add header
      const logoDataUrl = await loadLogo()
      await addPageHeader(pdf, getPageTitle(), logoDataUrl, pdfWidth)

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png')

      // Add content to PDF
      const contentY = 30 // Start after header (increased for logo)
      pdf.addImage(imgData, 'PNG', 0, contentY, pdfWidth, pdfHeight)

      // Generate filename
      const pageTitleSlug = getPageTitle().toLowerCase().replace(/\s+/g, '-')
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `fis-${pageTitleSlug}-${dateStr}.pdf`

      // Save PDF
      pdf.save(filename)

      showNotification('Report exported successfully!', 'success')
    } catch (error) {
      console.error('Export error:', error)
      showNotification('Failed to export report. Please try again.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleExportCurrent}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        {isExporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Export PDF</span>
          </>
        )}
      </button>
    </div>
  )
}

