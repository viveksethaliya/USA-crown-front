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
  const [selectedMetal, setSelectedMetal] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data.product);
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

  // Extract metal and size options from attributes
  const metalAttr = product.attributes.find(a => a.slug === 'metal' || a.name.toLowerCase() === 'metal');
  const sizeAttr = product.attributes.find(a => a.slug === 'size' || a.name.toLowerCase() === 'size');

  const metalOptions = metalAttr
    ? metalAttr.values.split(',').map(v => v.trim()).filter(Boolean)
    : [];
  const sizeOptions = sizeAttr
    ? sizeAttr.values.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  // Build images array — product images + fallback
  const images = product.images.length > 0
    ? product.images.map(img => img.url)
    : ['/web-phts/a-17.jpg'];

  // Find category and subcategory
  const parentCat = product.categories.find(c => !c.parent_id);
  const subCat = product.categories.find(c => c.parent_id);
  const categoryName = parentCat?.name || subCat?.name || 'Products';
  const subcategoryName = subCat?.name || '';

  // Weight display
  const weightDisplay = product.weight_g ? `${product.weight_g}g` : 'N/A';

  // Get other visible attributes for the info table
  const visibleAttrs = product.attributes.filter(a =>
    a.is_visible && a.slug !== 'metal' && a.slug !== 'size'
  );

  // Bulk discount tiers (standard for Crown Findings)
  const bulkTiers = [
    { qty: 6, discount: '-5%' },
    { qty: 72, discount: '-10%' },
    { qty: 250, discount: '-15%' },
  ];

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
            {/* Bulk Discount Badges */}
            <div className={styles.bulkBadges}>
              {bulkTiers.map((tier, idx) => (
                <div key={idx} className={styles.bulkBadge}>
                  <span className={styles.bulkQty}>{tier.qty} pieces</span>
                  <span className={styles.bulkDiscount}>{tier.discount}</span>
                </div>
              ))}
            </div>

            <p className={styles.customizeLabel}>Customize your Product</p>

            <h1 className={styles.productTitle}>
              {product.name} – Wholesale
            </h1>

            <p className={styles.productDesc}>
              {product.description || product.short_description || `Elevate your jewelry creations with the ${product.name}, a premium-quality jewelry finding crafted to meet the needs of professional jewelers and wholesale buyers.`}
            </p>

            {metalOptions.length > 0 && (
              <p className={styles.selectPrompt}>Select a Metal to Enter Quantity</p>
            )}

            {/* Metal Selection */}
            {metalOptions.length > 0 && (
              <div className={styles.metalSection}>
                <h4 className={styles.sectionLabel}>Metal</h4>
                <div className={styles.metalOptions}>
                  {metalOptions.map((metal, idx) => (
                    <button
                      key={metal}
                      className={`${styles.metalOption} ${selectedMetal === idx ? styles.metalSelected : ''}`}
                      onClick={() => setSelectedMetal(idx)}
                    >
                      <img src={images[0]} alt={metal} className={styles.metalImg} />
                      <span className={styles.metalCode}>{metal}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizeOptions.length > 0 && (
              <div className={styles.sizeSection}>
                <h4 className={styles.sectionLabel}>Sizes</h4>
                <div className={styles.sizeRow}>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className={styles.sizeSelect}
                  >
                    <option value="">{sizeOptions[0]}</option>
                    {sizeOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    className={styles.clearBtn}
                    onClick={() => setSelectedSize('')}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

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

            <p className={styles.skuLine}><strong>SKU:</strong> {product.sku || 'N/A'}</p>
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
              <tr>
                <th>Discount</th>
                <td>YES</td>
              </tr>
              {metalOptions.length > 0 && (
                <tr>
                  <th>Metal</th>
                  <td><em>{metalOptions[selectedMetal] || metalOptions[0]}</em></td>
                </tr>
              )}
              {sizeOptions.length > 0 && (
                <tr>
                  <th>Sizes</th>
                  <td><em>{selectedSize || sizeOptions[0]}</em></td>
                </tr>
              )}
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
