import React from 'react';

const money = (value: number | string | null | undefined) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

export default function PrintInvoice({ order, checkoutFields = [] }: { order: any, checkoutFields?: any[] }) {
  if (!order) return null;

  // Filter notes to only customer-facing ones
  const customerNotes = (order.notes || []).filter((n: any) => n.note_type === 'customer');

  const cf = order.custom_fields || {};
  const definitions = cf._definitions || {};
  const customFieldEntries = Object.entries(cf).filter(([key]) => key !== '_definitions');

  return (
    <div className="hidden print:block w-full text-black bg-white">
      {/* ─── INVOICE HEADER ─── */}
      <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Invoice</h1>
          <p className="text-sm"><strong>Order #:</strong> {order.order_number}</p>
          <p className="text-sm"><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
          <p className="text-sm"><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
          <p className="text-sm"><strong>Payment:</strong> <span className="capitalize">{order.payment_status?.replace('_', ' ')}</span></p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-[#d1a054]">Crown Findings Co., Inc.</h2>
          <p className="text-sm mt-1">42 W 48th St</p>
          <p className="text-sm">New York, NY 10036</p>
          <p className="text-sm">info@crownfindings.com</p>
          <p className="text-sm">(212) 764-6470</p>
        </div>
      </div>

      {/* ─── ADDRESSES ─── */}
      <div className="flex justify-between mb-10">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-3 uppercase text-sm">Bill To</h3>
          {order.billing_address ? (
            <div className="text-sm leading-relaxed">
              <p className="font-bold">{order.billing_address.first_name} {order.billing_address.last_name}</p>
              {order.billing_address.company && <p>{order.billing_address.company}</p>}
              <p>{order.billing_address.address_line1}</p>
              {order.billing_address.address_line2 && <p>{order.billing_address.address_line2}</p>}
              <p>{[order.billing_address.city, order.billing_address.state, order.billing_address.postal_code].filter(Boolean).join(', ')}</p>
              <p>{order.billing_address.country}</p>
              {order.billing_address.phone && <p>{order.billing_address.phone}</p>}
              <p>{order.billing_address.email}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No billing address recorded.</p>
          )}
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-3 uppercase text-sm">Ship To</h3>
          {order.shipping_address ? (
            <div className="text-sm leading-relaxed">
              <p className="font-bold">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              {order.shipping_address.company && <p>{order.shipping_address.company}</p>}
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code].filter(Boolean).join(', ')}</p>
              <p>{order.shipping_address.country}</p>
              {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
              <p>{order.shipping_address.email}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No shipping address recorded.</p>
          )}
        </div>
      </div>

      {/* ─── CUSTOM FIELDS ─── */}
      {customFieldEntries.length > 0 && (
        <div className="mb-10">
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-3 uppercase text-sm">Additional Information</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {customFieldEntries.map(([key, value]) => {
              const def = definitions[key] || checkoutFields.find(f => f.field_key === key) || {};
              const label = def.label || key;
              const displayVal = def.display_value !== undefined ? def.display_value : value;
              return (
                <div key={key}>
                  <span className="font-bold">{label}: </span>
                  <span>{String(displayVal)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── LINE ITEMS ─── */}
      <table className="w-full mb-10 text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-black">
            <th className="py-2 px-2 text-left w-1/2">Product</th>
            <th className="py-2 px-2 text-center">Unit Price</th>
            <th className="py-2 px-2 text-center">Qty</th>
            <th className="py-2 px-2 text-right">Discount</th>
            <th className="py-2 px-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items && order.items.map((item: any) => {
            const multiplier = (Number(item.custom_length) || 1) * (Number(item.custom_width) || 1);
            const total = Math.max(0, Number(item.unit_price || 0) * Number(item.quantity || 0) * multiplier - Number(item.discount_amount || 0));
            return (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-2">
                  <div className="font-bold">{item.product_name}</div>
                  <div className="text-xs text-gray-600">
                    {[
                      item.sku && `SKU: ${item.sku}`,
                      item.variation_label,
                      item.custom_length && `L ${item.custom_length}`,
                      item.custom_width && `W ${item.custom_width}`
                    ].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">{money(item.unit_price)}</td>
                <td className="py-3 px-2 text-center">{item.quantity}</td>
                <td className="py-3 px-2 text-right">{Number(item.discount_amount) > 0 ? `-${money(item.discount_amount)}` : '-'}</td>
                <td className="py-3 px-2 text-right font-bold">{money(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ─── TOTALS SUMMARY ─── */}
      <div className="flex justify-end mb-10">
        <div className="w-1/3">
          {order.subtotal_override !== null && order.subtotal_override !== undefined ? (
            <div className="flex justify-between py-1 text-sm">
              <span className="font-bold">Manual Subtotal:</span>
              <span>{money(order.subtotal_override)}</span>
            </div>
          ) : (
            <div className="flex justify-between py-1 text-sm">
              <span>Subtotal:</span>
              <span>{money(order.subtotal)}</span>
            </div>
          )}

          {Number(order.discount_total) > 0 && (
            <div className="flex justify-between py-1 text-sm text-red-600">
              <span>Discount:</span>
              <span>-{money(order.discount_total)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-sm">
            <span>Tax:</span>
            <span>{money(order.tax_total)}</span>
          </div>

          <div className="flex justify-between py-1 text-sm">
            <span>Shipping:</span>
            <span>{money(order.shipping_total)}</span>
          </div>

          <div className="flex justify-between py-2 mt-2 border-t-2 border-black text-lg font-bold">
            <span>Grand Total:</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
      </div>

      {/* ─── CUSTOMER NOTES ─── */}
      {order.customer_note && (
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase mb-1">Customer Note</h3>
          <p className="text-sm italic">{order.customer_note}</p>
        </div>
      )}

      {customerNotes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase mb-2">Order Updates</h3>
          <div className="space-y-3">
            {customerNotes.map((note: any) => (
              <div key={note.id} className="text-sm bg-gray-50 p-3 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">{new Date(note.created_at).toLocaleString()}</div>
                <div>{note.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p>If you have any questions regarding this invoice, please contact us.</p>
      </div>
    </div>
  );
}
