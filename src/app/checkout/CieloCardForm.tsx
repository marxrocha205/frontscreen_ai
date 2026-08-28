import React, { useState } from 'react';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { config } from '@/lib/config';
import { useRouter } from 'next/navigation';

export function CieloCardForm({ 
  planId, 
  language 
}: { 
  planId: number; 
  language: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    cardExpiration: '',
    cardCvv: '',
  });

  const getBrand = (number: string) => {
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('34') || number.startsWith('37')) return 'Amex';
    return 'Visa'; // fallback
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiration = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 6);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.cardNumber || !formData.cardHolder || !formData.cardExpiration || !formData.cardCvv) {
      setErrorMessage('Por favor, preencha todos os campos do cartão.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/payments/cielo/create-subscription`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify({
          plan_id: planId,
          card_number: formData.cardNumber.replace(/\s/g, ''),
          card_holder: formData.cardHolder,
          card_expiration: formData.cardExpiration,
          card_cvv: formData.cardCvv,
          card_brand: getBrand(formData.cardNumber.replace(/\s/g, ''))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao processar o pagamento.');
      }

      setSuccess(true);
      setTimeout(() => router.push(`/success?plan=${planId}`), 2000);
      
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao processar o pagamento.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: 8,
    height: 48,
    padding: '0 16px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 16,
  };

  return (
    <div style={{ background: '#1a1a1a', padding: '24px 20px', borderRadius: 12, border: '1px solid #333' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CreditCard size={20} color="#fff" />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Cartão de Crédito</h3>
        </div>

        <input
          type="text"
          placeholder="Número do Cartão"
          style={inputStyle}
          maxLength={19}
          value={formData.cardNumber}
          onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
        />
        
        <input
          type="text"
          placeholder="Nome Impresso no Cartão"
          style={inputStyle}
          value={formData.cardHolder}
          onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 16 }}>
          <input
            type="text"
            placeholder="MM/AAAA"
            style={inputStyle}
            maxLength={7}
            value={formData.cardExpiration}
            onChange={(e) => setFormData({ ...formData, cardExpiration: formatExpiration(e.target.value) })}
          />
          <input
            type="text"
            placeholder="CVV"
            style={inputStyle}
            maxLength={4}
            value={formData.cardCvv}
            onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value.replace(/\D/g, '') })}
          />
        </div>

        {errorMessage && (
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>
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
    </div>
  );
}
