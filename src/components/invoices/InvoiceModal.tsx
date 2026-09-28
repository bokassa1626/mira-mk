import React, { useRef } from 'react';
import { Printer, Download, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { Modal } from '../common/Modal.tsx';
import { Sale } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const { formatMoney } = useAuth();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const saleDate = new Date(sale.createdAt);
  const formattedDate = saleDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = saleDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Facture Officielle ${sale.saleNumber}`}
      subtitle="Boucherie Mira-Mk — Lubumbashi, RDC"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Facture acquittée & enregistrée</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          ref={printAreaRef}
          className="p-8 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-800 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="border-b-2 border-rose-600 pb-5 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-lg">
                  M
                </span>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  Boucherie Mira-Mk
                </h1>
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                <p className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Mitipisha, Gécamines, Avenue de Kinshasa, Lubumbashi, RDC
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  +243 997 000 123 / +243 852 456 789
                </p>
                <p className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  contact@boucheriemiramk.cd
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold tracking-wider uppercase mb-1">
                FACTURE DE VENTE
              </span>
              <p className="text-sm font-black text-slate-900 font-mono">{sale.saleNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date : {formattedDate}</p>
              <p className="text-xs text-slate-500">Heure : {formattedTime}</p>
            </div>
          </div>

          {/* Client & Operator Meta */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Client / Destinataire
              </span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {sale.customerName || 'Client Comptoir'}
              </p>
              <p className="text-slate-500">Vente au comptoir / Découpe fraîche</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Caissier / Opérateur
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {sale.createdByName || 'Service Caisse'}
              </p>
              <p className="text-slate-500 font-medium">Mode : {sale.paymentMethod}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5">Désignation Produit</th>
                  <th className="py-2.5 text-center">Quantité</th>
                  <th className="py-2.5 text-right">Prix Unitaire</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="py-3 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-3 text-right font-mono text-slate-600">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="border-t-2 border-slate-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total :</span>
                <span className="font-mono font-medium">{formatMoney(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise accordée :</span>
                  <span className="font-mono font-semibold">-{formatMoney(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL À PAYER :</span>
                <span className="font-mono text-rose-600">{formatMoney(sale.total)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>Montant Versé :</span>
                <span className="font-mono font-bold">{formatMoney(sale.amountPaid)}</span>
              </div>
              {sale.remainingAmount > 0 ? (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Reste à payer :</span>
                  <span className="font-mono">{formatMoney(sale.remainingAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Reste :</span>
                  <span className="font-mono">0 CDF (Soldé)</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal and Footer */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">
              Merci pour votre confiance chez la Boucherie Mira-Mk !
            </p>
            <p>
              Les marchandises vendues ne sont ni reprises ni échangées après avoir quitté le
              comptoir frigorifique.
            </p>
            <p className="font-mono">Lubumbashi — Haut-Katanga — RDC</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
