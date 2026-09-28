export type Role = 'ADMINISTRATEUR' | 'GESTIONNAIRE' | 'VENDEUR' | 'CONTROLEUR';

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unit: 'kg' | 'pièce' | 'carton' | 'paquet';
  purchasePrice: number; // en CDF
  sellingPrice: number;  // en CDF
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  supplierId?: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'PURCHASE' | 'SALE' | 'LOSS' | 'RETURN' | 'ADJUSTMENT' | 'INVENTORY';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number; // positif pour entrée, négatif pour sortie
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceNumber?: string;
  reason: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  categorySpecialty?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalPurchases: number;
  totalPurchased?: number;
  totalPaid?: number;
  totalDebt: number;
  outstandingDebt?: number;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = 'CASH' | 'AIRTEL_MONEY' | 'M_PESA' | 'ORANGE_MONEY' | 'BANK_TRANSFER';

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  currency?: 'CDF' | 'USD';
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: 'VALIDATED' | 'CANCELLED' | 'COMPLETED' | 'PARTIAL';
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  purchasePrice: number; // pour marge brute
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  currency?: 'CDF' | 'USD';
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;     // Coût d'achat total des articles vendus
  grossMargin: number;   // total - totalCost
  amountPaid: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'ELECTRICITE_CARBURANT'
  | 'EAU'
  | 'ENTRETIEN_HYGIENE'
  | 'SALAIRES'
  | 'MATERIEL_EMBALLAGE'
  | 'ADMINISTRATION'
  | 'AUTRES';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: 'CDF' | 'USD';
  paymentMethod: PaymentMethod;
  reference?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export type LossType = 'DAMAGED' | 'EXPIRED' | 'LOST' | 'THEFT_SUSPECTED' | 'COUNT_DIFFERENCE' | 'OTHER';

export interface Loss {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalValue: number;
  totalLossValue?: number;
  type: LossType;
  reason: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  declaredBy?: string;
  declaredByName?: string;
  reportedBy?: string;
  reportedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  unit?: string;
  theoreticalStock: number;
  physicalStock: number;
  difference: number;
  unitPurchasePrice: number;
  differenceValue: number;
  notes?: string;
  reason?: string;
}

export interface InventorySession {
  id: string;
  sessionNumber: string;
  title?: string;
  status: 'IN_PROGRESS' | 'VALIDATED' | 'REJECTED' | 'DRAFT';
  items: InventoryItem[];
  totalDifferenceValue: number;
  totalDiscrepancyValue?: number;
  notes?: string;
  conductedBy: string;
  conductedByName?: string;
  validatedBy?: string;
  validatedByName?: string;
  createdAt: string;
  validatedAt?: string;
}

export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  salesSummary: {
    count: number;
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
  };
  purchasesSummary: {
    count: number;
    totalPurchases: number;
  };
  expensesSummary: {
    count: number;
    totalExpenses: number;
  };
  lossesSummary: {
    count: number;
    totalLossValue: number;
  };
  netProfitEstimated: number; // grossMargin - totalExpenses - totalLossValue
  stockValueSnapshot: number;
  stockAlertsCount: number;
  generatedAt: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VALIDATE'
  | 'CANCEL'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STOCK_ADJUSTMENT'
  | 'SALE'
  | 'PURCHASE'
  | 'EXPENSE';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: Role;
  action: AuditAction;
  module: string;
  documentId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  currency: 'CDF' | 'USD';
  secondaryCurrency: 'USD' | 'CDF';
  exchangeRate: number; // Ex: 2850 CDF pour 1 USD
  invoicePrefix: string;
  defaultStockThreshold: number;
}
