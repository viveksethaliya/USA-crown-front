'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './detail.module.css';

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
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  categories: ProductCategory[];
  images: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data.product);

        // Initialize options with the first variation if available
        if (data.product?.variations?.length > 0) {
           const initialOptions: Record<string, string> = {};
           data.product.variations[0].attributes.forEach((a: any) => {
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
          const isValid = product.variations.some(v => 
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
            const validVars = product.variations.filter(v => 
               Object.entries(validated).every(([k, val]) => v.attributes.find(a => a.slug === k)?.value === val)
            );
            if (validVars.length > 0) {
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

  // 4. Determine current active variation
  const currentVariation = product.variations?.find(v => 
    variationAttributes.every(attr => 
      v.attributes.find(a => a.slug === attr.slug)?.value === selectedOptions[attr.slug]
    )
  ) || null;

  // --- Dynamic Data for UI ---
  const displaySku = currentVariation?.sku || product.sku || 'N/A';
  const displayWeight = currentVariation?.weight_g || product.weight_g;
  const weightDisplay = displayWeight ? `${displayWeight}g` : 'N/A';

  const images = (currentVariation && currentVariation.images && currentVariation.images.length > 0)
    ? currentVariation.images.map(img => img.url)
    : (product.images.length > 0 ? product.images.map(img => img.url) : ['/web-phts/a-17.jpg']);

  // Reset active image index if we switch variation and the new image list is shorter
  if (activeImage >= images.length) {
    setActiveImage(0);
  }

  // Find category and subcategory
  const parentCat = product.categories.find(c => !c.parent_id);
  const subCat = product.categories.find(c => c.parent_id);
  const categoryName = parentCat?.name || subCat?.name || 'Products';
  const subcategoryName = subCat?.name || '';

  // Get other visible attributes for the info table (exclude variation attributes)
  const visibleAttrs = product.attributes.filter(a =>
    a.is_visible && !variationAttributes.find(va => va.slug === a.slug)
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
          <Link href="/products">{categoryName}</Link>
          {subcategoryName && (
            <>
              <span>/</span>
              <span>{subcategoryName}</span>
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
              <img
                src={images[activeImage] || images[0]}
                alt={product.name}
                className={styles.mainImg}
              />
            </div>
            {images.length > 1 && (
              <div className={styles.thumbRow}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbBtn} ${activeImage === idx ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
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

              const isMetal = attr.slug === 'metal' || attr.name.toLowerCase() === 'metal';

              if (isMetal) {
                return (
                  <div key={attr.slug} className={styles.metalSection}>
                    <h4 className={styles.sectionLabel}>{attr.name}</h4>
                    <div className={styles.metalOptions}>
                      {allOptions.map((opt) => {
                        const valid = isOptionValid(attrIdx, attr.slug, opt);
                        return (
                          <button
                            key={opt}
                            disabled={!valid}
                            className={`${styles.metalOption} ${selectedOptions[attr.slug] === opt ? styles.metalSelected : ''}`}
                            onClick={() => handleOptionSelect(attrIdx, attr.slug, opt)}
                            style={{ opacity: valid ? 1 : 0.3, cursor: valid ? 'pointer' : 'not-allowed' }}
                          >
                            <img src={images[0]} alt={opt} className={styles.metalImg} />
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
              <Link href="/login" className={styles.priceBtn}>
                Login to See Price
              </Link>
            </div>

            <p className={styles.skuLine}><strong>SKU:</strong> {displaySku}</p>
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
