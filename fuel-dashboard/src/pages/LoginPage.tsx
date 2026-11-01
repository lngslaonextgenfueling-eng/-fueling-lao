import React, { useState } from 'react';
import { supabase, toLaoError } from '@/lib/supabase';
import { Card } from '@/components/Card';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  marginTop: 4,
};

export default function LoginPage({ notice }: { notice?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(toLaoError(err));
    setBusy(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 32, textAlign: 'center' }}>⛽</div>
        <h2 style={{ textAlign: 'center', margin: '8px 0 4px' }}>LNGS Dashboard</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 0 }}>
          ສຳລັບຜູ້ຈັດການເທົ່ານັ້ນ
        </p>
        {notice && <p style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{notice}</p>}
        <form onSubmit={submit}>
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            ອີເມວ
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <div style={{ height: 12 }} />
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            ລະຫັດຜ່ານ
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%', marginTop: 16, padding: '12px', borderRadius: 'var(--radius-md)', border: 'none',
              background: 'var(--color-primary)', color: '#06210F', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'ກະລຸນາລໍຖ້າ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>
      </Card>
    </div>
  );
}
