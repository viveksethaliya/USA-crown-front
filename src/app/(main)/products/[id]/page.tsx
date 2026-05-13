'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './detail.module.css';

const PRODUCT_DATA: Record<string, {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  images: string[];
  metals: { code: string; label: string; image: string }[];
  sizes: string[];
  sku: string;
  weight: string;
  unit: string;
  discount: string;
  threadType: string;
  bulkTiers: { qty: number; discount: string }[];
}> = {
  'et-12n': {
    id: 'et-12n',
    name: 'ET-12N: 4.60MM Light Threaded Earring Nut',
    category: 'Earrings',
    subcategory: 'Threaded Nuts',
    description: 'Elevate your jewelry creations with the ET-12N: 4.60MM LIGHT THREADED EARRING NUT, a premium-quality jewelry finding crafted to meet the needs of professional jewelers and wholesale buyers.',
    images: ['/web-phts/a-17.jpg', '/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: 'PLT', label: 'PLAT', image: '/web-phts/a-17.jpg' },
      { code: 'SS', label: 'S/S', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['Light || 4.60MM', 'Medium || 5.50MM', 'Heavy || 6.30MM'],
    sku: 'N/A',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'Screw Back',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'ew-24c': {
    id: 'ew-24c',
    name: 'EW-24C: Catch For Earring Top Wire',
    category: 'Earrings',
    subcategory: 'Earring Wires',
    description: 'A reliable catch mechanism for earring top wires, precision crafted for secure everyday wear. Ideal for professional jewelers seeking consistent quality.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: '18Y', label: '18Y', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['Standard || 3.50MM'],
    sku: 'EW-24C',
    weight: '0.15g',
    unit: 'PC',
    discount: 'YES',
    threadType: 'Push Back',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'ef-41': {
    id: 'ef-41',
    name: 'EF-41: 4 Prong Round Friction Martini Cast Earring',
    category: 'Earrings',
    subcategory: 'Cast Earrings',
    description: 'A beautifully crafted 4 prong round friction martini cast earring setting, designed for secure stone mounting with an elegant, low-profile silhouette.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: '18W', label: '18W', image: '/web-phts/a-17.jpg' },
      { code: 'PLT', label: 'PLAT', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['3.00MM', '3.50MM', '4.00MM', '4.50MM', '5.00MM', '5.50MM', '6.00MM', '6.50MM'],
    sku: 'EF-41',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'Push Back',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'ew-243': {
    id: 'ew-243',
    name: 'EW-243: Joint For Earrings',
    category: 'Earrings',
    subcategory: 'Earring Components',
    description: 'A precision joint component for earring assembly, ensuring smooth articulation and durable performance for professional jewelry making.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['Standard'],
    sku: 'EW-243',
    weight: '0.20g',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'a-17': {
    id: 'a-17',
    name: 'A-17: 5MM Die-Struck Block Initial',
    category: 'Disc',
    subcategory: 'Block Initials',
    description: 'A premium 5MM die-struck block initial charm, perfect for personalized jewelry. Crisp lettering with a polished finish, made for professional jewelers.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['5MM'],
    sku: 'A-17',
    weight: '0.30g',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  's-150': {
    id: 's-150',
    name: 'S-150: Trillion Shaped V-Prong Cast Setting',
    category: 'Settings',
    subcategory: 'V-Prong Settings',
    description: 'A precision trillion-shaped V-prong cast setting designed for secure stone mounting with maximum light exposure. Ideal for trillion-cut gemstones.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['4.00MM', '5.00MM', '6.00MM', '7.00MM', '8.00MM'],
    sku: 'S-150',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  's-31': {
    id: 's-31',
    name: 'S-31: 4-Prong Round Single Base Cast Setting',
    category: 'Settings',
    subcategory: 'Round Settings',
    description: 'A classic 4-prong round single base cast setting, offering secure stone retention with a clean, timeless profile suitable for all round-cut stones.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['2.50MM', '3.00MM', '3.50MM', '4.00MM', '4.50MM', '5.00MM', '5.50MM', '6.00MM', '6.50MM'],
    sku: 'S-31',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'et-11n': {
    id: 'et-11n',
    name: 'ET-11N: 4.60MM Baby Threaded Earring Nut',
    category: 'Earrings',
    subcategory: 'Threaded Nuts',
    description: 'A compact baby threaded earring nut at 4.60MM, designed for smaller earring posts. Premium quality with reliable threading for secure wear.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['Baby || 4.60MM'],
    sku: 'ET-11N',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'Screw Back',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'p-22': {
    id: 'p-22',
    name: 'P-22: 14K Round Wire Basket Pendant',
    category: 'Pendants',
    subcategory: 'Basket Pendants',
    description: 'An elegant round wire basket pendant setting in 14K gold, designed for secure stone display with maximum brilliance and light penetration.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '18Y', label: '18Y', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['4.00MM', '5.00MM', '6.00MM', '6.50MM', '7.00MM', '8.00MM'],
    sku: 'P-22',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
  'r-55': {
    id: 'r-55',
    name: 'R-55: Cathedral Style Ring Setting',
    category: 'Settings',
    subcategory: 'Ring Settings',
    description: 'A stunning cathedral-style ring setting featuring elevated arches for a dramatic profile. Crafted for round-cut center stones with exceptional craftsmanship.',
    images: ['/web-phts/a-17.jpg'],
    metals: [
      { code: '14W', label: '14W', image: '/web-phts/a-17.jpg' },
      { code: '14Y', label: '14Y', image: '/web-phts/a-17.jpg' },
      { code: 'PLT', label: 'PLAT', image: '/web-phts/a-17.jpg' },
    ],
    sizes: ['5.00MM', '5.50MM', '6.00MM', '6.50MM', '7.00MM', '7.50MM', '8.00MM'],
    sku: 'R-55',
    weight: 'N/A',
    unit: 'PC',
    discount: 'YES',
    threadType: 'N/A',
    bulkTiers: [
      { qty: 6, discount: '-5%' },
      { qty: 72, discount: '-10%' },
      { qty: 250, discount: '-15%' },
    ],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const product = PRODUCT_DATA[productId];

  const [selectedMetal, setSelectedMetal] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.notFound}>Product not found. <Link href="/products">← Back to Products</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Shop</Link>
          <span>/</span>
          <Link href="/products">{product.category}</Link>
          <span>/</span>
          <span>{product.subcategory}</span>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Top Section */}
        <div className={styles.productTop}>

          {/* Left: Images */}
          <div className={styles.imageSide}>
            <div className={styles.mainImage}>
              <img
                src={product.images[activeImage] || product.images[0]}
                alt={product.name}
                className={styles.mainImg}
              />
            </div>
            {product.images.length > 1 && (
              <div className={styles.thumbRow}>
                {product.images.map((img, idx) => (
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
              {product.bulkTiers.map((tier, idx) => (
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
              {product.description}
            </p>

            <p className={styles.selectPrompt}>Select a Metal to Enter Quantity</p>

            {/* Metal Selection */}
            <div className={styles.metalSection}>
              <h4 className={styles.sectionLabel}>Metal</h4>
              <div className={styles.metalOptions}>
                {product.metals.map((metal, idx) => (
                  <button
                    key={metal.code}
                    className={`${styles.metalOption} ${selectedMetal === idx ? styles.metalSelected : ''}`}
                    onClick={() => setSelectedMetal(idx)}
                  >
                    <img src={metal.image} alt={metal.label} className={styles.metalImg} />
                    <span className={styles.metalCode}>{metal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className={styles.sizeSection}>
              <h4 className={styles.sectionLabel}>Sizes</h4>
              <div className={styles.sizeRow}>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className={styles.sizeSelect}
                >
                  <option value="">{product.sizes[0]}</option>
                  {product.sizes.map(s => (
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

            <p className={styles.skuLine}><strong>SKU:</strong> {product.sku}</p>
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
                <td>{product.weight}</td>
              </tr>
              <tr>
                <th>Unit</th>
                <td>{product.unit}</td>
              </tr>
              <tr>
                <th>Discount</th>
                <td>{product.discount}</td>
              </tr>
              <tr>
                <th>Metal</th>
                <td><em>{product.metals[selectedMetal]?.label}</em></td>
              </tr>
              <tr>
                <th>Sizes</th>
                <td><em>{selectedSize || product.sizes[0]}</em></td>
              </tr>
              <tr>
                <th>Thread Type</th>
                <td>{product.threadType}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
