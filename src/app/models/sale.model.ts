export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  productName?: string;
}

export interface SaleRecord {
  id: number;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  staffId?: number;
  customerId?: number; // Demo account ownership; older orders may be unassigned.
}