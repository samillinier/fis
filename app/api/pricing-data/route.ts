import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import * as XLSX from 'xlsx'

interface PricingRow {
  itemNumber: number | string
  itemDescription: string
  itemCost: number // What Lowe's pays
  unit: string
  location: string // Tampa or Ocala
  category: string // Category name
  price30Margin: number // Price needed for 30% margin
  price40Margin: number // Price needed for 40% margin
  price50Margin: number // Price needed for 50% margin
  installerCost: number // Lowe's Cost - 30% Margin
  installerCost40: number // Lowe's Cost - 40% Margin
  installerCost50: number // Lowe's Cost - 50% Margin
  installerProfiles?: { [installerName: string]: number } // Installer pay amounts
  inconsistentPricing?: boolean // Flag if installer pricing doesn't match primary
  primaryInstallerPay?: number // The primary/correct installer pay
}

function calculateMarginPrice(lowesCost: number, marginPercent: number): number {
  if (lowesCost <= 0) return 0
  // Formula: Margin Amount = Lowe's Cost × margin%
  // For 30% margin: Margin Amount = $54 × 0.30 = $16.20
  // For 40% margin: Margin Amount = $54 × 0.40 = $21.60
  // For 50% margin: Margin Amount = $54 × 0.50 = $27.00
  return lowesCost * marginPercent / 100
}

function parseSheetData(
  worksheet: XLSX.WorkSheet,
  location: string,
  category: string
): PricingRow[] {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

  if (data.length < 2) return []

  const rows: PricingRow[] = []
  const headers = data[0]

  // Find column indices
  const itemNumberIdx = headers.findIndex((h: any) =>
    String(h).toLowerCase().includes('item number')
  )
  const itemDescriptionIdx = headers.findIndex((h: any) =>
    String(h).toLowerCase().includes('item description')
  )
  const itemCostIdx = headers.findIndex((h: any) =>
    String(h).toLowerCase().includes('item cost')
  )
  const unitIdx = headers.findIndex((h: any) => String(h).toLowerCase().includes('unit'))

  // Find installer profile columns (any column after Unit that has a name)
  const installerColumns: { name: string; idx: number }[] = []
  for (let i = unitIdx + 1; i < headers.length; i++) {
    const header = String(headers[i] || '').trim()
    if (header && !header.toLowerCase().includes('margin')) {
      installerColumns.push({ name: header, idx: i })
    }
  }

  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const itemNumber = row[itemNumberIdx]
    const itemDescription = String(row[itemDescriptionIdx] || '').trim()
    const itemCost = parseFloat(String(row[itemCostIdx] || '0')) || 0
    const unit = String(row[unitIdx] || '').trim()

    if (!itemNumber && !itemDescription) continue // Skip empty rows

    // Parse installer profiles if they exist
    const installerProfiles: { [installerName: string]: number } = {}
    installerColumns.forEach(({ name, idx }) => {
      const value = parseFloat(String(row[idx] || '0'))
      if (!isNaN(value) && value > 0) {
        installerProfiles[name] = value
      }
    })

    // Determine primary installer pay (first non-zero installer pay, or itemCost if no installers)
    const installerPayValues = Object.values(installerProfiles)
    const primaryInstallerPay =
      installerPayValues.length > 0 ? installerPayValues[0] : itemCost

    // Check for inconsistent pricing
    const inconsistentPricing =
      installerPayValues.length > 1 &&
      installerPayValues.some((val) => Math.abs(val - primaryInstallerPay) > 0.01)

    const price30Margin = calculateMarginPrice(itemCost, 30)
    const price40Margin = calculateMarginPrice(itemCost, 40)
    const price50Margin = calculateMarginPrice(itemCost, 50)
    
    // Calculate installer costs with safety checks to prevent NaN
    const installerCost = isNaN(itemCost) || isNaN(price30Margin) ? 0 : Math.max(0, itemCost - price30Margin)
    const installerCost40 = isNaN(itemCost) || isNaN(price40Margin) ? 0 : Math.max(0, itemCost - price40Margin)
    const installerCost50 = isNaN(itemCost) || isNaN(price50Margin) ? 0 : Math.max(0, itemCost - price50Margin)
    
    rows.push({
      itemNumber,
      itemDescription,
      itemCost,
      unit,
      location,
      category,
      price30Margin,
      price40Margin,
      price50Margin,
      installerCost, // Lowe's Cost - 30% Margin
      installerCost40, // Lowe's Cost - 40% Margin
      installerCost50, // Lowe's Cost - 50% Margin
      installerProfiles: Object.keys(installerProfiles).length > 0 ? installerProfiles : undefined,
      inconsistentPricing,
      primaryInstallerPay,
    })
  }

  return rows
}

export async function GET(request: NextRequest) {
  try {
    // Try multiple possible locations for the Excel file
    const possiblePaths = [
      // Production: public folder
      path.resolve(process.cwd(), 'public', 'Pricing Data.xlsx'),
      // Development: parent folder or project root
      path.resolve(process.cwd(), '..', 'Pricing Data.xlsx'),
      path.resolve(process.cwd(), 'Pricing Data.xlsx'),
      '/Users/it/Documents/Projects/Pricing Data.xlsx',
    ]

    let excelPath: string | null = null
    for (const p of possiblePaths) {
      try {
        await fs.access(p)
        excelPath = p
        break
      } catch {
        // Try next path
      }
    }

    if (!excelPath) {
      return NextResponse.json(
        { error: 'Pricing Data.xlsx not found', tried: possiblePaths },
        { status: 404 }
      )
    }

    // Read file using fs instead of XLSX.readFile for better error handling
    let workbook: XLSX.WorkBook
    try {
      const fileBuffer = await fs.readFile(excelPath)
      workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    } catch (fileError) {
      console.error('Error reading Excel file:', fileError)
      return NextResponse.json(
        {
          error: 'Failed to read Excel file',
          details: fileError instanceof Error ? fileError.message : String(fileError),
          path: excelPath,
        },
        { status: 500 }
      )
    }
    const allData: PricingRow[] = []

    // Process all 12 sheets
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      
      // Extract location and category from sheet name
      let location = ''
      let category = ''
      
      if (sheetName.toUpperCase().startsWith('TAMPA')) {
        location = 'Tampa'
        category = sheetName.replace('Tampa_', '').replace('Tampa ', '')
      } else if (sheetName.toUpperCase().startsWith('OCALA')) {
        location = 'Ocala'
        category = sheetName.replace('OCALA_', '').replace('OCALA ', '')
      } else {
        location = 'Unknown'
        category = sheetName
      }

      // Normalize category names
      category = category
        .replace(/LPR\s*-\s*/gi, 'LPR - ')
        .replace(/FLOOR\s*-\s*/gi, 'FLOOR - ')
        .replace(/_/g, ' ')
        .trim()

      const sheetData = parseSheetData(worksheet, location, category)
      allData.push(...sheetData)
    })

    return NextResponse.json({
      success: true,
      totalRows: allData.length,
      data: allData,
      locations: Array.from(new Set(allData.map((r) => r.location))),
      categories: Array.from(new Set(allData.map((r) => r.category))),
    })
  } catch (error) {
    console.error('Error in GET /api/pricing-data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
