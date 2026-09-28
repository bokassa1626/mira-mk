import {
  User, Product, Category, Supplier, Purchase, Sale,
  Expense, Loss, InventorySession, StockMovement, AuditLog,
  CompanySettings, DailyReport
} from '../src/types/index.ts';

// Initial default settings for Boucherie Mira-Mk
export const initialSettings: CompanySettings = {
  companyName: "Boucherie Mira-Mk",
  address: "Mitipisha, Gécamines, Avenue de Kinshasa, Lubumbashi, RDC",
  phone: "+243 997 000 123 / +243 852 456 789",
  email: "contact@boucheriemiramk.cd",
  currency: "CDF",
  secondaryCurrency: "USD",
  exchangeRate: 2850,
  invoicePrefix: "MK-",
  defaultStockThreshold: 20
};

// Initial Categories
export const initialCategories: Category[] = [
  { id: "cat-1", code: "BOEUF", name: "Viande de Bœuf", description: "Carcasses, filets, viandes avec os et découpes bovines", createdAt: new Date().toISOString() },
  { id: "cat-2", code: "PORC", name: "Viande de Porc", description: "Côtelettes, échines, lard et découpes porcines", createdAt: new Date().toISOString() },
  { id: "cat-3", code: "CHEVRE", name: "Viande de Chèvre", description: "Viande caprine fraîche locale", createdAt: new Date().toISOString() },
  { id: "cat-4", code: "VOLAILLE", name: "Volailles & Poulets", description: "Poulets de chair, pondeuses, découpes et cartons", createdAt: new Date().toISOString() },
  { id: "cat-5", code: "ABATS", name: "Abats & Triperie", description: "Foie, rognons, panse, cœur et abats frais", createdAt: new Date().toISOString() },
  { id: "cat-6", code: "CHARCUTERIE", name: "Saucisses & Charcuterie", description: "Saucisses fraîches Mira-Mk et charcuterie artisanale", createdAt: new Date().toISOString() }
];

// Initial Products
export const initialProducts: Product[] = [
  {
    id: "prod-1",
    code: "BOF-001",
    name: "Filet de Bœuf Supérieur",
    categoryId: "cat-1",
    unit: "kg",
    purchasePrice: 19000,
    sellingPrice: 25000,
    initialStock: 80,
    currentStock: 74,
    minimumStock: 25,
    supplierId: "sup-1",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    code: "BOF-002",
    name: "Viande de Bœuf avec os (Bouillon/Ragout)",
    categoryId: "cat-1",
    unit: "kg",
    purchasePrice: 13500,
    sellingPrice: 17500,
    initialStock: 150,
    currentStock: 122,
    minimumStock: 40,
    supplierId: "sup-1",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    code: "PRC-001",
    name: "Côtelettes de Porc Frais",
    categoryId: "cat-2",
    unit: "kg",
    purchasePrice: 15000,
    sellingPrice: 20000,
    initialStock: 60,
    currentStock: 48,
    minimumStock: 20,
    supplierId: "sup-2",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    code: "CHV-001",
    name: "Viande de Chèvre du Katanga",
    categoryId: "cat-3",
    unit: "kg",
    purchasePrice: 21000,
    sellingPrice: 27000,
    initialStock: 40,
    currentStock: 31,
    minimumStock: 15,
    supplierId: "sup-1",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-5",
    code: "VOL-001",
    name: "Poulet Fermier Entier Éviscéré",
    categoryId: "cat-4",
    unit: "pièce",
    purchasePrice: 14000,
    sellingPrice: 19000,
    initialStock: 50,
    currentStock: 42,
    minimumStock: 20,
    supplierId: "sup-2",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-6",
    code: "SAU-001",
    name: "Saucisses Fraîches Maison Mira-Mk",
    categoryId: "cat-6",
    unit: "kg",
    purchasePrice: 12000,
    sellingPrice: 16500,
    initialStock: 30,
    currentStock: 14, // < 15 -> Stock Faible
    minimumStock: 15,
    supplierId: "sup-1",
    status: "LOW_STOCK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-7",
    code: "ABT-001",
    name: "Foie de Bœuf Frais",
    categoryId: "cat-5",
    unit: "kg",
    purchasePrice: 16000,
    sellingPrice: 21000,
    initialStock: 25,
    currentStock: 7, // < 10 -> Stock Faible
    minimumStock: 10,
    supplierId: "sup-3",
    status: "LOW_STOCK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-8",
    code: "VOL-002",
    name: "Cuisses de Poulet (Carton 10kg)",
    categoryId: "cat-4",
    unit: "carton",
    purchasePrice: 48000,
    sellingPrice: 62000,
    initialStock: 15,
    currentStock: 0, // Rupture de stock
    minimumStock: 5,
    supplierId: "sup-2",
    status: "OUT_OF_STOCK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial Suppliers in Lubumbashi
export const initialSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Élevage & Ferme Agro-Pastorale Biano",
    phone: "+243 971 234 567",
    email: "biano.elevage@gmail.com",
    address: "Plateau des Biano, Route Likasi, Haut-Katanga",
    contactPerson: "M. Dieudonné Kabwe",
    status: "ACTIVE",
    totalPurchases: 4500000,
    totalDebt: 350000,
    createdAt: new Date().toISOString()
  },
  {
    id: "sup-2",
    name: "Ferme Espoir Mwadingusha",
    phone: "+243 812 345 678",
    email: "ferme.espoir.mwa@gmail.com",
    address: "Zone Rurale Mwadingusha, Lubumbashi",
    contactPerson: "Mme Jacqueline Ilunga",
    status: "ACTIVE",
    totalPurchases: 2850000,
    totalDebt: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: "sup-3",
    name: "Abattoir Central Public de Lubumbashi",
    phone: "+243 898 765 432",
    email: "abattoir.lshi@katanga.cd",
    address: "Quartier Industriel, Avenue des Poids Lourds, Lubumbashi",
    contactPerson: "Inspecteur Vétérinaire Jean-Pierre",
    status: "ACTIVE",
    totalPurchases: 1950000,
    totalDebt: 120000,
    createdAt: new Date().toISOString()
  }
];

