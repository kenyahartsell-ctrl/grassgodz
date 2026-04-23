import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import BookingMap from '@/components/public/BookingMap';
import PricingCalculator from '@/components/public/PricingCalculator';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BookingPage() {
  const [step, setStep] = useState('location'); // 'location' or 'quote'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddressConfirmed = (address) => {
    setSelectedLocation(address);
    setStep('quote');
    window.scrollTo(0, 0);
  };

  const handleOutsideArea = async (address) => {
    setLoading(true);
    try {
      // Add to waitlist
      await base44.entities.WaitlistEntry.create({
        email: address.fullAddress,
        zip_code: address.fullAddress.split(' ').pop(),
        signed_up_at: new Date().toISOString(),
      });
      toast.success('You\'ve been added to our waitlist!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to add to waitlist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {step === 'location' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Check Your Area</h1>
              <p className="text-muted-foreground text-base">
                Enter your address to see if GrassGodz is available near you, then get an instant quote.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <BookingMap
                onAddressConfirmed={handleAddressConfirmed}
                onOutsideArea={handleOutsideArea}
              />
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-12">
              {[
                { icon: '⚡', title: 'Fast', desc: 'Get a quote in under 60 seconds' },
                { icon: '✓', title: 'Transparent', desc: 'No hidden fees, just honest pricing' },
                { icon: '🔒', title: 'Secure', desc: 'Your location data is encrypted' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <span className="text-3xl mb-2 block">{item.icon}</span>
                  <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'quote' && selectedLocation && (
          <div>
            <button
              onClick={() => setStep('location')}
              className="text-sm font-medium text-primary hover:underline mb-6 flex items-center gap-1"
            >
              ← Change location
            </button>

            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Get Your Instant Quote</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>{selectedLocation.fullAddress}</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <PricingCalculator
                prefilledAddress={{
                  address: selectedLocation.fullAddress,
                  lat: selectedLocation.lat,
                  lng: selectedLocation.lng,
                }}
              />
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}