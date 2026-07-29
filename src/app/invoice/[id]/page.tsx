'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from "@/lib/cart";

interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  variation_label: string;
  quantity: number;
  original_unit_price: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  custom_length?: number;
  custom_width?: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  created_at: string;
  billing_address: any;
  shipping_address: any;
  customer_note: string;
  items: OrderItem[];
  discounts?: { rule_name_snapshot: string; coupon_code: string; discount_amount: number }[];
}

export default function InvoicePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const token = localStorage.getItem('storeToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(apiUrl(`/api/store/account/orders/${params.id}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          // Trigger print dialog as soon as data renders
          setTimeout(() => {
            window.print();
          }, 500);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading invoice...</div>;
  }

  if (!order) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Order not found.</div>;
  }

  const formatAddress = (addr: any) => {
    if (!addr || Object.keys(addr).length === 0 || (!addr.address_line1 && !addr.city && !addr.first_name)) {
      return <div>No address provided</div>;
    }
    return (
      <div style={{ lineHeight: '1.4' }}>
        <div style={{ fontWeight: 600 }}>{addr.first_name} {addr.last_name}</div>
        {addr.company && <div>{addr.company}</div>}
        <div>{addr.address_line1}</div>
        {addr.address_line2 && <div>{addr.address_line2}</div>}
        <div>{addr.city}, {addr.state} {addr.postal_code}</div>
        <div>{addr.country}</div>
        {addr.phone && <div style={{ marginTop: '0.2rem' }}>Phone: {addr.phone}</div>}
        {addr.email && <div>Email: {addr.email}</div>}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* CSS for print media strictly enforced via style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* Ensure we hide Next.js Dev tools or arbitrary browser wrappers if needed */
          @page { margin: 0.5in; }
        }
      `}} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', letterSpacing: '1px' }}>CROWN FINDINGS</h1>
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            123 Jewelry District Ave.<br/>
            New York, NY 10036<br/>
            sales@crownfindings.com<br/>
            (212) 555-1234
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#555', letterSpacing: '2px' }}>INVOICE</h2>
          <table style={{ marginLeft: 'auto', fontSize: '14px', textAlign: 'left' }}>
            <tbody>
              <tr>
                <td style={{ paddingRight: '15px', fontWeight: 'bold' }}>Invoice #:</td>
                <td>{order.order_number}</td>
              </tr>
              <tr>
                <td style={{ paddingRight: '15px', fontWeight: 'bold' }}>Date:</td>
                <td>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style={{ paddingRight: '15px', fontWeight: 'bold' }}>Payment:</td>
                <td style={{ textTransform: 'capitalize' }}>{order.payment_method === 'standard_review' ? 'Standard Wholesale' : order.payment_method}</td>
              </tr>
              <tr>
                <td style={{ paddingRight: '15px', fontWeight: 'bold' }}>Status:</td>
                <td style={{ textTransform: 'capitalize' }}>{order.payment_status.replace('_', ' ')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '5px' }}>BILL TO</div>
          <div style={{ fontSize: '14px' }}>
            {formatAddress(order.billing_address)}
          </div>
        </div>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '5px' }}>SHIP TO</div>
          <div style={{ fontSize: '14px' }}>
            {formatAddress(order.shipping_address)}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#000', color: '#fff' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', width: '50%' }}>DESCRIPTION</th>
            <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', width: '15%' }}>QTY</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', width: '15%' }}>PRICE</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', width: '20%' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px 10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.product_name}</div>
                {item.sku && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>SKU: {item.sku}</div>}
                {item.variation_label && <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>{item.variation_label}</div>}
                {(item.custom_length || item.custom_width) && (
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    Custom Size: {item.custom_length ? `L: ${item.custom_length}" ` : ''}{item.custom_width ? `W: ${item.custom_width}"` : ''}
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
              <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px' }}>
                ${parseFloat(item.unit_price.toString()).toFixed(2)}
              </td>
              <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                ${parseFloat(item.line_total.toString()).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <table style={{ width: '40%', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 0', textAlign: 'right', paddingRight: '20px' }}>Subtotal:</td>
              <td style={{ padding: '5px 0', textAlign: 'right' }}>${parseFloat(order.subtotal.toString()).toFixed(2)}</td>
            </tr>
            {parseFloat(order.discount_total.toString()) > 0 && (
              <tr>
                <td style={{ padding: '5px 0', textAlign: 'right', paddingRight: '20px' }}>Discount:</td>
                <td style={{ padding: '5px 0', textAlign: 'right' }}>-${parseFloat(order.discount_total.toString()).toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '5px 0', textAlign: 'right', paddingRight: '20px' }}>Shipping:</td>
              <td style={{ padding: '5px 0', textAlign: 'right' }}>{parseFloat(order.shipping_total.toString()) === 0 ? '$0.00' : `$${parseFloat(order.shipping_total.toString()).toFixed(2)}`}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', textAlign: 'right', paddingRight: '20px', borderBottom: '1px solid #000' }}>Tax:</td>
              <td style={{ padding: '5px 0', textAlign: 'right', borderBottom: '1px solid #000' }}>{parseFloat(order.tax_total.toString()) === 0 ? '$0.00' : `$${parseFloat(order.tax_total.toString()).toFixed(2)}`}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0', textAlign: 'right', paddingRight: '20px', fontWeight: 'bold', fontSize: '16px' }}>TOTAL:</td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>${parseFloat(order.total.toString()).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {order.customer_note && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ccc' }}>
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>Customer Notes:</strong>
          <div style={{ fontSize: '14px' }}>{order.customer_note}</div>
        </div>
      )}

      {/* Footer / Thank you note */}
      <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '14px', color: '#555', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        Thank you for your business!<br/>
        For any questions regarding this invoice, please contact sales@crownfindings.com.
      </div>
    </div>
  );
}
