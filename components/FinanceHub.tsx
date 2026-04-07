'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { DollarSign, Upload, FileText, CheckCircle2, XCircle, TrendingUp, TrendingDown, MapPin, Users, Building2, Calendar, BarChart3, AlertCircle, Clock, PieChart, Activity, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo } from 'react'
import * as XLSX from 'xlsx'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface Invoice {
  id: string
  refNumber: string
  customer: string
  txnDate: string
  dueDate: string
  location: string
  lineAmount: number
  salesTerm?: string
  taxAmt?: number
  discountAmt?: number
  shipAmt?: number
  deposit?: number
  class?: string
  shipAddrLine1?: string
  shipAddrCity?: string
  shipAddrState?: string
  shipAddrPostalCode?: string
  privateNote?: string
  file_name?: string
}

interface Bill {
  id: string
  refNumber: string
  vendor: string
  txnDate: string
  dueDate: string
  location: string
  expenseAmount: number
  lineAmount: number
  salesTerm?: string
  expenseAccount?: string
  expenseDesc?: string
  expenseBillableStatus?: string
  lineBillableStatus?: string
  expenseClass?: string
  privateNote?: string
  file_name?: string
}

export default function FinanceHub() {
  const { user, isAdmin, isOwner } = useAuth()
  const canViewFinanceAdmin = isAdmin || isOwner
  const { showNotification } = useNotification()
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)
  const [isUploadingBill, setIsUploadingBill] = useState(false)
  const [invoiceFileName, setInvoiceFileName] = useState<string | null>(null)
  const [billFileName, setBillFileName] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [hiddenSections, setHiddenSections] = useState<Record<string, boolean>>({
    invoices: true,
    bills: true
  })
  const [isHealthScoreExpanded, setIsHealthScoreExpanded] = useState(false)
  const invoiceFileInputRef = useRef<HTMLInputElement>(null)
  const billFileInputRef = useRef<HTMLInputElement>(null)

  const toggleSection = (sectionId: string) => {
    setHiddenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Load existing data on mount
  useEffect(() => {
    if (user?.email) {
      loadFinanceData()
    }
  }, [user?.email])

  const loadFinanceData = async () => {
    if (!user?.email) return

      setLoading(true)
    try {
      // Load invoices
      const invoicesResponse = await fetch('/api/finance/invoices', {
        headers: {
          'Authorization': `Bearer ${user.email}`,
        },
      })

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        // Transform snake_case to camelCase for display
        const transformedInvoices = (invoicesData.invoices || []).map((inv: any) => ({
          id: inv.id,
          refNumber: inv.ref_number || inv.refNumber,
          customer: inv.customer,
          txnDate: inv.txn_date || inv.txnDate,
          dueDate: inv.due_date || inv.dueDate,
          location: inv.location,
          lineAmount: inv.line_amount || inv.lineAmount || 0,
          salesTerm: inv.sales_term || inv.salesTerm,
          taxAmt: inv.tax_amt || inv.taxAmt || 0,
          discountAmt: inv.discount_amt || inv.discountAmt || 0,
          shipAmt: inv.ship_amt || inv.shipAmt || 0,
          deposit: inv.deposit || 0,
          class: inv.class || inv.class_field,
          shipAddrLine1: inv.ship_addr_line1 || inv.shipAddrLine1,
          shipAddrCity: inv.ship_addr_city || inv.shipAddrCity,
          shipAddrState: inv.ship_addr_state || inv.shipAddrState,
          shipAddrPostalCode: inv.ship_addr_postal_code || inv.shipAddrPostalCode,
          privateNote: inv.private_note || inv.privateNote,
        }))
        setInvoices(transformedInvoices)
        if (invoicesData.fileName) {
          setInvoiceFileName(invoicesData.fileName)
        }
      }

      // Load bills
      const billsResponse = await fetch('/api/finance/bills', {
        headers: {
          'Authorization': `Bearer ${user.email}`,
        },
      })

      if (billsResponse.ok) {
        const billsData = await billsResponse.json()
        // Transform snake_case to camelCase for display
        const transformedBills = (billsData.bills || []).map((bill: any) => ({
          id: bill.id,
          refNumber: bill.ref_number || bill.refNumber,
          vendor: bill.vendor,
          txnDate: bill.txn_date || bill.txnDate,
          dueDate: bill.due_date || bill.dueDate,
          location: bill.location,
          expenseAmount: bill.expense_amount || bill.expenseAmount || 0,
          lineAmount: bill.line_amount || bill.lineAmount || 0,
          salesTerm: bill.sales_term || bill.salesTerm,
          expenseAccount: bill.expense_account || bill.expenseAccount,
          expenseDesc: bill.expense_desc || bill.expenseDesc,
          expenseBillableStatus: bill.expense_billable_status || bill.expenseBillableStatus,
          lineBillableStatus: bill.line_billable_status || bill.lineBillableStatus,
          expenseClass: bill.expense_class || bill.expenseClass,
          privateNote: bill.private_note || bill.privateNote,
        }))
        setBills(transformedBills)
        if (billsData.fileName) {
          setBillFileName(billsData.fileName)
        }
      }
    } catch (error) {
      console.error('Error loading finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseInvoiceFile = async (file: File): Promise<any[]> => {
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')

    let headers: string[] = []
    let rows: any[][] = []

    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have a header row and at least one data row')
      }
      
      headers = (jsonData[0] as any[]).map((h: any) => String(h ?? '').trim())
      rows = jsonData.slice(1)
    } else if (isCSV) {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row')
      }
      
      // Parse CSV with proper handling of quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = i + 1 < line.length ? line[i + 1] : null
          
          if (char === '"') {
            // Handle escaped quotes ("")
            if (nextChar === '"' && inQuotes) {
              current += '"'
              i++ // Skip next quote
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            // Remove surrounding quotes if present
            const value = current.trim()
            result.push(value.replace(/^"(.*)"$/, '$1'))
            current = ''
          } else {
            current += char
          }
        }
        // Handle last field
        const value = current.trim()
        result.push(value.replace(/^"(.*)"$/, '$1'))
        return result
      }
      
      headers = parseCSVLine(lines[0])
      rows = lines.slice(1).map(parseCSVLine)
    } else {
      throw new Error('Unsupported file format. Please upload a CSV or Excel file.')
    }

    // Map headers to lowercase for easier matching
    const headerMap: Record<string, number> = {}
    headers.forEach((h, idx) => {
      const cleanHeader = h.trim().replace(/^["']|["']$/g, '') // Remove any remaining quotes
      headerMap[cleanHeader.toLowerCase()] = idx
    })

    const invoices: any[] = []
    
    rows.forEach((row) => {
      if (row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
        return // Skip empty rows
      }

      const getValue = (key: string): string => {
        const idx = headerMap[key.toLowerCase()]
        return idx !== undefined && row[idx] !== undefined ? String(row[idx] || '').trim() : ''
      }

      const getNumericValue = (key: string): number | null => {
        const value = getValue(key)
        if (!value) return null
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''))
        return isNaN(num) ? null : num
      }

      const getDateValue = (key: string): string | null => {
        const value = getValue(key)
        if (!value) return null
        // Handle MM/DD/YYYY format (common in CSV exports)
        const dateMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        if (dateMatch) {
          const [, month, day, year] = dateMatch
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        }
        // Fallback to standard Date parsing
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
      }

      const invoice = {
        invoice_id: getValue('id'),
        ref_number: getValue('refnumber'),
        customer: getValue('customer'),
        txn_date: getDateValue('txndate'),
        due_date: getDateValue('duedate'),
        ship_date: getDateValue('shipdate'),
        ship_method_name: getValue('shipmethodname'),
        tracking_num: getValue('trackingnum'),
        sales_term: getValue('saleterm') || getValue('sales_term'),
        location: getValue('location'),
        class: getValue('class'),
        bill_addr_line1: getValue('billaddrline1'),
        bill_addr_line2: getValue('billaddrline2'),
        bill_addr_line3: getValue('billaddrline3'),
        bill_addr_line4: getValue('billaddrline4'),
        bill_addr_city: getValue('billaddrcity'),
        bill_addr_state: getValue('billaddrstate'),
        bill_addr_postal_code: getValue('billaddrpostalcode'),
        bill_addr_country: getValue('billaddrcountry'),
        ship_addr_line1: getValue('shipaddrline1'),
        ship_addr_line2: getValue('shipaddrline2'),
        ship_addr_line3: getValue('shipaddrline3'),
        ship_addr_line4: getValue('shipaddrline4'),
        ship_addr_city: getValue('shipaddrcity'),
        ship_addr_state: getValue('shipaddrstate'),
        ship_addr_postal_code: getValue('shipaddrpostalcode'),
        ship_addr_country: getValue('shipaddrcountry'),
        private_note: getValue('privatenote'),
        msg: getValue('msg'),
        bill_email: getValue('billemail'),
        currency: getValue('currency') || 'USD',
        exchange_rate: getNumericValue('exchangerate'),
        tax_rate: getValue('taxrate'),
        tax_amt: getNumericValue('taxamt'),
        discount_taxable: getValue('discounttaxable')?.toLowerCase() === 'true',
        deposit: getNumericValue('deposit'),
        to_be_printed: getValue('tobeprinted')?.toLowerCase() === 'notset' ? false : getValue('tobeprinted')?.toLowerCase() === 'true',
        to_be_emailed: getValue('tobeemailed')?.toLowerCase() === 'notset' ? false : getValue('tobeemailed')?.toLowerCase() === 'true',
        allow_ipn_payment: getValue('allowipnpayment')?.toLowerCase() === 'true',
        allow_online_credit_card_payment: getValue('allowonlinecreditcardpayment')?.toLowerCase() === 'true',
        allow_online_ach_payment: getValue('allowonlineachpayment')?.toLowerCase() === 'true',
        ship_amt: getNumericValue('shipamt'),
        ship_item: getValue('shipitem'),
        discount_amt: getNumericValue('discountamt'),
        discount_rate: getNumericValue('discountrate'),
        line_service_date: getDateValue('lineservicedate'),
        line_item: getValue('lineitem'),
        line_desc: getValue('linedesc'),
        line_qty: getNumericValue('lineqty'),
        line_unit_price: getNumericValue('lineunitprice'),
        line_amount: getNumericValue('lineamount'),
        line_class: getValue('lineclass'),
        line_taxable: getValue('linetaxable'),
        client: getValue('client'),
        file_name: file.name,
      }

      // Only add if we have at least an invoice ID or ref number
      if (invoice.invoice_id || invoice.ref_number) {
        invoices.push(invoice)
      }
    })

    return invoices
  }

  const parseBillFile = async (file: File): Promise<any[]> => {
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')

    let headers: string[] = []
    let rows: any[][] = []

    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have a header row and at least one data row')
      }
      
      headers = (jsonData[0] as any[]).map((h: any) => String(h ?? '').trim())
      rows = jsonData.slice(1)
    } else if (isCSV) {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row')
      }
      
      // Parse CSV with proper handling of quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = i + 1 < line.length ? line[i + 1] : null
          
          if (char === '"') {
            // Handle escaped quotes ("")
            if (nextChar === '"' && inQuotes) {
              current += '"'
              i++ // Skip next quote
        } else {
              inQuotes = !inQuotes
        }
          } else if (char === ',' && !inQuotes) {
            // Remove surrounding quotes if present
            const value = current.trim()
            result.push(value.replace(/^"(.*)"$/, '$1'))
            current = ''
      } else {
            current += char
          }
        }
        // Handle last field
        const value = current.trim()
        result.push(value.replace(/^"(.*)"$/, '$1'))
        return result
      }
      
      headers = parseCSVLine(lines[0])
      rows = lines.slice(1).map(parseCSVLine)
    } else {
      throw new Error('Unsupported file format. Please upload a CSV or Excel file.')
    }

    // Map headers to lowercase for easier matching
    const headerMap: Record<string, number> = {}
    headers.forEach((h, idx) => {
      const cleanHeader = h.trim().replace(/^["']|["']$/g, '') // Remove any remaining quotes
      headerMap[cleanHeader.toLowerCase()] = idx
    })

    const bills: any[] = []
    
    rows.forEach((row) => {
      if (row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
        return // Skip empty rows
      }

      const getValue = (key: string): string => {
        const idx = headerMap[key.toLowerCase()]
        return idx !== undefined && row[idx] !== undefined ? String(row[idx] || '').trim() : ''
      }

      const getNumericValue = (key: string): number | null => {
        const value = getValue(key)
        if (!value) return null
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''))
        return isNaN(num) ? null : num
      }

      const getDateValue = (key: string): string | null => {
        const value = getValue(key)
        if (!value) return null
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
      }

      const bill = {
        bill_id: getValue('id'),
        ref_number: getValue('refnumber'),
        ap_account: getValue('apaccount'),
        vendor: getValue('vendor'),
        print_on_check_name: getValue('printoncheckname'),
        txn_date: getDateValue('txndate'),
        due_date: getDateValue('duedate'),
        sales_term: getValue('saleterm') || getValue('sales_term'),
        location: getValue('location'),
        address_line1: getValue('addressline1'),
        address_line2: getValue('addressline2'),
        address_line3: getValue('addressline3'),
        address_line4: getValue('addressline4'),
        address_city: getValue('addresscity'),
        address_state: getValue('addressstate'),
        address_postal_code: getValue('addresspostalcode'),
        address_country: getValue('addresscountry'),
        private_note: getValue('privatenote'),
        currency: getValue('currency') || 'USD',
        exchange_rate: getNumericValue('exchangerate'),
        expense_account: getValue('expenseaccount'),
        expense_desc: getValue('expensedesc'),
        expense_amount: getNumericValue('expenseamount'),
        expense_billable_status: getValue('expensebillablestatus'),
        expense_billable_entity: getValue('expensebillableentity'),
        expense_class: getValue('expenseclass'),
        line_item: getValue('lineitem'),
        line_desc: getValue('linedesc'),
        line_qty: getNumericValue('lineqty'),
        line_unit_price: getNumericValue('lineunitprice'),
        line_amount: getNumericValue('lineamount'),
        line_billable_status: getValue('linebillablestatus'),
        line_billable_entity: getValue('linebillableentity'),
        line_class: getValue('lineclass'),
        file_name: file.name,
      }

      // Only add if we have at least a bill ID or ref number
      if (bill.bill_id || bill.ref_number) {
        bills.push(bill)
      }
    })

    return bills
  }

  const handleInvoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAdmin) {
      showNotification('Only admin users can upload files', 'error')
      return
    }

    setIsUploadingInvoice(true)
    setInvoiceFileName(null)

    try {
      const invoiceData = await parseInvoiceFile(file)

      const response = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email || ''}`,
        },
        body: JSON.stringify({
          invoices: invoiceData,
          fileName: file.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload invoices')
      }

      setInvoiceFileName(file.name)
      showNotification(`Successfully uploaded ${invoiceData.length} invoices!`, 'success')
      await loadFinanceData()
    } catch (error: any) {
      console.error('Invoice upload error:', error)
      showNotification(`Error uploading invoices: ${error.message}`, 'error')
    } finally {
      setIsUploadingInvoice(false)
      if (invoiceFileInputRef.current) {
        invoiceFileInputRef.current.value = ''
      }
    }
  }

  const handleBillUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAdmin) {
      showNotification('Only admin users can upload files', 'error')
      return
    }

    setIsUploadingBill(true)
    setBillFileName(null)

    try {
      const billData = await parseBillFile(file)

      const response = await fetch('/api/finance/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email || ''}`,
        },
        body: JSON.stringify({
          bills: billData,
          fileName: file.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload bills')
      }

      setBillFileName(file.name)
      showNotification(`Successfully uploaded ${billData.length} bills!`, 'success')
      await loadFinanceData()
    } catch (error: any) {
      console.error('Bill upload error:', error)
      showNotification(`Error uploading bills: ${error.message}`, 'error')
    } finally {
      setIsUploadingBill(false)
      if (billFileInputRef.current) {
        billFileInputRef.current.value = ''
      }
    }
  }

  // Calculate totals and analytics
  const totalInvoices = invoices.reduce((sum, inv) => {
    const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
    return sum + amount
  }, 0)
  const totalBills = bills.reduce((sum, bill) => {
    const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                   (typeof bill.lineAmount === 'number' ? bill.lineAmount : 0)
    return sum + amount
  }, 0)
  const netAmount = totalInvoices - totalBills

  // Shipping addresses breakdown for map
  const shippingAddresses = useMemo(() => {
    const addressMap = new Map<string, { count: number; total: number; city?: string; state?: string; postalCode?: string }>()
    invoices.forEach(inv => {
      const shipAddr = inv.shipAddrLine1
      if (shipAddr && shipAddr.trim()) {
        const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
        const existing = addressMap.get(shipAddr) || { count: 0, total: 0, city: inv.shipAddrCity, state: inv.shipAddrState, postalCode: inv.shipAddrPostalCode }
        addressMap.set(shipAddr, {
          count: existing.count + 1,
          total: existing.total + amount,
          city: existing.city || inv.shipAddrCity,
          state: existing.state || inv.shipAddrState,
          postalCode: existing.postalCode || inv.shipAddrPostalCode
        })
      }
    })
    return Array.from(addressMap.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20) // Top 20 shipping addresses
  }, [invoices])

  // Geocode addresses and prepare map data
  const [mapAddresses, setMapAddresses] = useState<Array<{ address: string; count: number; total: number; lat?: number; lng?: number; city?: string; state?: string }>>([])
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (shippingAddresses.length === 0) return

    // Geocode addresses using Nominatim (OpenStreetMap free geocoding)
    const geocodeAddresses = async () => {
      const geocoded: Array<{ address: string; count: number; total: number; lat?: number; lng?: number; city?: string; state?: string }> = []
      
      for (const item of shippingAddresses.slice(0, 20)) {
        try {
          // Build full address string
          const addressParts = [
            item.address,
            item.city,
            item.state,
            item.postalCode
          ].filter(Boolean)
          
          const fullAddress = addressParts.join(', ')
          
          // Use Nominatim API for geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
            {
              headers: {
                'User-Agent': 'FinanceHub/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data && data.length > 0) {
              geocoded.push({
                ...item,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              })
            } else {
              // If geocoding fails, still add without coordinates
              geocoded.push(item)
            }
          } else {
            geocoded.push(item)
          }
          
          // Rate limiting - Nominatim allows 1 request per second
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error('Error geocoding address:', item.address, error)
          geocoded.push(item)
        }
      }
      
      setMapAddresses(geocoded.filter(addr => addr.lat && addr.lng))
      setIsMapReady(true)
    }

    geocodeAddresses()
  }, [shippingAddresses])

  // Initialize Leaflet CSS
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Fix Leaflet marker icons
    import('leaflet').then(leaflet => {
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    })
  }, [])

  // Location breakdown for invoices (keeping for reference but not displayed)
  const invoiceLocationBreakdown = useMemo(() => {
    const locationMap = new Map<string, { count: number; total: number }>()
    invoices.forEach(inv => {
      const loc = inv.location || 'Unknown'
      const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
      const existing = locationMap.get(loc) || { count: 0, total: 0 }
      locationMap.set(loc, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [invoices])

  // Location breakdown for bills (using ExpenseClass column)
  const billLocationBreakdown = useMemo(() => {
    const locationMap = new Map<string, { count: number; total: number }>()
    bills.forEach(bill => {
      const loc = bill.expenseClass || bill.location || 'Unknown'
      const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                     (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                     (bill.lineAmount || 0))
      const existing = locationMap.get(loc) || { count: 0, total: 0 }
      locationMap.set(loc, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [bills])

  // Top customers
  const topCustomers = useMemo(() => {
    const customerMap = new Map<string, { count: number; total: number }>()
    invoices.forEach(inv => {
      const customer = inv.customer || 'Unknown'
      const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
      const existing = customerMap.get(customer) || { count: 0, total: 0 }
      customerMap.set(customer, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(customerMap.entries())
      .map(([customer, data]) => ({ customer, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [invoices])

  // Top vendors
  const topVendors = useMemo(() => {
    const vendorMap = new Map<string, { count: number; total: number }>()
    bills.forEach(bill => {
      const vendor = bill.vendor || 'Unknown'
      const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                     (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                     (bill.lineAmount || 0))
      const existing = vendorMap.get(vendor) || { count: 0, total: 0 }
      vendorMap.set(vendor, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(vendorMap.entries())
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [bills])

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const invoiceMap = new Map<string, number>()
    const billMap = new Map<string, number>()
    
    invoices.forEach(inv => {
      const date = inv.txnDate
      if (date) {
        const month = date.substring(0, 7) // YYYY-MM
        const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
        invoiceMap.set(month, (invoiceMap.get(month) || 0) + amount)
      }
    })
    
    bills.forEach(bill => {
      const date = bill.txnDate
      if (date) {
        const month = date.substring(0, 7)
        const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                       (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                       (bill.lineAmount || 0))
        billMap.set(month, (billMap.get(month) || 0) + amount)
      }
    })
    
    const allMonths = new Set([...Array.from(invoiceMap.keys()), ...Array.from(billMap.keys())])
    return Array.from(allMonths)
      .sort()
      .map(month => ({
        month,
        invoices: invoiceMap.get(month) || 0,
        bills: billMap.get(month) || 0,
        net: (invoiceMap.get(month) || 0) - (billMap.get(month) || 0)
      }))
      .slice(-6) // Last 6 months
  }, [invoices, bills])

  // Payment status analysis
  const paymentStatus = useMemo(() => {
    const now = new Date()
    const overdue: any[] = []
    const dueSoon: any[] = []
    const upcoming: any[] = []
    
    invoices.forEach(inv => {
      const dueDate = inv.dueDate
      if (dueDate) {
        const due = new Date(dueDate)
        const daysDiff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
        
        if (daysDiff < 0) {
          overdue.push({ ...inv, daysOverdue: Math.abs(daysDiff), amount })
        } else if (daysDiff <= 7) {
          dueSoon.push({ ...inv, daysUntilDue: daysDiff, amount })
        } else if (daysDiff <= 30) {
          upcoming.push({ ...inv, daysUntilDue: daysDiff, amount })
        }
      }
    })
    
    return {
      overdue: overdue.sort((a, b) => b.daysOverdue - a.daysOverdue),
      dueSoon: dueSoon.sort((a, b) => a.daysUntilDue - b.daysUntilDue),
      upcoming: upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue),
      overdueTotal: overdue.reduce((sum, inv) => sum + inv.amount, 0),
      dueSoonTotal: dueSoon.reduce((sum, inv) => sum + inv.amount, 0),
      upcomingTotal: upcoming.reduce((sum, inv) => sum + inv.amount, 0),
    }
  }, [invoices])

  // Financial metrics
  const financialMetrics = useMemo(() => {
    const avgInvoiceAmount = invoices.length > 0 ? totalInvoices / invoices.length : 0
    const avgBillAmount = bills.length > 0 ? totalBills / bills.length : 0
    const profitMargin = totalInvoices > 0 ? ((netAmount / totalInvoices) * 100) : 0
    const billToInvoiceRatio = totalInvoices > 0 ? (totalBills / totalInvoices) * 100 : 0
    
    // Payment terms analysis (average days from TxnDate to DueDate)
    let totalPaymentDays = 0
    let paymentDaysCount = 0
    invoices.forEach(inv => {
      const txnDate = inv.txnDate
      const dueDate = inv.dueDate
      if (txnDate && dueDate) {
        const txn = new Date(txnDate)
        const due = new Date(dueDate)
        const daysDiff = Math.floor((due.getTime() - txn.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0) {
          totalPaymentDays += daysDiff
          paymentDaysCount++
        }
      }
    })
    const avgPaymentTerms = paymentDaysCount > 0 ? totalPaymentDays / paymentDaysCount : 0

    // Tax analysis
    const totalTax = invoices.reduce((sum, inv) => {
      const tax = typeof inv.taxAmt === 'number' ? inv.taxAmt : 0
      return sum + tax
    }, 0)
    const taxPercentage = totalInvoices > 0 ? (totalTax / totalInvoices) * 100 : 0

    // Discount analysis
    const totalDiscount = invoices.reduce((sum, inv) => {
      const discount = typeof inv.discountAmt === 'number' ? inv.discountAmt : 0
      return sum + discount
    }, 0)
    const discountPercentage = totalInvoices > 0 ? (totalDiscount / totalInvoices) * 100 : 0

    // Shipping costs
    const totalShipping = invoices.reduce((sum, inv) => {
      const shipping = typeof inv.shipAmt === 'number' ? inv.shipAmt : 0
      return sum + shipping
    }, 0)

    // Billable vs Non-Billable analysis
    const billableBills = bills.filter(bill => {
      const billableStatus = bill.expenseBillableStatus || bill.lineBillableStatus
      return billableStatus && billableStatus.toLowerCase() !== 'notbillable'
    })
    const billableTotal = billableBills.reduce((sum, bill) => {
      const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                     (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                     (bill.lineAmount || 0))
      return sum + amount
    }, 0)
    const billablePercentage = totalBills > 0 ? (billableTotal / totalBills) * 100 : 0

    // Deposits received
    const totalDeposits = invoices.reduce((sum, inv) => {
      const deposit = typeof inv.deposit === 'number' ? inv.deposit : (inv.deposit || 0)
      return sum + deposit
    }, 0)
    
    return {
      avgInvoiceAmount,
      avgBillAmount,
      profitMargin,
      billToInvoiceRatio,
      avgPaymentTerms,
      totalTax,
      taxPercentage,
      totalDiscount,
      discountPercentage,
      totalShipping,
      billablePercentage,
      billableTotal,
      totalDeposits,
    }
  }, [invoices, bills, totalInvoices, totalBills, netAmount])

  // Sales terms breakdown
  const salesTermsBreakdown = useMemo(() => {
    const termsMap = new Map<string, { count: number; total: number }>()
    invoices.forEach(inv => {
      const term = inv.salesTerm || 'Unknown'
      const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
      const existing = termsMap.get(term) || { count: 0, total: 0 }
      termsMap.set(term, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(termsMap.entries())
      .map(([term, data]) => ({ term, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [invoices])

  // Expense account breakdown
  const expenseAccountBreakdown = useMemo(() => {
    const accountMap = new Map<string, { count: number; total: number }>()
    bills.forEach(bill => {
      const account = bill.expenseAccount || 'Unknown'
      const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                     (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                     (bill.lineAmount || 0))
      const existing = accountMap.get(account) || { count: 0, total: 0 }
      accountMap.set(account, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(accountMap.entries())
      .map(([account, data]) => ({ account, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [bills])

  // Store/Class breakdown for invoices
  const invoiceStoreBreakdown = useMemo(() => {
    const storeMap = new Map<string, { count: number; total: number }>()
    invoices.forEach(inv => {
      const store = inv.class || 'Unknown'
      const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
      const existing = storeMap.get(store) || { count: 0, total: 0 }
      storeMap.set(store, {
        count: existing.count + 1,
        total: existing.total + amount
      })
    })
    return Array.from(storeMap.entries())
      .map(([store, data]) => ({ store, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [invoices])

  // Private Note breakdown (from both invoices and bills)
  const privateNoteBreakdown = useMemo(() => {
    const noteMap = new Map<string, { count: number; total: number }>()
    
    // Process invoices
    invoices.forEach(inv => {
      const note = inv.privateNote
      if (note && note.trim()) {
        const amount = typeof inv.lineAmount === 'number' ? inv.lineAmount : 0
        const existing = noteMap.get(note) || { count: 0, total: 0 }
        noteMap.set(note, {
          count: existing.count + 1,
          total: existing.total + amount
        })
      }
    })
    
    // Process bills
    bills.forEach(bill => {
      const note = bill.privateNote
      if (note && note.trim()) {
        const amount = typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                       (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                       (bill.lineAmount || 0))
        const existing = noteMap.get(note) || { count: 0, total: 0 }
        noteMap.set(note, {
          count: existing.count + 1,
          total: existing.total + amount
        })
      }
    })
    
    return Array.from(noteMap.entries())
      .map(([note, data]) => ({ note, ...data }))
      .sort((a, b) => b.count - a.count) // Sort by count first
  }, [invoices, bills])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Finance Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <DollarSign className="text-blue-600" size={32} />
              Finance Hub
            </h1>
            <p className="text-gray-600">Upload and manage invoices and bills</p>
          </div>
        </div>
      </div>

      {/* Colorful Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Invoices Card */}
        <div 
          className="rounded-xl p-6 shadow-lg text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: '1px solid #16a34a',
          }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-white/90 mb-1 uppercase tracking-wide">Total Invoices</p>
              <p className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(totalInvoices)}
              </p>
              <p className="text-xs text-white/80 mt-1">{invoices.length.toLocaleString()} invoices</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <TrendingUp className="text-white" size={32} />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        </div>

        {/* Total Bills Card */}
        <div 
          className="rounded-xl p-6 shadow-lg text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: '1px solid #dc2626',
          }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-white/90 mb-1 uppercase tracking-wide">Total Bills</p>
              <p className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(totalBills)}
              </p>
              <p className="text-xs text-white/80 mt-1">{bills.length.toLocaleString()} bills</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <FileText className="text-white" size={32} />
          </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        </div>

        {/* Net Amount Card */}
        <div 
          className={`rounded-xl p-6 shadow-lg text-white relative overflow-hidden ${
            netAmount >= 0 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600' 
              : 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-600'
          }`}
          style={{
            background: netAmount >= 0 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: `1px solid ${netAmount >= 0 ? '#2563eb' : '#ea580c'}`,
          }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-white/90 mb-1 uppercase tracking-wide">Net Amount</p>
              <p className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(netAmount)}
              </p>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                {netAmount >= 0 ? (
                  <>
                    <TrendingUp size={14} /> Positive cash flow
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} /> Negative cash flow
                  </>
                )}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <DollarSign className="text-white" size={32} />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      {invoices.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Target className="text-purple-600" size={20} />
              </div>
              </div>
              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Avg Invoice</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(financialMetrics.avgInvoiceAmount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Target className="text-orange-600" size={20} />
                </div>
              </div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Avg Bill</p>
              <p className="text-2xl font-bold text-orange-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(financialMetrics.avgBillAmount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-indigo-200 rounded-lg">
                  <PieChart className="text-indigo-600" size={20} />
                </div>
              </div>
              <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-1">Profit Margin</p>
              <p className={`text-2xl font-bold ${financialMetrics.profitMargin >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                {financialMetrics.profitMargin.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-teal-200 rounded-lg">
                  <Activity className="text-teal-600" size={20} />
            </div>
          </div>
              <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">Bill/Invoice Ratio</p>
              <p className="text-2xl font-bold text-teal-900">
                {financialMetrics.billToInvoiceRatio.toFixed(1)}%
              </p>
            </div>
          </div>

                  </>
                )}

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <BarChart3 className="text-blue-600" size={24} />
            Monthly Trends (Last 6 Months)
          </h3>
          <div className="space-y-4">
            {monthlyTrends.map((month, idx) => {
              const maxValue = Math.max(...monthlyTrends.map(m => Math.max(m.invoices, m.bills)))
              const invoiceWidth = maxValue > 0 ? (month.invoices / maxValue) * 100 : 0
              const billWidth = maxValue > 0 ? (month.bills / maxValue) * 100 : 0
              const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{monthName}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-medium">
                        Invoices: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(month.invoices)}
                      </span>
                      <span className="text-red-600 font-medium">
                        Bills: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(month.bills)}
                      </span>
                      <span className={`font-bold ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Net: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(month.net)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                    {invoiceWidth > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${invoiceWidth}%`, minWidth: invoiceWidth > 5 ? 'auto' : '0' }}
                      >
                        {invoiceWidth > 15 && (
                          <span className="text-white text-xs font-semibold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(month.invoices)}
                          </span>
                        )}
                      </div>
                    )}
                    {billWidth > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 flex items-center justify-start pl-2"
                        style={{ width: `${billWidth}%`, minWidth: billWidth > 5 ? 'auto' : '0' }}
                      >
                        {billWidth > 15 && (
                          <span className="text-white text-xs font-semibold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(month.bills)}
                          </span>
                        )}
                      </div>
                    )}
                    {invoiceWidth === 0 && billWidth === 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No data</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}

      {/* Payment Status Alerts */}
      {(paymentStatus.overdue.length > 0 || paymentStatus.dueSoon.length > 0 || topVendors.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue Invoices */}
          {paymentStatus.overdue.length > 0 && (
            <div className="bg-white border-2 border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-red-800">
                  <AlertCircle className="text-red-600" size={24} />
                  Overdue Invoices
                </h3>
                <div className="px-3 py-1 bg-red-100 rounded-full">
                  <span className="text-sm font-bold text-red-700">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(paymentStatus.overdueTotal)}
                  </span>
      </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {paymentStatus.overdue.map((inv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{inv.customer}</span>
                        <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded">
                          {inv.daysOverdue} days overdue
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">Ref: {inv.refNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(inv.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Invoices */}
          {paymentStatus.dueSoon.length > 0 && (
            <div className="bg-white border-2 border-yellow-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-800">
                  <Clock className="text-yellow-600" size={24} />
                  Due Soon (Next 7 Days)
                </h3>
                <div className="px-3 py-1 bg-yellow-100 rounded-full">
                  <span className="text-sm font-bold text-yellow-700">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(paymentStatus.dueSoonTotal)}
                  </span>
            </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {paymentStatus.dueSoon.map((inv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{inv.customer}</span>
                        <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                          Due in {inv.daysUntilDue} days
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">Ref: {inv.refNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(inv.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}

          {/* Private Notes Breakdown */}
          {privateNoteBreakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="text-indigo-600" size={20} />
                </div>
                Private Notes
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {privateNoteBreakdown.map((item, idx) => {
                  const percentage = (invoices.length + bills.length) > 0 
                    ? (item.count / (invoices.length + bills.length)) * 100 
                    : 0
                  return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <p className="text-sm text-gray-800 flex-1 break-words leading-relaxed font-medium">
                          {item.note}
                        </p>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold text-indigo-600">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(item.total)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(percentage, 2)}%`,
                              background: `linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)`,
                            }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-medium">
                            {item.count} {item.count === 1 ? 'item' : 'items'}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {percentage.toFixed(1)}% of total
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Vendors */}
          {topVendors.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
                <Building2 className="text-purple-600" size={20} />
                Top Vendors
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {topVendors.map((item, idx) => {
                  const percentage = totalBills > 0 ? (item.total / totalBills) * 100 : 0
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, #a855f7 0%, #9333ea 100%)`,
                            }}
                          ></div>
                          <span className="text-xs font-medium text-gray-800 truncate">{item.vendor}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-4">{item.count} bills</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-purple-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(item.total)}
                        </div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
                </div>
              )}
                </div>
              )}

      {/* Financial Health Indicator */}
      {invoices.length > 0 && (() => {
        const calculateHealthScore = () => {
          let score = 100
          const breakdown = {
            baseScore: 100,
            profitMarginDeduction: 0,
            overdueDeduction: 0,
            cashFlowDeduction: 0,
            finalScore: 100
          }
          
          // Profit margin deduction
          if (financialMetrics.profitMargin < 0) {
            breakdown.profitMarginDeduction = 30
            score -= 30
          } else if (financialMetrics.profitMargin < 10) {
            breakdown.profitMarginDeduction = 15
            score -= 15
          }
          
          // Overdue deduction
          if (paymentStatus.overdueTotal > totalInvoices * 0.1) {
            breakdown.overdueDeduction = 20
            score -= 20
          }
          
          // Cash flow deduction
          if (netAmount < 0) {
            breakdown.cashFlowDeduction = 25
            score -= 25
          }
          
          breakdown.finalScore = Math.max(0, Math.min(100, score))
          return { score, breakdown }
        }
        
        const { score, breakdown } = calculateHealthScore()
        const status = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention'
        
        return (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Zap className="text-yellow-300" size={24} />
                    Financial Health Score
                  </h3>
                  <button
                    onClick={() => setIsHealthScoreExpanded(!isHealthScoreExpanded)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isHealthScoreExpanded ? (
                      <>
                        <ChevronUp size={18} />
                        <span>Hide Details</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        <span>Show Details</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-white/90 mb-4">
                  Based on profit margin, payment status, and cash flow
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {score}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Status</div>
                    <div className="text-white/80">{status}</div>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm text-white/80 mb-2">Key Metrics</div>
                <div className="space-y-1 text-xs">
                  <div>Profit Margin: {financialMetrics.profitMargin.toFixed(1)}%</div>
                  <div>Overdue: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(paymentStatus.overdueTotal)}</div>
                  <div>Cash Flow: {netAmount >= 0 ? 'Positive' : 'Negative'}</div>
                </div>
              </div>
            </div>
            
            {isHealthScoreExpanded && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-sm font-semibold mb-3">Score Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-white/90">Starting Score</span>
                    <span className="font-bold">100</span>
                  </div>
                  
                  {breakdown.profitMarginDeduction > 0 && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div>
                        <span className="text-white/90">Profit Margin Penalty</span>
                        <div className="text-xs text-white/70 mt-0.5">
                          {financialMetrics.profitMargin < 0 
                            ? `Negative profit margin (${financialMetrics.profitMargin.toFixed(1)}%)`
                            : `Low profit margin (${financialMetrics.profitMargin.toFixed(1)}% < 10%)`}
                        </div>
                      </div>
                      <span className="font-bold text-red-200">-{breakdown.profitMarginDeduction}</span>
                    </div>
                  )}
                  
                  {breakdown.overdueDeduction > 0 && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div>
                        <span className="text-white/90">Overdue Invoices Penalty</span>
                        <div className="text-xs text-white/70 mt-0.5">
                          Overdue amount ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(paymentStatus.overdueTotal)}) exceeds 10% of total invoices
                        </div>
                      </div>
                      <span className="font-bold text-red-200">-{breakdown.overdueDeduction}</span>
                    </div>
                  )}
                  
                  {breakdown.cashFlowDeduction > 0 && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div>
                        <span className="text-white/90">Negative Cash Flow Penalty</span>
                        <div className="text-xs text-white/70 mt-0.5">
                          Net amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(netAmount)}
                        </div>
                      </div>
                      <span className="font-bold text-red-200">-{breakdown.cashFlowDeduction}</span>
                    </div>
                  )}
                  
                  {breakdown.profitMarginDeduction === 0 && breakdown.overdueDeduction === 0 && breakdown.cashFlowDeduction === 0 && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <span className="text-white/90">No deductions applied</span>
                      <span className="font-bold text-green-200">✓</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-3 mt-2 border-2 border-white/30">
                    <span className="font-semibold">Final Score</span>
                    <span className="text-2xl font-bold">{breakdown.finalScore}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Quick Stats Grid */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {invoices.length.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-blue-600 uppercase">Total Invoices</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700 mb-1">
              {bills.length.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-red-600 uppercase">Total Bills</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {topVendors.length}
            </div>
            <div className="text-xs font-medium text-purple-600 uppercase">Top Vendors</div>
          </div>
            </div>
          )}

      {/* Store/Class Breakdown */}
      {invoiceStoreBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
            <Building2 className="text-blue-600" size={20} />
            Invoice Breakdown by Store/Class
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {invoiceStoreBreakdown.slice(0, 10).map((item, idx) => {
              const percentage = totalInvoices > 0 ? (item.total / totalInvoices) * 100 : 0
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">{item.store || 'Unknown'}</span>
                    <span className="text-xs font-bold text-blue-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(item.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.count} invoices</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expense Account Breakdown */}
      {expenseAccountBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
            <BarChart3 className="text-red-600" size={20} />
            Expense Account Breakdown
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenseAccountBreakdown.slice(0, 10).map((item, idx) => {
              const percentage = totalBills > 0 ? (item.total / totalBills) * 100 : 0
              // Remove leading numbers and clean up the account name
              const cleanAccountName = (item.account || 'Unknown')
                .replace(/^\d+\s+/, '') // Remove leading numbers followed by space
                .replace(/^\d+/, '') // Remove any remaining leading numbers
                .trim()
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 truncate">{cleanAccountName || 'Unknown'}</span>
                    <span className="text-xs font-bold text-red-600 flex-shrink-0 ml-2">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(item.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, #ef4444 0%, #dc2626 100%)`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.count} bills</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shipping Addresses Map & Top Bill Locations Side by Side */}
      {(shippingAddresses.length > 0 || billLocationBreakdown.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Addresses Map */}
          {shippingAddresses.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
                <MapPin className="text-green-600" size={20} />
                Top Shipping Addresses
              </h3>
              {isMapReady && mapAddresses.length > 0 ? (
                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
                  <MapContainer
                    center={mapAddresses.length > 0 ? [
                      mapAddresses.reduce((sum, addr) => sum + (addr.lat || 0), 0) / mapAddresses.length,
                      mapAddresses.reduce((sum, addr) => sum + (addr.lng || 0), 0) / mapAddresses.length
                    ] : [28.5, -82.0]}
                    zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapAddresses.map((addr, idx) => (
                      addr.lat && addr.lng ? (
                        <Marker key={idx} position={[addr.lat, addr.lng]}>
                          <Popup>
                            <div className="text-sm">
                              <div className="font-semibold mb-1">{addr.address}</div>
                              {addr.city && addr.state && (
                                <div className="text-gray-600 mb-1">{addr.city}, {addr.state}</div>
                              )}
                              <div className="text-green-600 font-bold">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  maximumFractionDigits: 0,
                                }).format(addr.total)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{addr.count} invoices</div>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-64 w-full rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Bill Locations */}
          {billLocationBreakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
                <MapPin className="text-red-600" size={20} />
                Top Bill Locations
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {billLocationBreakdown.slice(0, 10).map((item, idx) => {
                  const percentage = totalBills > 0 ? (item.total / totalBills) * 100 : 0
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">{item.location || 'Unknown'}</span>
                        <span className="text-xs font-bold text-red-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(item.total)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, #ef4444 0%, #dc2626 100%)`,
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.count} bills</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Upload Section */}
      {canViewFinanceAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="text-blue-600" size={24} />
            Upload Files
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Upload */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="text-green-600" size={20} />
                Invoices
              </h3>
              <div className="space-y-3">
                {isAdmin ? (
                  <>
                    <input
                      ref={invoiceFileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleInvoiceUpload}
                      disabled={isUploadingInvoice}
                      className="hidden"
                      id="invoice-upload"
                    />
                    <label
                      htmlFor="invoice-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingInvoice
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'border-green-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      {isUploadingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          <span className="text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-green-600" size={20} />
                          <span className="text-green-700 font-medium">Upload Invoice File</span>
                        </>
                      )}
                    </label>
                  </>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Read Only
                  </div>
                )}
                {invoiceFileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>{invoiceFileName}</span>
            </div>
                )}
              </div>
                </div>

            {/* Bill Upload */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="text-red-600" size={20} />
                Bills
              </h3>
              <div className="space-y-3">
                {isAdmin ? (
                  <>
                    <input
                      ref={billFileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBillUpload}
                      disabled={isUploadingBill}
                      className="hidden"
                      id="bill-upload"
                    />
                    <label
                      htmlFor="bill-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingBill
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'border-red-300 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      {isUploadingBill ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          <span className="text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-red-600" size={20} />
                          <span className="text-red-700 font-medium">Upload Bill File</span>
                        </>
                      )}
                    </label>
                  </>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Read Only
                  </div>
                )}
                {billFileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="text-red-600" size={16} />
                    <span>{billFileName}</span>
                </div>
              )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between text-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={24} />
              </div>
              <span>Invoices</span>
              <span className="text-green-600">({invoices.length.toLocaleString()})</span>
            </div>
            <button
              onClick={() => toggleSection('invoices')}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {hiddenSections['invoices'] ? (
                <>
                  <ChevronDown size={18} />
                  <span>Show</span>
                </>
              ) : (
                <>
                  <ChevronUp size={18} />
                  <span>Hide</span>
                </>
              )}
            </button>
          </h2>
          {!hiddenSections['invoices'] && (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-green-50 to-green-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ref #</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {invoices.slice(0, 50).map((invoice, idx) => (
                    <tr key={idx} className="hover:bg-green-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {invoice.refNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {invoice.customer}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {invoice.txnDate ? new Date(invoice.txnDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">{invoice.location || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                          currency: 'USD',
                        }).format(typeof invoice.lineAmount === 'number' ? invoice.lineAmount : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoices.length > 50 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing first 50 of {invoices.length.toLocaleString()} invoices
              </p>
            )}
            </>
          )}
        </div>
      )}

      {/* Bills Table */}
      {bills.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between text-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="text-red-600" size={24} />
              </div>
              <span>Bills</span>
              <span className="text-red-600">({bills.length.toLocaleString()})</span>
            </div>
            <button
              onClick={() => toggleSection('bills')}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {hiddenSections['bills'] ? (
                <>
                  <ChevronDown size={18} />
                  <span>Show</span>
                </>
              ) : (
                <>
                  <ChevronUp size={18} />
                  <span>Hide</span>
                </>
              )}
            </button>
          </h2>
          {!hiddenSections['bills'] && (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-50 to-red-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ref #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bills.slice(0, 50).map((bill, idx) => (
                      <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {bill.refNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {bill.vendor}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {bill.txnDate ? new Date(bill.txnDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">{bill.location || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                            currency: 'USD',
                          }).format(
                            typeof bill.expenseAmount === 'number' ? bill.expenseAmount : 
                            (typeof bill.lineAmount === 'number' ? bill.lineAmount : 
                            (bill.lineAmount || 0))
                          )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bills.length > 50 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing first 50 of {bills.length.toLocaleString()} bills
                  </p>
                )}
              </>
            )}
        </div>
      )}

      {invoices.length === 0 && bills.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 text-lg mb-2">No financial data uploaded yet</p>
          <p className="text-gray-500 text-sm">
            {isAdmin
              ? 'Upload invoice and bill files to get started'
              : isOwner
                ? 'Owner view is read-only. An admin must upload financial data.'
                : 'Contact an admin to upload financial data'}
          </p>
        </div>
      )}
    </div>
  )
}
