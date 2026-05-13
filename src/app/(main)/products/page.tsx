'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './products.module.css';

const MOCK_PRODUCTS = [
  {
    id: 'et-12n',
    name: 'ET-12N: 4.60MM Light Threaded Earring Nut',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y', '18W'],
  },
  {
    id: 'ew-24c',
    name: 'EW-24C: Catch For Earring Top Wire',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14Y', '18Y'],
  },
  {
    id: 'ef-41',
    name: 'EF-41: 4 Prong Round Friction Martini Cast Earring',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y', '18W', 'PLT'],
  },
  {
    id: 'ew-243',
    name: 'EW-243: Joint For Earrings',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14Y', '14W'],
  },
  {
    id: 'a-17',
    name: 'A-17: 5MM Die-Struck Block Initial',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14Y', '14W'],
  },
  {
    id: 's-150',
    name: 'S-150: Trillion Shaped V-Prong Cast Setting',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y'],
  },
  {
    id: 's-31',
    name: 'S-31: 4-Prong Round Single Base Cast Setting',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y'],
  },
  {
    id: 'et-11n',
    name: 'ET-11N: 4.60MM Baby Threaded Earring Nut',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y'],
  },
  {
    id: 'p-22',
    name: 'P-22: 14K Round Wire Basket Pendant',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14Y', '14W', '18Y'],
  },
  {
    id: 'r-55',
    name: 'R-55: Cathedral Style Ring Setting',
    image: '/web-phts/a-17.jpg',
    metalTypes: ['14W', '14Y', 'PLT'],
  },
];

const CATEGORIES = [
  { name: 'Disc', subcategories: ['Round Disc', 'Oval Disc', 'Heart Disc', 'Profiles', 'Square Disc', 'Round Washer'] },
  { name: 'Settings', subcategories: ['Tapered Baguettes', '3 Prong Round – Settings', '4 Prong Round – Settings', '6 Prong Round – Settings', '4 Prong Oval – Settings'] },
  { name: 'Earrings', subcategories: ['Earring Nuts', 'Earring Wires', 'Earring Friction Posts', 'Screw Back Earrings'] },
  { name: 'Pendants', subcategories: ['Basket Pendants', 'Bail Pendants', 'Bezel Pendants'] },
];

const METAL_TYPES = ['10W', '14P', '14TT', '14W', '14Y', '18W', '18Y', 'BRAS', 'PLT', 'SS'];

const METAL_COLOR_MAP: Record<string, string> = {
  '10W': '#c0c0c0',
  '14P': '#e5c3c6',
  '14TT': '#d4af37',
  '14W': '#e8e8e8',
  '14Y': '#d4af37',
  '18W': '#c9c9c9',
  '18Y': '#cfb53b',
  'BRAS': '#b5a642',
  'PLT': '#e5e4e2',
  'SS': '#aaa9ad',
};

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState('popularity');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMetals, setSelectedMetals] = useState<string[]>([]);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleMetal = (metal: string) => {
    setSelectedMetals(prev =>
      prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedMetals([]);
    setSearchQuery('');
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMetal = selectedMetals.length === 0 || p.metalTypes.some(m => selectedMetals.includes(m));
    return matchesSearch && matchesMetal;
  });

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* Mobile filter toggle */}
        <button className={styles.mobileFilterBtn} onClick={() => setMobileSidebar(!mobileSidebar)}>
          ☰ Filters
        </button>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileSidebar ? styles.sidebarOpen : ''}`}>
          <button className={styles.mobileClose} onClick={() => setMobileSidebar(false)}>✕ Close</button>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {/* Categories */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.filterList}>
              {CATEGORIES.map(cat => (
                <div key={cat.name} className={styles.categoryItem}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                      className={styles.checkInput}
                    />
                    {cat.name}
                  </label>
                  {selectedCategories.includes(cat.name) && (
                    <div className={styles.subcategories}>
                      {cat.subcategories.map(sub => (
                        <label key={sub} className={styles.checkLabel}>
                          <input type="checkbox" className={styles.checkInput} />
                          {sub}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metal Type */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Metal Type</h3>
            <div className={styles.filterList}>
              {METAL_TYPES.map(metal => (
                <label key={metal} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={selectedMetals.includes(metal)}
                    onChange={() => toggleMetal(metal)}
                    className={styles.checkInput}
                  />
                  {metal}
                </label>
              ))}
            </div>
          </div>

          {/* Thread Type */}
          <div className={styles.filterBlock}>
            <h3 className={styles.filterTitle}>Thread Type</h3>
            <div className={styles.filterList}>
              <label className={styles.checkLabel}>
                <input type="checkbox" className={styles.checkInput} />
                Push Back
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" className={styles.checkInput} />
                Screw Back
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <button onClick={resetFilters} className={styles.resetBtn}>Reset Filters</button>
            <span className={styles.resultCount}>
              Showing 1-{filteredProducts.length} of {filteredProducts.length} results
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="popularity">Sort by Popularity</option>
              <option value="name">Sort by Name</option>
              <option value="newest">Sort by Newest</option>
            </select>
          </div>

          {/* Product Grid */}
          <div className={styles.productGrid}>
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.productImage}
                  />
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.metalRow}>
                    <span className={styles.metalLabel}>Metal Type:</span>
                    <div className={styles.metalDots}>
                      {product.metalTypes.map(m => (
                        <span
                          key={m}
                          className={styles.metalDot}
                          style={{ backgroundColor: METAL_COLOR_MAP[m] || '#ccc' }}
                          title={m}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link href={`/products/${product.id}`} className={styles.viewBtn}>
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
