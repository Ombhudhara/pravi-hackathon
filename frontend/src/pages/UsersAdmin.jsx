import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Users, Plus, Edit2, KeyRound, Power, PowerOff } from 'lucide-react';

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ full_name: '', email: '', role: 'OFFICER', department: '', password: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      
      const res = await fetchApi(`/api/users?${params}`);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.data?.errors?.[0]?.message || err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await fetchApi(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department
        })
      });
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await fetchApi(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: formData.password })
      });
      setIsResetModalOpen(false);
    } catch (err) {
      setFormError(err.data?.errors?.[0]?.message || err.message || 'Failed to reset password.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setFormLoading(true);
    try {
      await fetchApi(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !selectedUser.is_active })
      });
      setIsConfirmModalOpen(false);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to change status.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({ full_name: user.full_name, role: user.role, department: user.department || '', email: user.email });
    setIsEditModalOpen(true);
  };

  const openReset = (user) => {
    setSelectedUser(user);
    setFormData({ password: '' });
    setIsResetModalOpen(true);
  };

  const openStatusConfirm = (user) => {
    setSelectedUser(user);
    setIsConfirmModalOpen(true);
  };

  const renderStatusBadge = (isActive) => (
    <Badge variant={isActive ? 'green' : 'red'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  return (
    <div>
      <PageHeader 
        title="User Management" 
        description="Manage system access and roles."
        action={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => {
            setFormData({ full_name: '', email: '', role: 'OFFICER', department: '', password: '' });
            setIsAddModalOpen(true);
          }}>
            Add User
          </Button>
        }
      />

      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px' }}>
            <Input 
              placeholder="Search name or email..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <Select 
              options={[
                { value: '', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'OFFICER', label: 'Officer' },
                { value: 'MAINTENANCE', label: 'Maintenance' }
              ]}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <Select 
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Card><div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div></Card>
      ) : users.length === 0 ? (
        <EmptyState 
          title="No users found" 
          description="Try adjusting your search or filters." 
          icon={<Users size={48} />} 
        />
      ) : (
        <>
          <Table 
            headers={['Name', 'Email', 'Role', 'Department', 'Status', 'Actions']}
            rows={users}
            renderRow={(u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><Badge variant={u.role === 'ADMIN' ? 'amber' : 'neutral'}>{u.role}</Badge></td>
                <td>{u.department || '-'}</td>
                <td>{renderStatusBadge(u.is_active)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Edit"><Edit2 size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openReset(u)} title="Reset Password"><KeyRound size={16} /></Button>
                    {u.id !== currentUser.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openStatusConfirm(u)}
                        title={u.is_active ? "Deactivate" : "Activate"}
                      >
                        {u.is_active ? <PowerOff size={16} color="var(--color-status-red)" /> : <Power size={16} color="var(--color-status-green)" />}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Page {page} of {pagination.totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New User"
      >
        <form onSubmit={handleAddSubmit} id="add-user-form">
          {formError && <div className="alert alert-danger" style={{ color: 'var(--color-status-red)' }}>{formError}</div>}
          <Input label="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <Select label="Role" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} options={[
            {value: 'OFFICER', label: 'Officer'},
            {value: 'MAINTENANCE', label: 'Maintenance'},
            {value: 'ADMIN', label: 'Admin'}
          ]} />
          <Input label="Department (Optional)" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
          <Input label="Temporary Password" type="password" required helperText="Min 10 chars, 1 letter, 1 number" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading}>{formLoading ? 'Saving...' : 'Add User'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit User"
      >
        <form onSubmit={handleEditSubmit}>
          {formError && <div className="alert alert-danger" style={{ color: 'var(--color-status-red)' }}>{formError}</div>}
          <Input label="Email" value={formData.email} disabled />
          <Input label="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <Select label="Role" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} options={[
            {value: 'OFFICER', label: 'Officer'},
            {value: 'MAINTENANCE', label: 'Maintenance'},
            {value: 'ADMIN', label: 'Admin'}
          ]} />
          <Input label="Department (Optional)" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading}>{formLoading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
        title="Reset Password"
      >
        <form onSubmit={handleResetSubmit}>
          {formError && <div className="alert alert-danger" style={{ color: 'var(--color-status-red)' }}>{formError}</div>}
          <p style={{ marginBottom: '1rem' }}>Setting a new temporary password for <strong>{selectedUser?.full_name}</strong>.</p>
          <Input label="New Password" type="password" required helperText="Min 10 chars, 1 letter, 1 number" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={formLoading}>{formLoading ? 'Resetting...' : 'Reset Password'}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Status Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Action"
      >
        <p style={{ marginBottom: '1.5rem' }}>
          Are you sure you want to {selectedUser?.is_active ? 'deactivate' : 'activate'} <strong>{selectedUser?.full_name}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
          <Button variant={selectedUser?.is_active ? 'danger' : 'primary'} onClick={handleToggleStatus} disabled={formLoading}>
            {formLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
