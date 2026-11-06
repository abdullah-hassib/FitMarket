export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  id: number;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  staffId?: number;
}