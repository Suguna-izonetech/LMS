import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import api from '../api/client';
import {
  Breadcrumb,
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Select
} from '../components/ui';
import { useToast } from '../context/ToastContext';

export const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/institute-admin/users', formData);
      success('User created successfully');
      navigate('/institute-admin/institute-manager/users');
    } catch (err: any) {
      console.error('Error creating user:', err);
      showError(err.response?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Institute Admin', path: '/institute-admin/dashboard' },
          { label: 'Manage Users', path: '/institute-admin/institute-manager/users' },
          { label: 'Create User' }
        ]}
      />

      <div className="flex items-center justify-between">
        <PageHeader
          title="Create New User"
          description="Add a new student, teacher, or staff member to your institution."
        />
        <Button
          variant="outline"
          onClick={() => navigate('/institute-admin/institute-manager/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  First Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Jane"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Last Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address *
              </label>
              <Input
                type="email"
                required
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password *
              </label>
              <Input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Role *
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'staff', label: 'Staff' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Account Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/institute-admin/institute-manager/users')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;
