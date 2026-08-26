import type { WorkroomData } from '@/context/DataContext'

function hasVisualFields(workroom: WorkroomData): boolean {
  return (
    workroom.sales != null ||
    workroom.laborPO != null ||
    workroom.vendorDebit != null
  )
}

function hasSurveyFields(workroom: WorkroomData): boolean {
  return (
    workroom.ltrScore != null ||
    workroom.craftScore != null ||
    workroom.profScore != null
  )
}

export function isVisualRecord(workroom: WorkroomData): boolean {
  return hasVisualFields(workroom)
}

export function isSurveyRecord(workroom: WorkroomData): boolean {
  return hasSurveyFields(workroom)
}

export function isOperationalVisualRecord(workroom: WorkroomData): boolean {
  return (
    (workroom.sales != null && workroom.sales > 0) ||
    (workroom.laborPO != null && workroom.laborPO > 0) ||
    (workroom.vendorDebit != null && workroom.vendorDebit !== 0)
  )
}
