import React, { useState, useMemo } from 'react';
import { Search, Mail } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageMeta from '@/components/shared/PageMeta';

const FAQ_DATA = [
  {
    category: "Payments & Billing",
    questions: [
      {
        q: "When am I charged for my service?",
        a: "Payment is authorized and charged at the time you book service, not after the job is completed. This is required to confirm and schedule with your provider."
      },
      {
        q: "Why do I need to keep a card on file?",
        a: "A valid form of payment must remain on file to book or maintain any active service on Grassgodz. Bookings cannot be processed without a card on file."
      },
      {
        q: "Can I remove my card and pay after the service instead at a later date?",
        a: "No. Our policy requires payment at the time of booking for all customers. Removing your card will cancel any pending or upcoming bookings."
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through Stripe, a PCI-compliant payment platform. Grassgodz does not store your card details directly."
      }
    ]
  },
  {
    category: "Booking & Scheduling",
    questions: [
      {
        q: "Will I have to reschedule every time I want service?",
        a: "No. Grassgodz offers weekly, bi-weekly, and monthly lawn services that you can customize according to your lawn's needs."
      },
      {
        q: "How do I know who my provider is?",
        a: "Once you are booked for a service, underneath your scheduled service you will find your provider's photo and provider profile, along with their Grassgodz rating."
      },
      {
        q: "What if I am not happy with the quality of the lawn service?",
        a: "Grassgodz stands by our promise to provide top notch service. If you find that you are not satisfied with the service or would like to leave feedback about your service, our site offers a Quick Fix button that allows you to choose to have the provider return and make things right, choose a new provider for the repair, or receive a discounted price for service."
      },
      {
        q: "What if something is broken by a provider during a job?",
        a: "While these things do unfortunately happen from time to time, each Grassgodz provider is an independent contractor and is required to be insured to cover property damage. Please document any damage immediately with photos and reach out to the provider or contact@grassgodz.com so that repairs can begin quickly."
      },
      {
        q: "What happens if I change my mind and need to reschedule or cancel service?",
        a: "Rescheduling and canceling is super easy. Click into your account, go to Scheduled Services, choose which service you'd like to change or cancel, and you can change the date/time or cancel directly from the app."
      }
    ]
  },
  {
    category: "Cancellations",
    questions: [
      {
        q: "Can I cancel my account with Grassgodz?",
        a: "Yes. Our goal is to make the process as easy as possible for our customers. If for any reason you would like to be removed from our app and no longer receive lawn care with any Grassgodz provider, simply log in to your customer account, scroll to the bottom, and click \"Cancel My Account.\" Once this request is made, your information will be removed from our site and an email will be sent confirming that your account information was securely removed from our site."
      }
    ]
  },
  {
    category: "Providers",
    questions: [
      {
        q: "How do I know who my provider is?",
        a: "Once you are booked for a service, underneath your scheduled service you will find your provider's photo and provider profile, along with their Grassgodz rating."
      },
      {
        q: "What if something is broken by a provider during a job?",
        a: "Each Grassgodz provider is an independent contractor and is required to be insured to cover property damage. Please document any damage immediately with photos and reach out to the provider or contact@grassgodz.com so that repairs can begin quickly."
      },
      {
        q: "What if I am not happy with the quality of the lawn service?",
        a: "Use the Quick Fix button on your scheduled service to have the provider return and make things right, choose a new provider for the repair, or receive a discounted price for the service."
      }
    ]
  }
];

export default function FAQPage() {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return FAQ_DATA;
    const lower = search.toLowerCase();
    
    return FAQ_DATA.map(section => {
      const matchingQ = section.questions.filter(q => 
        q.q.toLowerCase().includes(lower) || q.a.toLowerCase().includes(lower)
      );
      return { ...section, questions: matchingQ };
    }).filter(section => section.questions.length > 0);
  }, [search]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageMeta title="FAQ - GrassGodz" description="Frequently Asked Questions about GrassGodz lawn care services." />
      <PublicNav />
      
      <main className="flex-1 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Find answers to common questions about our services, booking, and more.</p>
          </div>
          
          <div className="sticky top-[73px] z-20 bg-background/95 backdrop-blur-md pb-6 pt-4 border-b border-border">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search questions or keywords..."
                className="pl-10 h-12 text-base rounded-full bg-card shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {!search && (
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {FAQ_DATA.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(`faq-${idx}`)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {section.category}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-8 space-y-12 max-w-3xl mx-auto">
            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No questions found matching "{search}".
              </div>
            ) : (
              filteredData.map((section, idx) => (
                <div key={idx} id={`faq-${idx}`} className="scroll-mt-32">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6 border-b border-border pb-2">
                    {section.category}
                  </h2>
                  <Accordion type="multiple" className="space-y-4">
                    {section.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${qIdx}`} className="bg-card border border-border rounded-xl px-5 py-1">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary transition-colors py-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-4">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-20 text-center bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Mail size={24} />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">Our support team is happy to help with anything not covered here.</p>
            <Button asChild size="lg" className="rounded-full px-8">
              <a href="mailto:contact@grassgodz.com">Contact Support</a>
            </Button>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}