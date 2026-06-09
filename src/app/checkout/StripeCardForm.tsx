import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CheckCircle } from 'lucide-react';
import { config } from '@/lib/config';
import { useRouter } from 'next/navigation';

export function StripeCardForm({ 
  planId, 
  currency, 
  language 
}: { 
  planId: number; 
  currency: string; 
  language: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const STRIPE_PRICE_IDS: Record<number, string> = {
    2: 'price_1TeFi5KLfocqpuvHejIGt3FS',
    3: 'price_1TeFx9KLfocqpuvHhblVXeRU',
  };

  useEffect(() => {
    // 1. Fetch config (public key)
    fetch(`${config.apiUrl}/api/payments/config`)
      .then(res => res.json())
      .then(data => {
        if (data.stripe_public_key) {
          setStripePromise(loadStripe(data.stripe_public_key, {
            stripeAccount: 'acct_1TYrU3KLfocqpuvH'
          }));
        }
      });

    // 2. Create subscription & get client_secret
    const priceId = STRIPE_PRICE_IDS[planId] || STRIPE_PRICE_IDS[2];
    fetch(`${config.apiUrl}/api/payments/create-subscription`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      },
      body: JSON.stringify({ price_id: priceId, currency: currency.toLowerCase() })
    })
    .then(res => res.json())
    .then(data => {
      if (data.client_secret) setClientSecret(data.client_secret);
    })
    .catch(err => console.error("Error fetching client secret:", err));
  }, [planId, currency]);

  if (!clientSecret || !stripePromise) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>{language === 'pt-BR' ? 'Carregando ambiente seguro...' : 'Loading secure environment...'}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a1a', padding: '24px 20px', borderRadius: 12, border: '1px solid #333' }}>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
        <StripeCheckoutForm language={language} planId={planId} />
      </Elements>
    </div>
  );
}

function StripeCheckoutForm({ language, planId }: { language: string, planId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?plan=${planId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Erro ao processar o pagamento.');
      setIsLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/success?plan=${planId}`), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {errorMessage && (
        <div style={{ color: '#ef4444', fontSize: 14 }}>
          {errorMessage}
        </div>
      )}

      <button
        disabled={isLoading || success}
        type="submit"
        style={{
          width: '100%',
          height: 48,
          background: success ? '#10b981' : '#5c5cfc',
          border: 'none',
          borderRadius: 9999,
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: isLoading ? 'wait' : (success ? 'default' : 'pointer'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.15s',
        }}
      >
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : success ? (
          <><CheckCircle size={20} /> {language === 'pt-BR' ? 'Pagamento Aprovado!' : 'Payment Approved!'}</>
        ) : (
          language === 'pt-BR' ? 'Assinar agora' : 'Subscribe now'
        )}
      </button>
    </form>
  );
}
