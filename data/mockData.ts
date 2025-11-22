import type { DashboardData } from '@/context/DataContext'
import { workroomStoreData } from './workroomStoreData'

// Initialize with real workroom/store data
export const initialData: DashboardData = {
  workrooms: workroomStoreData.map((record, index) => ({
    id: `${record.workroom}-${record.store}-${index}`,
    name: record.workroom,
    store: record.store,
    sales: 0,
    laborPO: 0,
    vendorDebit: 0,
  })),
}


