'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getGuestCartId, apiUrl } from '../../../../lib/cart';
import styles from './detail.module.css';
import { toast } from 'react-hot-toast';

interface ProductVariation {
  id: number;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  weight_g: number | null;
  attributes: { name: string; slug: string; value: string }[];
  images: { url: string }[];
}

interface ProductAttribute {
  name: string;
  slug: string;
  values: string;
  is_visible: boolean;
  is_for_variation: boolean;
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

interface ProductImage {
  url: string;
  sort_order: number;
  alt_text: string | null;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  description: string;
  short_description: string;
  weight_g: number | null;
  measurement_type: 'none' | 'inch' | 'plate';
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  categories: ProductCategory[];
  images: ProductImage[];
}

interface ProductApiResponse {
  product?: ProductData;
}

const uniqueUrls = (urls: string[]) => Array.from(new Set(urls.filter(Boolean)));

export default function ProductDetailClient({ initialProduct: _initialProduct }: { initialProduct: ProductData | null }) {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Custom Measurements
  const [customLength, setCustomLength] = useState<number | ''>('');
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [_metalPriceMultiplier, setMetalPriceMultiplier] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [regularPrice, setRegularPrice] = useState<number | null>(null);

  interface Discount { id: number; min_quantity: number; type: string; amount: number; }
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  useEffect(() => {
    async function fetchMetalPrice() {
      try {
        const res = await fetch(apiUrl('/api/metal-prices'));
        if (res.ok) {
          // simple placeholder for multiplier
          setMetalPriceMultiplier(1.05);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchMetalPrice();
  }, []);


  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(apiUrl(`/api/user/session`), { 
          credentials: 'include',
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) setIsAuthenticated(true);
        }
      } catch { }
    }
    checkSession();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(apiUrl(`/api/products/${productId}`));
        if (!res.ok) throw new Error('Not found');
        const data = await res.json() as ProductApiResponse;
        if (!data.product) throw new Error('Not found');

        setProduct(data.product);

        // Initialize options with the first variation if available
        if (data.product?.variations?.length > 0) {
          const initialOptions: Record<string, string> = {};
          data.product.variations[0].attributes.forEach((a) => {
            initialOptions[a.slug] = a.value;
          });
          setSelectedOptions(initialOptions);
        }
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // --- Variation Logic ---

  // 1. Extract unique attributes used by variations to build the UI
  const variationAttributes = (() => {
    if (!product || !product.variations || product.variations.length === 0) return [];
    const usedSlugs = new Set<string>();
    product.variations.forEach(v => v.attributes.forEach(a => usedSlugs.add(a.slug)));

    // Return attributes in the order they are defined on the parent product
    return product.attributes.filter(a => usedSlugs.has(a.slug));
  })();

  // 2. Determine validity of an option based on higher-level selections (top-down hierarchy)
  const isOptionValid = (attrIdx: number, slug: string, value: string) => {
    if (!product || !product.variations) return false;

    const testSelections: Record<string, string> = {};
    for (let i = 0; i < attrIdx; i++) {
      const earlierSlug = variationAttributes[i].slug;
      if (selectedOptions[earlierSlug]) {
        testSelections[earlierSlug] = selectedOptions[earlierSlug];
      }
    }
    testSelections[slug] = value;

    return product.variations.some(v =>
      Object.entries(testSelections).every(([k, val]) =>
        v.attributes.find(a => a.slug === k)?.value === val
      )
    );
  };

  // 3. Handle selection change
  const handleOptionSelect = (attrIdx: number, slug: string, value: string) => {
    setSelectedOptions(prev => {
      const next = { ...prev, [slug]: value };
      const validated: Record<string, string> = {};

      // Keep everything above and including the changed option
      for (let i = 0; i <= attrIdx; i++) {
        const s = variationAttributes[i].slug;
        if (next[s]) validated[s] = next[s];
      }

      // Check downstream options
      for (let i = attrIdx + 1; i < variationAttributes.length; i++) {
        const s = variationAttributes[i].slug;
        if (next[s]) {
          const testSelections = { ...validated, [s]: next[s] };
          const isValid = product?.variations?.some(v =>
            Object.entries(testSelections).every(([k, val]) => v.attributes.find(a => a.slug === k)?.value === val)
          );
          if (isValid) {
            validated[s] = next[s];
          }
        }
      }

      // Try to auto-fill missing downstream attributes with valid choices
      for (let i = attrIdx + 1; i < variationAttributes.length; i++) {
        const s = variationAttributes[i].slug;
        if (!validated[s]) {
          const validVars = product?.variations?.filter(v =>
            Object.entries(validated).every(([k, val]) => v.attributes.find(a => a.slug === k)?.value === val)
          );
          if (validVars && validVars.length > 0) {
            const firstAvailableValue = validVars[0].attributes.find(a => a.slug === s)?.value;
            if (firstAvailableValue) {
              validated[s] = firstAvailableValue;
            }
          }
        }
      }

      return validated;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.type === 'variable' && !currentVariation) {
      toast.error("Please select product options before adding to cart.");
      return;
    }
    setAddingToCart(true);
    try {
      const guestId = isAuthenticated ? null : getGuestCartId();
      const res = await fetch(apiUrl('/api/cart/items'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.id,
          variationId: currentVariation ? currentVariation.id : null,
          quantity,
          guestId,
          length: customLength || undefined,
          width: customWidth || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add to cart');
      }
      toast.success("Added to cart successfully!");
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart-updated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingToCart(false);
    }
  };


  // 4. Determine current active variation
  const currentVariation = product?.variations?.find(v =>
    variationAttributes.every(attr =>
      v.attributes.find(a => a.slug === attr.slug)?.value === selectedOptions[attr.slug]
    )
  ) || null;

  // --- Dynamic Data for UI ---
  // const displaySku = currentVariation?.sku || product?.sku || 'N/A';
  const displayWeight = currentVariation?.weight_g ?? product?.weight_g;
  const weightDisplay = displayWeight ? `${displayWeight}g` : 'N/A';

  useEffect(() => {
    async function fetchDiscounts() {
      if (!productId) return;
      try {
        const res = await fetch(apiUrl(`/api/products/${productId}/discounts`), {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setDiscounts(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchDiscounts();
  }, [productId]);

  useEffect(() => {
    async function fetchPrice() {
      if (!product) return;
      try {
        const body: Record<string, string | number | null> = {
          productId: product.id,
          variationId: currentVariation ? currentVariation.id : null,
        };
        if (customLength) body.length = customLength;
        if (customWidth) body.width = customWidth;

        const res = await fetch(apiUrl(`/api/products/calculate-price`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setCalculatedPrice(data.price);
          setBasePrice(data.originalBasePrice);
          setRegularPrice(data.regularPrice);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchPrice();
  }, [product, currentVariation, customLength, customWidth]);


  const images = uniqueUrls(
    (currentVariation && currentVariation.images && currentVariation.images.length > 0)
      ? currentVariation.images.map(img => img.url)
      : (product?.images && product.images.length > 0 ? product.images.map(img => img.url) : ['/web-phts/a-17.jpg'])
  );

  useEffect(() => {
    if (activeImage >= images.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveImage(0);
    }
  }, [images.length, activeImage]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.notFound}>Product not found. <Link href="/products">← Back to Products</Link></p>
        </div>
      </div>
    );
  }

  const activeImageIndex = activeImage < images.length ? activeImage : 0;

  // Find category and subcategory
  const parentCat = product.categories.find(c => !c.parent_id);
  const subCat = product.categories.find(c => c.parent_id);
  const categoryName = parentCat?.name || subCat?.name || 'Products';
  const subcategoryName = subCat?.name || '';

  const isPlateProduct = product.measurement_type === 'plate' || categoryName.toLowerCase().includes('plate') || subcategoryName.toLowerCase().includes('plate') || product.name.toLowerCase().includes('plate');
  const isMillProduct = product.measurement_type === 'inch' || (categoryName.toLowerCase() === 'mill products' && !isPlateProduct);

  // Get other visible attributes for the info table (exclude variation attributes)
  const visibleAttrs = product.attributes.filter(a =>
    a.is_visible &&
    !a.is_for_variation &&
    !variationAttributes.find(va => va.slug === a.slug)
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Shop</Link>
          <span>/</span>
          {parentCat ? (
            <Link href={`/products?category=${parentCat.slug}`}>{categoryName}</Link>
          ) : (
            <Link href="/products">{categoryName}</Link>
          )}
          {subcategoryName && subCat && (
            <>
              <span>/</span>
              <Link href={`/products?category=${subCat.slug}`}>{subcategoryName}</Link>
            </>
          )}
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Top Section */}
        <div className={styles.productTop}>

          {/* Left: Images */}
          <div className={styles.imageSide}>
            <div className={styles.mainImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImageIndex] || images[0]}
                alt={product.name}
                className={styles.mainImg}
              />
            </div>
            {images.length > 1 && (
              <div className={styles.thumbRow}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbBtn} ${activeImageIndex === idx ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className={styles.detailSide}>

            <p className={styles.customizeLabel}>Customize your Product</p>

            <h1 className={styles.productTitle}>
              {product.name} – Wholesale
            </h1>

            <div className={styles.skuBadge}>
              <span className={styles.skuLabel}>SKU:</span>
              <span className={styles.skuValue}>{currentVariation?.sku || product.sku || 'N/A'}</span>
            </div>

            <p className={styles.productDesc}>
              {product.description || product.short_description || `Elevate your jewelry creations with the ${product.name}, a premium-quality jewelry finding crafted to meet the needs of professional jewelers and wholesale buyers.`}
            </p>

            {variationAttributes.length > 0 && (
              <p className={styles.selectPrompt}>Select options to view details</p>
            )}

            {/* Dynamic Variation Selectors */}
            {variationAttributes.map((attr, attrIdx) => {
              const allOptions = Array.from(new Set(
                product.variations.flatMap(v => v.attributes.filter(a => a.slug === attr.slug).map(a => a.value))
              ));

              allOptions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

              const isMetal = attr.slug === 'metal' || attr.name.toLowerCase() === 'metal';

              if (isMetal) {
                return (
                  <div key={attr.slug} className={styles.metalSection}>
                    <h4 className={styles.sectionLabel}>{attr.name}</h4>
                    <div className={styles.metalOptions}>
                      {allOptions.map((opt) => {
                        const valid = isOptionValid(attrIdx, attr.slug, opt);

                        // Find a variation that has this metal option to get its image
                        const varForImage = product.variations.find(v =>
                          v.attributes.some(a => a.slug === attr.slug && a.value === opt) &&
                          v.images && v.images.length > 0
                        );

                        const btnImg = varForImage ? varForImage.images[0].url : images[0];

                        return (
                          <button
                            key={opt}
                            disabled={!valid}
                            className={`${styles.metalOption} ${selectedOptions[attr.slug] === opt ? styles.metalSelected : ''}`}
                            onClick={() => handleOptionSelect(attrIdx, attr.slug, opt)}
                            style={{ opacity: valid ? 1 : 0.3, cursor: valid ? 'pointer' : 'not-allowed' }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={btnImg} alt={opt} className={styles.metalImg} />
                            <span className={styles.metalCode}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div key={attr.slug} className={styles.sizeSection}>
                  <h4 className={styles.sectionLabel}>{attr.name}</h4>
                  <div className={styles.sizeRow}>
                    <select
                      value={selectedOptions[attr.slug] || ''}
                      onChange={(e) => handleOptionSelect(attrIdx, attr.slug, e.target.value)}
                      className={styles.sizeSelect}
                    >
                      {!selectedOptions[attr.slug] && <option value="" disabled>Select {attr.name}</option>}
                      {allOptions.map(opt => {
                        const valid = isOptionValid(attrIdx, attr.slug, opt);
                        return (
                          <option key={opt} value={opt} disabled={!valid}>
                            {opt} {!valid ? '(Unavailable)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              );
            })}


            {/* Custom Dimensions / Metal Price Calculator */}
            {isMillProduct && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-inkblue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📏</span> Chains & Wires by the Inch
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#555', fontWeight: 600 }}>Length Required (Inches)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.25"
                      value={customLength}
                      onChange={(e) => setCustomLength(parseFloat(e.target.value) || '')}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                      placeholder="e.g. 18"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#555', fontWeight: 600 }}>Est. Weight per Inch</label>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', color: '#333', fontSize: '1rem' }}>
                      {displayWeight ? `${displayWeight}g` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '0.9rem' }}>
                  <h5 style={{ marginBottom: '0.8rem', fontSize: '0.95rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem' }}>Metal Price Calculator</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>Estimated Total Weight:</span>
                    <span style={{ fontWeight: 600 }}>{customLength && displayWeight ? (Number(customLength) * displayWeight).toFixed(2) : '0.00'}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>Estimated Base Price:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>
                      {isAuthenticated && regularPrice !== null && calculatedPrice !== null && regularPrice > calculatedPrice && (
                        <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '6px', fontWeight: 'normal' }}>
                          ${regularPrice.toFixed(2)}
                        </span>
                      )}
                      ${isAuthenticated && calculatedPrice !== null ? calculatedPrice.toFixed(2) : (isAuthenticated ? '0.00' : 'Login Required')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #ddd' }}>
                    * Final wholesale price includes manufacturing markup and current spot market fluctuations. Must be logged in to view accurate pricing.
                  </div>
                </div>
              </div>
            )}
            {isPlateProduct && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-inkblue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📏</span> Custom Plate Dimensions
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#555', fontWeight: 600 }}>Length (Inches)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.25"
                      value={customLength}
                      onChange={(e) => setCustomLength(parseFloat(e.target.value) || '')}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#555', fontWeight: 600 }}>Width (Inches)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.25"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseFloat(e.target.value) || '')}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '0.9rem' }}>
                  <h5 style={{ marginBottom: '0.8rem', fontSize: '0.95rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem' }}>Metal Price Calculator</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>Estimated Total Area:</span>
                    <span style={{ fontWeight: 600 }}>{customLength && customWidth ? (Number(customLength) * Number(customWidth)).toFixed(2) : '0.00'} sq. inches</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>Estimated Base Price:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>
                      {isAuthenticated && regularPrice !== null && calculatedPrice !== null && regularPrice > calculatedPrice && (
                        <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '6px', fontWeight: 'normal' }}>
                          ${regularPrice.toFixed(2)}
                        </span>
                      )}
                      ${isAuthenticated && calculatedPrice !== null ? calculatedPrice.toFixed(2) : (isAuthenticated ? '0.00' : 'Login Required')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #ddd' }}>
                    * Final wholesale price includes manufacturing markup and current spot market fluctuations. Must be logged in to view accurate pricing.
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Display */}
            <div style={{ marginTop: '2rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #eee' }}>
              {isAuthenticated ? (
                <>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                    {regularPrice !== null && calculatedPrice !== null && regularPrice > calculatedPrice && (
                      <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '8px', fontSize: '1.4rem' }}>
                        ${regularPrice.toFixed(2)}
                      </span>
                    )}
                    ${calculatedPrice !== null ? calculatedPrice.toFixed(2) : (basePrice ? basePrice.toFixed(2) : '0.00')}
                    <span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}> / each</span>
                  </div>
                  {discounts.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-inkblue)' }}>Bulk Order Discounts:</p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                            <th style={{ padding: '0.3rem 0' }}>Quantity</th>
                            <th style={{ padding: '0.3rem 0' }}>Discount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {discounts.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '0.4rem 0' }}>{d.min_quantity}+</td>
                              <td style={{ padding: '0.4rem 0', color: 'green', fontWeight: 600 }}>
                                {d.type === 'percentage' ? `${d.amount}% off` : `$${d.amount} off`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Please login to view wholesale pricing and bulk discounts.
                </div>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className={styles.orderRow}>
              <div className={styles.quantityBox}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={styles.qtyInput}
                />
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={styles.priceBtn}
                  style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-inkblue)' }}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              ) : (
                <Link href="/login" className={styles.priceBtn}>
                  Login to See Price
                </Link>
              )}

            </div>


          </div>
        </div>

        {/* Additional Information */}
        <div className={styles.additionalSection}>
          <div className={styles.tabBar}>
            <button className={styles.tabActive}>Additional Information</button>
          </div>
          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <th>Weight</th>
                <td>{weightDisplay}</td>
              </tr>
              <tr>
                <th>Unit</th>
                <td>PC</td>
              </tr>

              {variationAttributes.map(attr => (
                selectedOptions[attr.slug] && (
                  <tr key={attr.slug}>
                    <th>{attr.name}</th>
                    <td><em>{selectedOptions[attr.slug]}</em></td>
                  </tr>
                )
              ))}
              {visibleAttrs.map((attr, idx) => (
                <tr key={idx}>
                  <th>{attr.name}</th>
                  <td>{attr.values}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
