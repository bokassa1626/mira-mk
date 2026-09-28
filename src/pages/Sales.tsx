import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Receipt,
  Search,
  User,
  CreditCard,
  Printer
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Sale, PaymentMethod } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { InvoiceModal } from '../components/invoices/InvoiceModal.tsx';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const Sales: React.FC = () => {
  const { formatMoney } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Client Comptoir');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Invoice modal
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        api.products.getAll(),
        api.products.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products for the POS catalog
  const filteredProducts = products.filter(p => {
    if (p.status === 'ARCHIVED') return false;
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.currentStock <= 0) {
      setErrorMessage(`Le produit "${product.name}" est en rupture de stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) {
          setErrorMessage(
            `Stock insuffisant pour ${product.name}. Stock actuel: ${product.currentStock} ${product.unit}`
          );
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
      }
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && newQty > prod.currentStock) {
      setErrorMessage(
        `Impossible d'ajouter plus que le stock disponible (${prod.currentStock} ${prod.unit}) pour "${prod.name}".`
      );
      return;
    }

    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid('');
    setErrorMessage(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const effectivePaid = amountPaid === '' ? total : Number(amountPaid) || 0;
  const remaining = Math.max(0, total - effectivePaid);

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim() || 'Client Comptoir',
        items: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        paymentMethod,
        discount: Number(discount) || 0,
        amountPaid: effectivePaid,
        currency: 'CDF',
      };

      const result = await api.sales.create(payload);
      setActiveInvoice(result);
      setIsInvoiceOpen(true);
      clearCart();
      await loadData(); // refresh product stocks
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la validation de la vente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Comptoir de Vente & Caisse (POS)</h1>
          <p className="text-xs text-slate-500">
            Enregistrement instantané des ventes, décrémentation des stocks et émission de factures
          </p>
        </div>
      </div>

      {/* POS Split View: Left Catalog (2/3), Right Cart / Checkout (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Category Filter Pills */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une viande par nom ou code (ex: Filet, BOF-001)..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toutes les viandes
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {loading ? (
              <p className="col-span-3 text-center py-12 text-xs text-slate-400">
                Chargement des produits...
              </p>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Aucune viande trouvée pour cette recherche.
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock =
                  product.currentStock > 0 && product.currentStock <= product.minimumStock;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`p-4 rounded-xl border transition-all select-none flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-md cursor-pointer group'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-slate-500 font-semibold">{product.code}</span>
                        {isOutOfStock ? (
                          <Badge variant="danger" size="sm">
                            Rupture
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" size="sm">
                            Faible ({product.currentStock} {product.unit})
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            {product.currentStock} {product.unit} dispo
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-rose-600 font-mono">
                        {formatMoney(product.sellingPrice)}
                        <span className="text-[10px] text-slate-400 font-normal"> /{product.unit}</span>
                      </span>
                      <button
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Checkout & Cart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-sm text-slate-900">Panier de Vente</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
              >
                Vider
              </button>
            )}
          </div>

          {/* Error notice if insufficient stock */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30 mb-2" />
                <p className="text-xs">Panier vide. Cliquez sur un produit pour l'ajouter.</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {formatMoney(item.unitPrice)} /{item.product.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-1.5 py-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.currentStock}
                        value={item.quantity}
                        onChange={e =>
                          updateQuantity(item.product.id, parseInt(e.target.value) || 0)
                        }
                        className="w-10 text-center font-bold font-mono text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-1.5 py-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold font-mono text-slate-800 w-16 text-right">
                      {formatMoney(item.quantity * item.unitPrice)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Client & Payment Info */}
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nom du Client
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Client Comptoir / Restaurant..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Mode de Paiement
              </label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium cursor-pointer"
                >
                  <option value="CASH">Espèces (Cash CDF/USD)</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="M_PESA">Vodacom M-Pesa</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Remise (CDF)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Montant Versé (CDF)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder={total.toString()}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Summary Details */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Sous-total</span>
              <span className="font-mono">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Remise</span>
                <span className="font-mono">-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>TOTAL</span>
              <span className="font-mono text-rose-600">{formatMoney(total)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Reste à percevoir</span>
                <span className="font-mono">{formatMoney(remaining)}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitSale}
            disabled={cart.length === 0 || submitting}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              cart.length === 0 || submitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Valider la Vente & Facturer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Print & Preview Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={activeInvoice}
      />
    </div>
  );
};