// Initial Demo Users
export const initialUsers: User[] = [
  {
    uid: "usr-admin",
    email: "admin@miramk.cd",
    firstName: "Bokassa",
    lastName: "Ntwali",
    phone: "+243 997 000 001",
    role: "ADMINISTRATEUR",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    uid: "usr-gestionnaire",
    email: "gestionnaire@miramk.cd",
    firstName: "Moïse",
    lastName: "Kalala",
    phone: "+243 852 000 002",
    role: "GESTIONNAIRE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    uid: "usr-vendeur",
    email: "vendeur@miramk.cd",
    firstName: "Rachel",
    lastName: "Mwamba",
    phone: "+243 814 000 003",
    role: "VENDEUR",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    uid: "usr-controleur",
    email: "controleur@miramk.cd",
    firstName: "Patrick",
    lastName: "Ilunga",
    phone: "+243 901 000 004",
    role: "CONTROLEUR",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

// In-Memory Database store with complete persistence simulation and synchronization
class Store {
  settings: CompanySettings = { ...initialSettings };
  categories: Category[] = [...initialCategories];
  products: Product[] = [...initialProducts];
  suppliers: Supplier[] = [...initialSuppliers];
  users: User[] = [...initialUsers];
  purchases: Purchase[] = [];
  sales: Sale[] = [];
  expenses: Expense[] = [];
  losses: Loss[] = [];
  inventorySessions: InventorySession[] = [];
  stockMovements: StockMovement[] = [];
  auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialTransactions();
  }

  seedInitialTransactions() {
    const today = new Date().toISOString();
    const adminUser = this.users[0];

    // Seed an initial purchase
    const samplePurchase: Purchase = {
      id: "ach-1",
      purchaseNumber: "ACH-2026-0001",
      supplierId: "sup-1",
      supplierName: "Élevage & Ferme Agro-Pastorale Biano",
      currency: "CDF",
      items: [
        { productId: "prod-1", productName: "Filet de Bœuf Supérieur", quantity: 50, unitPrice: 19000, total: 950000 },
        { productId: "prod-2", productName: "Viande de Bœuf avec os (Bouillon/Ragout)", quantity: 70, unitPrice: 13500, total: 945000 }
      ],
      subtotal: 1895000,
      discount: 0,
      total: 1895000,
      amountPaid: 1600000,
      remainingAmount: 295000,
      paymentMethod: "CASH",
      status: "VALIDATED",
      createdBy: adminUser.uid,
      createdByName: `${adminUser.firstName} ${adminUser.lastName}`,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    };
    this.purchases.push(samplePurchase);

    // Initial movement for this purchase
    this.stockMovements.push({
      id: "mvt-1",
      productId: "prod-1",
      productName: "Filet de Bœuf Supérieur",
      type: "PURCHASE",
      quantity: 50,
      previousStock: 30,
      newStock: 80,
      referenceId: samplePurchase.id,
      reason: `Réception Achat ${samplePurchase.purchaseNumber}`,
      userId: adminUser.uid,
      userName: `${adminUser.firstName} ${adminUser.lastName}`,
      createdAt: samplePurchase.createdAt
    });

    // Seed sample sales
    const sampleSale: Sale = {
      id: "vnt-1",
      saleNumber: "MK-2026-0042",
      customerName: "Restaurant Le Gourmet Lubumbashi",
      currency: "CDF",
      items: [
        { productId: "prod-1", productName: "Filet de Bœuf Supérieur", quantity: 6, unitPrice: 25000, purchasePrice: 19000, total: 150000 },
        { productId: "prod-3", productName: "Côtelettes de Porc Frais", quantity: 12, unitPrice: 20000, purchasePrice: 15000, total: 240000 }
      ],
      subtotal: 390000,
      discount: 0,
      total: 390000,
      totalCost: 6 * 19000 + 12 * 15000, // 114000 + 180000 = 294000
      grossMargin: 390000 - 294000, // 96000 CDF
      amountPaid: 390000,
      remainingAmount: 0,
      paymentMethod: "AIRTEL_MONEY",
      status: "COMPLETED",
      createdBy: "usr-vendeur",
      createdByName: "Rachel Mwamba",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    };
    this.sales.push(sampleSale);

    this.stockMovements.push({
      id: "mvt-2",
      productId: "prod-1",
      productName: "Filet de Bœuf Supérieur",
      type: "SALE",
      quantity: -6,
      previousStock: 80,
      newStock: 74,
      referenceId: sampleSale.id,
      reason: `Vente au comptoir ${sampleSale.saleNumber}`,
      userId: "usr-vendeur",
      userName: "Rachel Mwamba",
      createdAt: sampleSale.createdAt
    });

    // Seed sample expenses
    const sampleExpense1: Expense = {
      id: "dep-1",
      category: "ELECTRICITE_CARBURANT",
      description: "Carburant Gazole groupe électrogène chambre froide (50L)",
      amount: 145000,
      currency: "CDF",
      paymentMethod: "CASH",
      reference: "STATION-TOTAL-LSHI-44",
      createdBy: adminUser.uid,
      createdByName: `${adminUser.firstName} ${adminUser.lastName}`,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    };
    const sampleExpense2: Expense = {
      id: "dep-2",
      category: "ENTRETIEN_HYGIENE",
      description: "Désinfectant alimentaire, gants et détergent atelier découpe",
      amount: 42000,
      currency: "CDF",
      paymentMethod: "M_PESA",
      reference: "PHARMA-KATANGA-91",
      createdBy: adminUser.uid,
      createdByName: `${adminUser.firstName} ${adminUser.lastName}`,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
    };
    this.expenses.push(sampleExpense1, sampleExpense2);

    // Seed an audit log
    this.auditLogs.push({
      id: "aud-1",
      userId: adminUser.uid,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: "CREATE",
      module: "SYSTEM",
      documentId: "settings",
      description: "Initialisation du système de gestion pour Boucherie Mira-Mk Lubumbashi",
      createdAt: today
    });
  }

  // Stock calculation formula engine
  // Stock final = Stock initial + Entrées - Ventes - Pertes + Retours ± Ajustements
  recalculateProductStock(productId: string) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    let computedStock = product.initialStock;
    const movements = this.stockMovements.filter(m => m.productId === productId);

    for (const m of movements) {
      computedStock += m.quantity;
    }

    product.currentStock = computedStock;

    if (product.currentStock <= 0) {
      product.status = 'OUT_OF_STOCK';
    } else if (product.currentStock <= product.minimumStock) {
      product.status = 'LOW_STOCK';
    } else {
      product.status = 'AVAILABLE';
    }

    product.updatedAt = new Date().toISOString();
  }

  logAudit(userId: string, userEmail: string, userRole: any, action: any, module: string, docId: string, desc: string, meta?: any) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail,
      userRole,
      action,
      module,
      documentId: docId,
      description: desc,
      metadata: meta,
      createdAt: new Date().toISOString()
    });
  }
}

export const store = new Store();
