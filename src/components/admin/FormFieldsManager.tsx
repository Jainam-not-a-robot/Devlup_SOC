import React, { useState, useEffect } from 'react';
import { fetchFormFields, createFormField, updateFormField, deleteFormField, fetchProjects as fetchProjectsApi } from '../../services/apiClient';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options?: string[]; // For dropdown: custom options. If type is "project_dropdown", options are fetched dynamically.
}

const FormFieldsManager = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    required: true,
    order: 0,
    options: [] as string[],
  });
  const [optionInput, setOptionInput] = useState('');

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFormFields();
      setFields(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load form fields');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'order' ? parseInt(value as string) || 0 : value,
    });
  };

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !formData.options.includes(trimmed)) {
      setFormData({ ...formData, options: [...formData.options, trimmed] });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (opt: string) => {
    setFormData({ ...formData, options: formData.options.filter(o => o !== opt) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = { ...formData };
      // Only send options for dropdown type
      if (formData.type !== 'dropdown') {
        delete payload.options;
      }
      if (editingId) {
        await updateFormField(editingId, payload);
      } else {
        await createFormField(payload);
      }
      setEditingId(null);
      setFormData({ name: '', label: '', type: 'text', required: true, order: 0, options: [] });
      setOptionInput('');
      loadFields();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving form field');
    }
  };

  const handleEdit = (field: FormField) => {
    setEditingId(field.id);
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      options: field.options || [],
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await deleteFormField(id);
        loadFields();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error deleting field');
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text';
      case 'email': return 'Email';
      case 'url': return 'URL';
      case 'number': return 'Number';
      case 'checkbox': return 'Checkbox';
      case 'dropdown': return 'Dropdown';
      case 'project_dropdown': return 'Project Dropdown';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>Form Fields Manager</h2>
      </div>

      {error && <div className="text-red-500 bg-red-500/10 p-4 rounded-md">{error}</div>}

      <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--terminal-window-border)', background: 'rgba(0,0,0,0.5)' }}>
        <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Field' : 'Add New Field'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Internal Name (e.g., mentee_name)</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/50 border outline-none focus:border-[var(--accent-color)]"
                style={{ borderColor: 'var(--terminal-window-border)' }}
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Display Label (e.g., Full Name)</label>
              <input
                required
                name="label"
                value={formData.label}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/50 border outline-none focus:border-[var(--accent-color)]"
                style={{ borderColor: 'var(--terminal-window-border)' }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Input Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/50 border outline-none focus:border-[var(--accent-color)]"
                style={{ borderColor: 'var(--terminal-window-border)' }}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="number">Number</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown (Custom Options)</option>
                <option value="project_dropdown">Dropdown (Ongoing Projects)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/50 border outline-none focus:border-[var(--accent-color)]"
                style={{ borderColor: 'var(--terminal-window-border)' }}
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="required"
                  checked={formData.required}
                  onChange={handleChange}
                  className="rounded border-[var(--terminal-window-border)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] bg-black/50"
                />
                <span>Required Field</span>
              </label>
            </div>
          </div>

          {/* Dropdown options editor */}
          {formData.type === 'dropdown' && (
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--terminal-window-border)', background: 'rgba(0,0,0,0.3)' }}>
              <label className="block text-sm mb-2 text-gray-300">Dropdown Options</label>
              <div className="flex gap-2 mb-3">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                  placeholder="Type an option and press Enter or Add"
                  className="flex-1 p-2 rounded bg-black/50 border outline-none focus:border-[var(--accent-color)]"
                  style={{ borderColor: 'var(--terminal-window-border)' }}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-4 py-2 rounded font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--accent-color)', color: 'black' }}
                >
                  Add
                </button>
              </div>
              {formData.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.options.map((opt) => (
                    <span
                      key={opt}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-white/10 border border-white/20"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt)}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No options added yet.</p>
              )}
            </div>
          )}

          {formData.type === 'project_dropdown' && (
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--terminal-window-border)', background: 'rgba(0,0,0,0.3)' }}>
              <p className="text-sm text-gray-300">
                ℹ️ This dropdown will automatically populate with the list of ongoing projects from the database.
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-6 py-2 rounded font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--accent-color)', color: 'black' }}
            >
              {editingId ? 'Update Field' : 'Create Field'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', label: '', type: 'text', required: true, order: 0, options: [] });
                  setOptionInput('');
                }}
                className="px-6 py-2 rounded font-semibold border transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--terminal-window-border)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--terminal-window-border)' }}>
        <table className="w-full text-left">
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th className="p-4 border-b border-[var(--terminal-window-border)]">Order</th>
              <th className="p-4 border-b border-[var(--terminal-window-border)]">Label</th>
              <th className="p-4 border-b border-[var(--terminal-window-border)]">Name</th>
              <th className="p-4 border-b border-[var(--terminal-window-border)]">Type</th>
              <th className="p-4 border-b border-[var(--terminal-window-border)]">Required</th>
              <th className="p-4 border-b border-[var(--terminal-window-border)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--terminal-window-border)] bg-black/20">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">Loading fields...</td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">No form fields found</td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr key={field.id} className="transition-colors hover:bg-white/5">
                  <td className="p-4">{field.order}</td>
                  <td className="p-4 font-medium">{field.label}</td>
                  <td className="p-4 text-gray-400 font-mono text-sm">{field.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-white/10">{getTypeLabel(field.type)}</span>
                    {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">({field.options.length} options)</span>
                    )}
                  </td>
                  <td className="p-4">{field.required ? 'Yes' : 'No'}</td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => handleEdit(field)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormFieldsManager;
