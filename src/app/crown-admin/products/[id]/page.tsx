'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Package, Tag, Image, Link2, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BasicInfoTab from './tabs/BasicInfoTab';
import OrganizationTab from './tabs/OrganizationTab';
import ImagesTab from './tabs/ImagesTab';
import VariationsTab from './tabs/VariationsTab';
import LinkedProductsTab from './tabs/LinkedProductsTab';

const API = 'http://localhost:5000/api/admin';
const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'organization', label: 'Organization', icon: Tag },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'variations', label: 'Variations', icon: Layers },
  { id: 'links', label: 'Linked Products', icon: Link2 },
];

const emptyProduct = {
  name: '', slug: '', sku: '', gtin: '', type: 'simple',
  short_description: '', description: '', purchase_note: '',
  brand_id: '', regular_price: '', sale_price: '', sale_start: '', sale_end: '',
  tax_status: 'taxable', tax_class: '',
  stock_quantity: '', low_stock_amount: '', stock_status: 'instock',
  backorders_allowed: false, sold_individually: false,
  weight_g: '', length_in: '', width_in: '', height_in: '',
  is_published: true, is_featured: false, visibility: 'visible', allow_reviews: true,
  position: 0,
  category_ids: [], tag_ids: [],
};

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = idStr === 'new';

  const [activeTab, setActiveTab] = useState('basic');
  const [product, setProduct] = useState<any>(emptyProduct);
  const [images, setImages] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [productRelations, setProductRelations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Reference data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [tags, setTags] = useState([]);

  // Load reference data
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/brands`, { headers }).then(r => r.json()),
      fetch(`${API}/categories`, { headers }).then(r => r.json()),
      fetch(`${API}/attributes`, { headers }).then(r => r.json()),
      fetch(`${API}/tags`, { headers }).then(r => r.json()),
    ]).then(([b, c, a, t]) => {
      setBrands(b || []);
      setCategories(c || []);
      setAttributes(a || []);
      setTags(t || []);
    });
  }, []);

  // Load existing product
  useEffect(() => {
    if (!idStr || idStr === 'new') return;
    const fetchProduct = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await fetch(`${API}/products/${idStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // Show any error returned from the backend clearly
        if (!res.ok) {
          toast.error(`Backend error (${res.status}): ${data.error || JSON.stringify(data)}`);
          return;
        }

        // If data has no name it is likely an empty/unexpected response
        if (!data || !data.name) {
          toast.error(`Product ${idStr} returned unexpected data`);
          return;
        }

        setProduct({
          name: data.name || '', slug: data.slug || '', sku: data.sku || '',
          gtin: data.gtin || '', type: data.type || 'simple',
          short_description: data.short_description || '',
          description: data.description || '', purchase_note: data.purchase_note || '',
          brand_id: data.brand_id || '', regular_price: data.regular_price || '',
          sale_price: data.sale_price || '', sale_start: data.sale_start || '',
          sale_end: data.sale_end || '', tax_status: data.tax_status || 'taxable',
          tax_class: data.tax_class || '',
          stock_quantity: data.stock_quantity !== null ? data.stock_quantity : '',
          low_stock_amount: data.low_stock_amount !== null ? data.low_stock_amount : '',
          stock_status: data.stock_status || 'instock',
          backorders_allowed: data.backorders_allowed || false,
          sold_individually: data.sold_individually || false,
          weight_g: data.weight_g || '', length_in: data.length_in || '',
          width_in: data.width_in || '', height_in: data.height_in || '',
          is_published: data.is_published !== undefined ? data.is_published : true,
          is_featured: data.is_featured || false,
          visibility: data.visibility || 'visible',
          allow_reviews: data.allow_reviews !== undefined ? data.allow_reviews : true,
          position: data.position || 0,
          category_ids: (data.product_categories || []).map((pc: any) => pc.category_id),
          tag_ids: (data.product_tags || []).map((pt: any) => pt.tag_id),
        });
        setImages(data.product_images || []);
        setVariations(data.product_variations || []);
        setProductRelations(data.product_relations || []);
      } catch (error: any) {
        console.error('Fetch product error:', error);
        toast.error(`Network or parse error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [idStr]);

  const handleChange = (field: string, value: any) => {
    setProduct((prev: any) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name only if it's a new product
      if (field === 'name' && isNew) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API}/products` : `${API}/products/${idStr}`;

    // Clean up empty strings to null for numeric fields
    const payload = { ...product };
    ['regular_price', 'sale_price', 'stock_quantity', 'low_stock_amount',
     'weight_g', 'length_in', 'width_in', 'height_in', 'brand_id'].forEach(f => {
      if (payload[f] === '' || payload[f] === null) payload[f] = null;
    });

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save product');
        return;
      }
      
      toast.success(isNew ? 'Product created successfully' : 'Product updated successfully');

      if (isNew) {
        router.push(`/crown-admin/products/${data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/crown-admin/products"
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isNew ? 'Create New Product' : product.name || 'Edit Product'}
            </h2>
            <p className="text-gray-500 text-sm">{isNew ? 'Fill in the details below' : `ID: ${idStr}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChange('is_published', !product.is_published)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              product.is_published
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {product.is_published ? '● Published' : '○ Draft'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const disabled = tab.id !== 'basic' && tab.id !== 'organization' && isNew;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : disabled
                  ? 'border-transparent text-gray-700 cursor-not-allowed'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {disabled && <span className="text-xs text-gray-700">(save first)</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'basic' && (
          <BasicInfoTab product={product} onChange={handleChange} brands={brands} />
        )}
        {activeTab === 'organization' && (
          <OrganizationTab product={product} onChange={handleChange} categories={categories} tags={tags} />
        )}
        {activeTab === 'images' && !isNew && (
          <ImagesTab productId={idStr as string} images={images} setImages={setImages} />
        )}
        {activeTab === 'variations' && !isNew && (
          <VariationsTab 
            productId={idStr as string} 
            productType={product.type} 
            variations={variations} 
            setVariations={setVariations}
            attributes={attributes}
          />
        )}
        {activeTab === 'links' && !isNew && (
          <LinkedProductsTab
            productId={idStr as string}
            productRelations={productRelations}
            setProductRelations={setProductRelations}
          />
        )}
      </div>
    </div>
  );
}
