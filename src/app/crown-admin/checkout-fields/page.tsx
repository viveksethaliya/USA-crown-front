'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown, ChevronUp, GripVertical, Loader2, Pencil, Plus,
  Save, Trash2, X, ToggleLeft, ToggleRight, FormInput, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'email' | 'tel';

interface SelectOption { label: string; value: string; }

interface CheckoutField {
  id: number;
  label: string;
  field_key: string;
  field_type: FieldType;
  placeholder: string | null;
  options: SelectOption[];
  is_required: boolean;
  is_active: boolean;
  role_visibility: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

interface Role { id: number; name: string; slug: string; }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',     label: 'Short text' },
  { value: 'textarea', label: 'Long text / textarea' },
  { value: 'number',   label: 'Number' },
  { value: 'email',    label: 'Email address' },
  { value: 'tel',      label: 'Phone / tel' },
  { value: 'select',   label: 'Dropdown / select' },
  { value: 'checkbox', label: 'Checkbox (yes/no)' },
];

const EMPTY_FIELD: Omit<CheckoutField, 'id' | 'field_key' | 'created_at' | 'updated_at'> = {
  label: '',
  field_type: 'text',
  placeholder: '',
  options: [],
  is_required: false,
  is_active: true,
  role_visibility: [],
  position: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/checkout-fields${path}`, { ...init, headers: { ...authHeader(), ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json as T;
}

// ---------------------------------------------------------------------------
// Field type badge
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: FieldType }) {
  const palette: Record<FieldType, string> = {
    text:     'bg-blue-50 text-blue-700 border-blue-100',
    textarea: 'bg-purple-50 text-purple-700 border-purple-100',
    select:   'bg-amber-50 text-amber-700 border-amber-100',
    checkbox: 'bg-green-50 text-green-700 border-green-100',
    number:   'bg-cyan-50 text-cyan-700 border-cyan-100',
    email:    'bg-rose-50 text-rose-700 border-rose-100',
    tel:      'bg-teal-50 text-teal-700 border-teal-100',
  };
  const label = FIELD_TYPES.find(f => f.value === type)?.label ?? type;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${palette[type]}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Options Editor (for select fields)
// ---------------------------------------------------------------------------
function OptionsEditor({ options, onChange }: { options: SelectOption[]; onChange: (o: SelectOption[]) => void }) {
  const addOption = () => onChange([...options, { label: '', value: '' }]);
  const removeOption = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, field: 'label' | 'value', val: string) =>
    onChange(options.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Options</span>
        <button type="button" onClick={addOption}
          className="inline-flex items-center gap-1 rounded-lg bg-[#d1a054]/10 px-2.5 py-1 text-xs font-bold text-[#9b7132] hover:bg-[#d1a054]/20">
          <Plus className="h-3 w-3" /> Add option
        </button>
      </div>
      {options.length === 0 && (
        <p className="rounded-lg border border-dashed border-[#312f2c]/15 p-3 text-center text-xs text-[#312f2c]/40">
          No options yet — add at least one.
        </p>
      )}
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)}
            placeholder="Label shown to customer" className="min-w-0 flex-1 rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30" />
          <input value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)}
            placeholder="Stored value" className="w-36 rounded-lg border border-[#312f2c]/10 bg-white px-3 py-2 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30" />
          <button type="button" onClick={() => removeOption(i)}
            className="rounded-lg p-1.5 text-[#312f2c]/35 hover:bg-red-50 hover:text-red-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide-over modal for create / edit
// ---------------------------------------------------------------------------
interface ModalProps {
  field: Partial<CheckoutField> | null;
  roles: Role[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<CheckoutField>) => void;
}

function FieldModal({ field, roles, saving, onClose, onSave }: ModalProps) {
  const isNew = !field?.id;
  const [form, setForm] = useState<Partial<CheckoutField>>({
    ...EMPTY_FIELD,
    ...field,
    options: field?.options ?? [],
    role_visibility: field?.role_visibility ?? [],
  });

  const set = (key: keyof CheckoutField, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleRole = (slug: string) => {
    const current = form.role_visibility ?? [];
    set('role_visibility', current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#312f2c]/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-[520px] flex-col bg-[#f0ede5] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#312f2c]/10 bg-white/60 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#312f2c]">{isNew ? 'New checkout field' : 'Edit checkout field'}</h2>
            {!isNew && field?.field_key && (
              <p className="mt-0.5 font-mono text-xs text-[#312f2c]/40">key: {field.field_key}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#312f2c]/45 hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'none' }}>
          {/* Label */}
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">
              Label <span className="text-red-500">*</span>
            </span>
            <input value={form.label ?? ''} onChange={e => set('label', e.target.value)}
              placeholder="e.g. Company Tax ID"
              className="mt-1.5 w-full rounded-xl border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30" />
          </label>

          {/* Field type */}
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">
              Field type <span className="text-red-500">*</span>
            </span>
            <select value={form.field_type ?? 'text'} onChange={e => set('field_type', e.target.value as FieldType)}
              className="mt-1.5 w-full rounded-xl border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30">
              {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
            </select>
          </label>

          {/* Placeholder (not shown for checkbox) */}
          {form.field_type !== 'checkbox' && (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Placeholder text</span>
              <input value={form.placeholder ?? ''} onChange={e => set('placeholder', e.target.value)}
                placeholder="Hint shown inside the field"
                className="mt-1.5 w-full rounded-xl border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30" />
            </label>
          )}

          {/* Options (only for select) */}
          {form.field_type === 'select' && (
            <div className="rounded-xl border border-[#312f2c]/10 bg-white/60 p-4">
              <OptionsEditor options={form.options ?? []} onChange={opts => set('options', opts)} />
            </div>
          )}

          {/* Toggles row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#312f2c]/10 bg-white/60 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Required</p>
              <button type="button" onClick={() => set('is_required', !form.is_required)}
                className={`mt-2 flex items-center gap-2 text-sm font-semibold transition-colors ${form.is_required ? 'text-[#d1a054]' : 'text-[#312f2c]/40'}`}>
                {form.is_required ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                {form.is_required ? 'Yes' : 'No'}
              </button>
            </div>
            <div className="rounded-xl border border-[#312f2c]/10 bg-white/60 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Active</p>
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`mt-2 flex items-center gap-2 text-sm font-semibold transition-colors ${form.is_active ? 'text-green-600' : 'text-[#312f2c]/40'}`}>
                {form.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                {form.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Role Visibility */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">
              Role visibility
              <span className="ml-2 normal-case font-normal text-[#312f2c]/35">(empty = all roles)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.map(role => {
                const active = (form.role_visibility ?? []).includes(role.slug);
                return (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.slug)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${active
                      ? 'border-[#312f2c] bg-[#312f2c] text-[#f0ede5]'
                      : 'border-[#312f2c]/15 bg-white text-[#312f2c]/55 hover:border-[#312f2c]/40'}`}>
                    {role.name}
                  </button>
                );
              })}
              {roles.length === 0 && <p className="text-xs text-[#312f2c]/35">No roles found</p>}
            </div>
          </div>

          {/* Position */}
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#312f2c]/50">Display order (position)</span>
            <input type="number" min="0" value={form.position ?? 0}
              onChange={e => set('position', Number(e.target.value) || 0)}
              className="mt-1.5 w-24 rounded-xl border border-[#312f2c]/10 bg-white px-3 py-2.5 text-sm text-[#312f2c] outline-none focus:ring-2 focus:ring-[#d1a054]/30" />
          </label>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#312f2c]/10 bg-white/60 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#312f2c]/55 hover:text-[#312f2c]">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312f2c] px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 hover:bg-[#312f2c]/85">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Create field' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function CheckoutFieldsPage() {
  const [fields, setFields] = useState<CheckoutField[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Partial<CheckoutField> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [fieldsData, rolesData] = await Promise.all([
        apiFetch<CheckoutField[]>(''),
        fetch(`${API}/permissions/roles`, { headers: authHeader() })
          .then(r => r.json())
          .then(d => (Array.isArray(d) ? d : []) as Role[]),
      ]);
      setFields(fieldsData);
      setRoles(rolesData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (f: CheckoutField) => { setEditTarget(f); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = async (form: Partial<CheckoutField>) => {
    try {
      setSaving(true);
      if (editTarget?.id) {
        const updated = await apiFetch<CheckoutField>(`/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(form) });
        setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success('Field updated');
      } else {
        const created = await apiFetch<CheckoutField>('', { method: 'POST', body: JSON.stringify(form) });
        setFields(prev => [...prev, created].sort((a, b) => a.position - b.position || a.id - b.id));
        toast.success('Field created');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (field: CheckoutField) => {
    try {
      const updated = await apiFetch<CheckoutField>(`/${field.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...field, is_active: !field.is_active }),
      });
      setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this checkout field? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await apiFetch(`/${id}`, { method: 'DELETE' });
      setFields(prev => prev.filter(f => f.id !== id));
      toast.success('Field deleted');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Drag-to-reorder ----
  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragEnter = (index: number) => { setDragOver(index); };
  const handleDrop = async (index: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === index) { setDragOver(null); return; }
    const reordered = [...fields];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    setFields(reordered);
    setDragOver(null);
    dragIndexRef.current = null;
    try {
      await apiFetch('/reorder', { method: 'PUT', body: JSON.stringify({ ids: reordered.map(f => f.id) }) });
    } catch (err: any) {
      toast.error('Failed to save new order');
      void load();
    }
  };

  const moveField = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setFields(reordered);
    try {
      await apiFetch('/reorder', { method: 'PUT', body: JSON.stringify({ ids: reordered.map(f => f.id) }) });
    } catch (err: any) {
      toast.error('Failed to save order');
      void load();
    }
  };

  // ---- Render ----
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 pb-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d1a054]/15">
            <FormInput className="h-5 w-5 text-[#d1a054]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#312f2c]">Checkout Fields</h1>
            <p className="mt-0.5 text-sm text-[#312f2c]/50">
              Custom fields shown to customers at checkout — configure labels, types, and role visibility.
            </p>
          </div>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#312f2c] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#312f2c]/85">
          <Plus className="h-4 w-4" /> New field
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#d1a054]/20 bg-[#d1a054]/8 px-5 py-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d1a054]" />
        <p className="text-sm text-[#9b7132]">
          Fields are displayed to customers during checkout in the order shown below. Drag rows or use the arrows to reorder.
          Submitted values are stored per-order and visible in the Order Detail view.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#d1a054]" />
        </div>
      ) : fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#312f2c]/15 bg-white/40 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#312f2c]/5">
            <FormInput className="h-8 w-8 text-[#312f2c]/25" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#312f2c]/60">No checkout fields yet</p>
            <p className="mt-1 text-sm text-[#312f2c]/40">Create your first field to collect custom data at checkout.</p>
          </div>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d1a054] px-4 py-2.5 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Create first field
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/45 shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_140px_100px_80px_100px_96px] items-center border-b border-[#312f2c]/8 bg-[#312f2c]/4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/40">
            <span />
            <span>Field</span>
            <span>Type</span>
            <span>Required</span>
            <span>Status</span>
            <span>Visibility</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#312f2c]/6">
            {fields.map((field, index) => (
              <div key={field.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => setDragOver(null)}
                className={`grid grid-cols-[40px_1fr_140px_100px_80px_100px_96px] items-center gap-0 px-4 py-3.5 transition-colors ${dragOver === index ? 'bg-[#d1a054]/8 ring-2 ring-inset ring-[#d1a054]/30' : 'hover:bg-white/50'}`}>

                {/* Drag handle + reorder buttons */}
                <div className="flex flex-col items-center gap-0.5">
                  <GripVertical className="h-4 w-4 cursor-grab text-[#312f2c]/25 active:cursor-grabbing" />
                  <button onClick={() => moveField(index, -1)} disabled={index === 0}
                    className="rounded p-0.5 text-[#312f2c]/25 hover:text-[#312f2c]/60 disabled:opacity-0">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}
                    className="rounded p-0.5 text-[#312f2c]/25 hover:text-[#312f2c]/60 disabled:opacity-0">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Field info */}
                <div className="min-w-0 pr-3">
                  <p className="truncate font-semibold text-[#312f2c]">{field.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-[#312f2c]/35">{field.field_key}</p>
                </div>

                {/* Type */}
                <div><TypeBadge type={field.field_type} /></div>

                {/* Required */}
                <div>
                  {field.is_required
                    ? <span className="text-xs font-semibold text-red-500">Required</span>
                    : <span className="text-xs text-[#312f2c]/35">Optional</span>}
                </div>

                {/* Active toggle */}
                <div>
                  <button onClick={() => toggleActive(field)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all ${field.is_active
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-[#312f2c]/8 text-[#312f2c]/40 hover:bg-[#312f2c]/12'}`}>
                    {field.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                    {field.is_active ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* Role visibility */}
                <div className="pr-2">
                  {field.role_visibility.length === 0
                    ? <span className="text-xs text-[#312f2c]/35">All roles</span>
                    : <div className="flex flex-wrap gap-1">
                        {field.role_visibility.map(slug => (
                          <span key={slug} className="rounded-full bg-[#312f2c]/8 px-2 py-0.5 text-[10px] font-semibold text-[#312f2c]/60">
                            {slug}
                          </span>
                        ))}
                      </div>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(field)}
                    className="rounded-lg p-2 text-[#312f2c]/45 hover:bg-white hover:text-[#312f2c]">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(field.id)} disabled={deletingId === field.id}
                    className="rounded-lg p-2 text-[#312f2c]/35 hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                    {deletingId === field.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="border-t border-[#312f2c]/8 px-5 py-3">
            <p className="text-xs text-[#312f2c]/40">{fields.length} field{fields.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <FieldModal
          field={editTarget}
          roles={roles}
          saving={saving}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
