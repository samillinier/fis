// District number to district name mapping
// Generated from maps.xlsx (Column D = district number, Column E = location/district name)
// This mapping is used to populate district names in the Q1 tracker

export const districtNameMap: Record<string, string> = {
  '32435': 'LOWE\'S OF BROOKSVILLE, FL',
  '32609': 'LOWE\'S OF BROOKSVILLE, FL',
  '33511': 'LOWE\'S OF BROOKSVILLE, FL',
  '33541': 'LOWE\'S OF BROOKSVILLE, FL',
  '33549': 'LOWE\'S OF BROOKSVILLE, FL',
  '33556': 'LOWE\'S OF BROOKSVILLE, FL',
  '33566': 'LOWE\'S OF BROOKSVILLE, FL',
  '33578': 'LOWE\'S OF BROOKSVILLE, FL',
  '33611': 'LOWE\'S OF BROOKSVILLE, FL',
  '33618': 'LOWE\'S OF BROOKSVILLE, FL',
  '33634': 'LOWE\'S OF BROOKSVILLE, FL',
  '33635': 'LOWE\'S OF BROOKSVILLE, FL',
  '33647': 'LOWE\'S OF BROOKSVILLE, FL',
  '33713': 'LOWE\'S OF BROOKSVILLE, FL',
  '33759': 'LOWE\'S OF BROOKSVILLE, FL',
  '33761': 'LOWE\'S OF BROOKSVILLE, FL',
  '33778': 'LOWE\'S OF BROOKSVILLE, FL',
  '33781': 'LOWE\'S OF BROOKSVILLE, FL',
  '33803': 'LOWE\'S OF BROOKSVILLE, FL',
  '33809': 'LOWE\'S OF BROOKSVILLE, FL',
  '33823': 'LOWE\'S OF BROOKSVILLE, FL',
  '33830': 'LOWE\'S OF BROOKSVILLE, FL',
  '33844': 'LOWE\'S OF BROOKSVILLE, FL',
  '33859': 'LOWE\'S OF BROOKSVILLE, FL',
  '33870': 'LOWE\'S OF BROOKSVILLE, FL',
  '33880': 'LOWE\'S OF BROOKSVILLE, FL',
  '33909': 'LOWE\'S OF BROOKSVILLE, FL',
  '33912': 'LOWE\'S OF BROOKSVILLE, FL',
  '33914': 'LOWE\'S OF BROOKSVILLE, FL',
  '33928': 'LOWE\'S OF BROOKSVILLE, FL',
  '33948': 'LOWE\'S OF BROOKSVILLE, FL',
  '33966': 'LOWE\'S OF BROOKSVILLE, FL',
  '34109': 'LOWE\'S OF BROOKSVILLE, FL',
  '34113': 'LOWE\'S OF BROOKSVILLE, FL',
  '34203': 'LOWE\'S OF BROOKSVILLE, FL',
  '34205': 'LOWE\'S OF BROOKSVILLE, FL',
  '34219': 'LOWE\'S OF BROOKSVILLE, FL',
  '34232': 'LOWE\'S OF BROOKSVILLE, FL',
  '34238': 'LOWE\'S OF BROOKSVILLE, FL',
  '34287': 'LOWE\'S OF BROOKSVILLE, FL',
  '34293': 'LOWE\'S OF BROOKSVILLE, FL',
  '34476': 'LOWE\'S OF BROOKSVILLE, FL',
  '34654': 'LOWE\'S OF BROOKSVILLE, FL',
  '34689': 'LOWE\'S OF BROOKSVILLE, FL',
  '34714': 'LOWE\'S OF BROOKSVILLE, FL',
  '34741': 'LOWE\'S OF BROOKSVILLE, FL',
  '34746': 'LOWE\'S OF BROOKSVILLE, FL',
  '34785': 'LOWE\'S OF BROOKSVILLE, FL',
  '36081': 'LOWE\'S OF BROOKSVILLE, FL',
}

// Get district name for a district number
export function getDistrictName(districtNumber: string): string | null {
  const normalized = String(districtNumber || '').trim().replace(/^district\s*/i, '').trim();
  return districtNameMap[normalized] || null
}

// Get all district numbers
export function getAllDistrictNumbers(): string[] {
  return Object.keys(districtNameMap).sort((a, b) => parseInt(a) - parseInt(b))
}

// Get all district names
export function getAllDistrictNames(): string[] {
  return Object.values(districtNameMap).sort()
}
