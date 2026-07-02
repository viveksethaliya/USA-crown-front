import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';

const CategoryNode = ({ node, selectedIds, toggleCategory, depth = 0 }: any) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1); // Expand top level by default

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = (selectedIds || []).includes(node.id);

  return (
    <div className="w-full">
      <div className={`flex items-center py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors ${depth === 0 ? 'mt-1' : ''}`}>
        <div className="flex-1 flex items-center gap-1" style={{ paddingLeft: `${depth * 1.5}rem` }}>
          {hasChildren ? (
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }} 
              className="p-1 text-gray-500 hover:text-white transition-colors hover:bg-gray-700/50 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" /> // spacer
          )}
          
          <label className="flex items-center gap-3 cursor-pointer flex-1 p-1">
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCategory(node.id)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 transition-all"
            />
            <span className={`text-sm ${depth === 0 ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
              {node.name}
            </span>
          </label>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Subtle vertical line connecting children */}
          <div className="absolute top-0 bottom-0 w-px bg-gray-800" style={{ left: `${depth * 1.5 + 1.25}rem` }} />
          {node.children.map((child: any) => (
            <CategoryNode 
              key={child.id} 
              node={child} 
              selectedIds={selectedIds} 
              toggleCategory={toggleCategory} 
              depth={depth + 1} 
            />
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
      // Remove this category and all its children
      const getAllChildIds = (id: number): number[] => {
        const children = categories.filter(c => c.parent_id === id).map(c => c.id);
        return [...children, ...children.flatMap(childId => getAllChildIds(childId))];
      };
      
      const childIdsToRemove = getAllChildIds(catId);
      const idsToRemove = new Set([catId, ...childIdsToRemove]);
      onChange('category_ids', ids.filter((id: number) => !idsToRemove.has(id)));
    } else {
      // Add this category and all its parents
      const getAllParentIds = (id: number): number[] => {
        const cat = categories.find(c => c.id === id);
        if (!cat || !cat.parent_id) return [];
        return [cat.parent_id, ...getAllParentIds(cat.parent_id)];
      };
      
      const parentIds = getAllParentIds(catId);
      const newIds = Array.from(new Set([...ids, catId, ...parentIds]));
      onChange('category_ids', newIds);
    }
  };

  const toggleTag = (tagId: number) => {
    const ids = product.tag_ids || [];
    onChange('tag_ids', ids.includes(tagId)
      ? ids.filter((id: number) => id !== tagId)
      : [...ids, tagId]
    );
  };

  const hierarchicalCategories = useMemo(() => {
    const buildHierarchy = (cats: any[], parentId: any = null): any[] => {
      let result: any[] = [];
      const children = cats.filter(c => c.parent_id === parentId);
      children.sort((a, b) => (a.position || 0) - (b.position || 0));
      for (const child of children) {
        result.push({ ...child, children: buildHierarchy(cats, child.id) });
      }
      return result;
    };
    return buildHierarchy(categories);
  }, [categories]);

  // Count how many selected
  const selectedCatCount = (product.category_ids || []).length;
  const selectedTagCount = (product.tag_ids || []).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Categories */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xl">
        <button 
          type="button"
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className="w-full flex items-center justify-between border-b border-gray-800 pb-4 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Categories
                {isCategoriesExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Select where this product appears</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-gray-800 text-emerald-400 rounded-md border border-gray-700">
            {selectedCatCount} selected
          </span>
        </button>

        {isCategoriesExpanded && (
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-300">
            {hierarchicalCategories.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm">No categories created yet.</p>
                <a href="/crown-admin/categories" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block font-medium">Create categories</a>
              </div>
            ) : (
              <div className="py-2">
                {hierarchicalCategories.map(rootNode => (
                  <CategoryNode 
                    key={rootNode.id} 
                    node={rootNode} 
                    selectedIds={product.category_ids} 
                    toggleCategory={toggleCategory} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xl">
        <button 
          type="button"
          onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          className="w-full flex items-center justify-between border-b border-gray-800 pb-4 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Tags
                {isTagsExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Assign descriptive tags for filtering</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-gray-800 text-indigo-400 rounded-md border border-gray-700">
            {selectedTagCount} selected
          </span>
        </button>

        {isTagsExpanded && (
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-300">
            {tags.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm">No tags created yet.</p>
                <a href="/crown-admin/tags" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block font-medium">Create tags</a>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 py-2">
                {tags.map(tag => {
                  const isSelected = (product.tag_ids || []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        isSelected 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' 
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="border-b border-gray-800 pb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publish Settings</h3>
          <p className="text-xs text-gray-400 mt-0.5">Control product visibility on the storefront</p>
        </div>
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-4 bg-gray-950/50 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors group">
            <div>
              <span className="text-sm font-medium text-gray-200 block group-hover:text-white transition-colors">Published</span>
              <span className="text-xs text-gray-500 mt-0.5 block">Product is visible to customers</span>
            </div>
            <div
              onClick={() => onChange('is_published', !product.is_published)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${product.is_published ? 'bg-emerald-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${product.is_published ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-950/50 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors group">
            <div>
              <span className="text-sm font-medium text-gray-200 block group-hover:text-white transition-colors">Featured</span>
              <span className="text-xs text-gray-500 mt-0.5 block">Highlight this product on the homepage</span>
            </div>
            <div
              onClick={() => onChange('is_featured', !product.is_featured)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${product.is_featured ? 'bg-amber-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${product.is_featured ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
