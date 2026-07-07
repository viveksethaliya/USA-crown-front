import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';

const CategoryNode = ({ node, selectedIds, toggleCategory, depth = 0 }: any) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = (selectedIds || []).includes(node.id);

  return (
    <div className="w-full">
      <div className={`flex items-center py-1.5 px-2 rounded-lg hover:bg-[#312f2c]/5 transition-colors ${depth === 0 ? 'mt-1' : ''}`}>
        <div className="flex-1 flex items-center gap-1" style={{ paddingLeft: `${depth * 1.5}rem` }}>
          {hasChildren ? (
            <button type="button" onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
              className="p-1 text-[#312f2c]/35 hover:text-[#312f2c] transition-colors hover:bg-[#312f2c]/8 rounded">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <label className="flex items-center gap-3 cursor-pointer flex-1 p-1">
            <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(node.id)}
              className="w-4 h-4 rounded border-[#312f2c]/20 accent-[#d1a054] transition-all" />
            <span className={`text-sm ${depth === 0 ? 'text-[#312f2c] font-medium' : 'text-[#312f2c]/65'}`}>
              {node.name}
            </span>
          </label>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="relative">
          <div className="absolute top-0 bottom-0 w-px bg-[#312f2c]/10" style={{ left: `${depth * 1.5 + 1.25}rem` }} />
          {node.children.map((child: any) => (
            <CategoryNode key={child.id} node={child} selectedIds={selectedIds} toggleCategory={toggleCategory} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function OrganizationTab({ product, onChange, categories, tags = [] }: { product: any, onChange: (field: string, value: any) => void, categories: any[], tags?: any[] }) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const toggleCategory = (catId: number) => {
    const ids = product.category_ids || [];
    const isSelected = ids.includes(catId);
    if (isSelected) {
      const getAllChildIds = (id: number): number[] => {
        const children = categories.filter(c => c.parent_id === id).map(c => c.id);
        return [...children, ...children.flatMap(childId => getAllChildIds(childId))];
      };
      const childIdsToRemove = getAllChildIds(catId);
      const idsToRemove = new Set([catId, ...childIdsToRemove]);
      onChange('category_ids', ids.filter((id: number) => !idsToRemove.has(id)));
    } else {
      const getAllParentIds = (id: number): number[] => {
        const cat = categories.find(c => c.id === id);
        if (!cat || !cat.parent_id) return [];
        return [cat.parent_id, ...getAllParentIds(cat.parent_id)];
      };
      const parentIds = getAllParentIds(catId);
      onChange('category_ids', Array.from(new Set([...ids, catId, ...parentIds])));
    }
  };

  const toggleTag = (tagId: number) => {
    const ids = product.tag_ids || [];
    onChange('tag_ids', ids.includes(tagId) ? ids.filter((id: number) => id !== tagId) : [...ids, tagId]);
  };

  const hierarchicalCategories = useMemo(() => {
    const buildHierarchy = (cats: any[], parentId: any = null): any[] => {
      const children = cats.filter(c => c.parent_id === parentId);
      children.sort((a, b) => (a.position || 0) - (b.position || 0));
      return children.map(child => ({ ...child, children: buildHierarchy(cats, child.id) }));
    };
    return buildHierarchy(categories);
  }, [categories]);

  const selectedCatCount = (product.category_ids || []).length;
  const selectedTagCount = (product.tag_ids || []).length;

  const panelCls = "bg-[#ece9e1] border border-[#312f2c]/10 rounded-2xl p-6 space-y-4";

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className={panelCls}>
        <button type="button" onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className="w-full flex items-center justify-between border-b border-[#312f2c]/10 pb-4 text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d1a054]/10 text-[#d1a054] rounded-lg group-hover:bg-[#d1a054]/20 transition-colors border border-[#d1a054]/20">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider flex items-center gap-2">
                Categories
                {isCategoriesExpanded ? <ChevronDown className="w-4 h-4 text-[#312f2c]/35" /> : <ChevronRight className="w-4 h-4 text-[#312f2c]/35" />}
              </h3>
              <p className="text-xs text-[#312f2c]/45 mt-0.5">Select where this product appears</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-[#d1a054]/10 text-[#d1a054] rounded-md border border-[#d1a054]/20">
            {selectedCatCount} selected
          </span>
        </button>
        {isCategoriesExpanded && (
          <div className="max-h-80 overflow-y-auto pr-2">
            {hierarchicalCategories.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[#312f2c]/40 text-sm">No categories created yet.</p>
                <a href="/crown-admin/categories" className="text-[#d1a054] hover:text-[#d1a054]/80 text-sm mt-2 inline-block font-medium">Create categories</a>
              </div>
            ) : (
              <div className="py-2">
                {hierarchicalCategories.map(rootNode => (
                  <CategoryNode key={rootNode.id} node={rootNode} selectedIds={product.category_ids} toggleCategory={toggleCategory} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className={panelCls}>
        <button type="button" onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          className="w-full flex items-center justify-between border-b border-[#312f2c]/10 pb-4 text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#312f2c]/8 text-[#312f2c]/60 rounded-lg group-hover:bg-[#312f2c]/12 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider flex items-center gap-2">
                Tags
                {isTagsExpanded ? <ChevronDown className="w-4 h-4 text-[#312f2c]/35" /> : <ChevronRight className="w-4 h-4 text-[#312f2c]/35" />}
              </h3>
              <p className="text-xs text-[#312f2c]/45 mt-0.5">Assign descriptive tags for filtering</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-[#312f2c]/6 text-[#312f2c]/60 rounded-md border border-[#312f2c]/10">
            {selectedTagCount} selected
          </span>
        </button>
        {isTagsExpanded && (
          <div className="max-h-80 overflow-y-auto pr-2">
            {tags.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[#312f2c]/40 text-sm">No tags created yet.</p>
                <a href="/crown-admin/tags" className="text-[#d1a054] hover:text-[#d1a054]/80 text-sm mt-2 inline-block font-medium">Create tags</a>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 py-2">
                {tags.map(tag => {
                  const isSelected = (product.tag_ids || []).includes(tag.id);
                  return (
                    <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        isSelected
                          ? 'bg-[#d1a054]/15 text-[#d1a054] border-[#d1a054]/40'
                          : 'bg-white/60 text-[#312f2c]/60 border-[#312f2c]/12 hover:border-[#312f2c]/25'
                      }`}>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Settings */}
      <div className={panelCls}>
        <div className="border-b border-[#312f2c]/10 pb-4">
          <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider">Publish Settings</h3>
          <p className="text-xs text-[#312f2c]/45 mt-0.5">Control product visibility on the storefront</p>
        </div>
        <div className="space-y-3 pt-2">
          {[
            { field: 'is_published', label: 'Published', desc: 'Product is visible to customers', activeColor: 'bg-[#d1a054]' },
            { field: 'is_featured', label: 'Featured', desc: 'Highlight this product on the homepage', activeColor: 'bg-[#312f2c]' },
          ].map(({ field, label, desc, activeColor }) => (
            <label key={field} className="flex items-center justify-between p-4 bg-white/40 border border-[#312f2c]/8 rounded-xl cursor-pointer hover:border-[#312f2c]/15 transition-colors">
              <div>
                <span className="text-sm font-medium text-[#312f2c] block">{label}</span>
                <span className="text-xs text-[#312f2c]/45 mt-0.5 block">{desc}</span>
              </div>
              <div onClick={() => onChange(field, !product[field])}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${product[field] ? activeColor : 'bg-[#312f2c]/15'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${product[field] ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
