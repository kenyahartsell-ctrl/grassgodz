import { useState } from 'react';
import { CreditCard, Loader2, Lock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import SaveCardModal from './SaveCardModal';

export default function DepositBanner({ job, customerProfile, onDepositPaid }) {
  const [paying, setPaying] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const hasPaymentMethod = !!customerProfile?.default_payment_method_id;

  const doPayDeposit = async (paymentMethodId) => {
    setPaying(true);
    try {
      const res = await base44.functions.invoke('payDeposit', {
        job_id: job.id,
        payment_method_id: paymentMethodId,
      });
      if (res.data?.success) {
        toast.success('Deposit paid! Your job is now open for providers.');
        onDepositPaid?.();
      } else {
        toast.error(res.data?.error || 'Deposit payment failed. Please try again.');
      }
    } catch {
      toast.error('Deposit payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (hasPaymentMethod) {
      doPayDeposit(customerProfile.default_payment_method_id);
    } else {
      setShowCardModal(true);
    }
  };

  return (
    <>
      <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Deposit Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              A 50% deposit of <strong>${job.deposit_amount?.toFixed(2)}</strong> is required for jobs over $200.
              Once paid, your job becomes visible to providers.
            </p>
            <div className="mt-1 text-xs text-amber-600">
              Remaining balance due at completion: <strong>${(job.quoted_price - job.deposit_amount)?.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="mt-3 w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {paying ? (
            <><Loader2 size={14} className="animate-spin" /> Processing...</>
          ) : (
            <><CreditCard size={14} /> Pay ${job.deposit_amount?.toFixed(2)} Deposit</>
          )}
        </button>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-600">
          <Lock size={10} />
          <span>Secure payment — applied toward your total</span>
        </div>
      </div>

      {showCardModal && (
        <SaveCardModal
          customerProfile={customerProfile}
          onClose={() => setShowCardModal(false)}
          onSuccess={(pmId) => {
            setShowCardModal(false);
            doPayDeposit(pmId);
          }}
        />
      )}
    </>
  );
}