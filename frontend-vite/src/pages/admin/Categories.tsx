// frontend/src/pages/admin/Categories.tsx - FULL PRODUCTION
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { Plus, Edit, Trash2, Folder, X, Save } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  is_active: boolean;
  products_count?: number;
  children?: Category[];
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    is_active: true,
    image: null as File | null,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: String(category.parent_id || ''),
        is_active: category.is_active,
        image: null,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parent_id: '',
        is_active: true,
        image: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      is_active: true,
      image: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('parent_id', formData.parent_id);
      submitData.append('is_active', formData.is_active ? '1' : '0');
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, submitData);
        alert('Category updated successfully!');
      } else {
        await adminService.createCategory(submitData);
        alert('Category created successfully!');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await adminService.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Cannot delete category with products or subcategories');
    }
  };

  const renderCategoryRow = (category: Category, level = 0) => (
    <React.Fragment key={category.id}>
      <tr className="hover:bg-gray-50 border-b">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            <Folder className="text-blue-600" size={20} />
            <span className="font-semibold">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{category.slug}</td>
        <td className="px-6 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            category.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{category.products_count || 0} products</td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenModal(category)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
      {category.children?.map(child => renderCategoryRow(child, level + 1))}
    </React.Fragment>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categories Management</h1>
            <p className="text-gray-600 mt-1">{categories.length} total categories</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Slug</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Products</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Folder size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No categories found</p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="mt-4 text-blue-600 hover:underline"
                    >
                      Create your first category
                    </button>
                  </td>
                </tr>
              ) : (
                categories.filter(c => !c.parent_id).map(category => renderCategoryRow(category))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Top Level)</option>
                      {categories.filter(c => c.id !== editingCategory?.id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Category Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div>
                        <p className="font-semibold">Active</p>
                        <p className="text-sm text-gray-600">Category will be visible to customers</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Saving...' : (
                      <>
                        <Save size={20} />
                        {editingCategory ? 'Update' : 'Create'} Category
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;