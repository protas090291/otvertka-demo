import React, { useState, useEffect } from 'react';
import { Users, Settings, LogOut, Plus, Edit2, Trash2, Shield, UserCheck, UserX, Loader2, AlertCircle, KeyRound, Activity } from 'lucide-react';
import { UserProfile, getAllUserProfiles, createUser, updateUserProfile, deleteUser, sendPasswordResetEmail, signOut, getCurrentUser } from '../lib/authApi';
import SystemStatusView from './SystemStatusView';

interface AdminAppProps {
  onExit: () => void;
}

const AdminApp: React.FC<AdminAppProps> = ({ onExit }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'users' | 'system-status'>('users');

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserProfile['role'],
  });

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    const { user } = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const { profiles, error: err } = await getAllUserProfiles();
    if (err) {
      setError(err);
    } else {
      setUsers(profiles);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.password) {
      setError('Email и пароль обязательны');
      return;
    }

    const { user, error: err } = await createUser({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name || undefined,
      role: formData.role,
    });

    if (err || !user) {
      setError(err || 'Ошибка создания пользователя');
    } else {
      setSuccess(`Пользователь ${user.email} успешно создан`);
      setShowCreateModal(false);
      setFormData({ email: '', password: '', full_name: '', role: 'user' });
      loadUsers();
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError(null);
    setSuccess(null);

    const { user, error: err } = await updateUserProfile(editingUser.id, {
      full_name: formData.full_name || null,
      role: formData.role,
    });

    if (err || !user) {
      setError(err || 'Ошибка обновления пользователя');
    } else {
      setSuccess(`Пользователь ${user.email} успешно обновлён`);
      setEditingUser(null);
      setFormData({ email: '', password: '', full_name: '', role: 'user' });
      loadUsers();
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    setError(null);
    setSuccess(null);

    const { error: err } = await updateUserProfile(user.id, {
      is_active: !user.is_active,
    });

    if (err) {
      setError(err);
    } else {
      setSuccess(`Пользователь ${user.email} ${!user.is_active ? 'активирован' : 'деактивирован'}`);
      loadUsers();
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.email}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error: err } = await deleteUser(user.id);

    if (err) {
      setError(err);
    } else {
      setSuccess(`Пользователь ${user.email} удалён`);
      loadUsers();
    }
  };

  const handleSendPasswordReset = async (user: UserProfile) => {
    setError(null);
    setSuccess(null);
    const { error: err } = await sendPasswordResetEmail(user.email);
    if (err) {
      setError(err);
    } else {
      setSuccess(`На ${user.email} отправлено письмо со ссылкой для задания нового пароля.`);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Не показываем пароль
      full_name: user.full_name || '',
      role: user.role,
    });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', full_name: '', role: 'user' });
    setError(null);
    setSuccess(null);
  };

  const getRoleLabel = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'management':
        return 'Руководство';
      case 'user':
        return 'Рабочий';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'management':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'user':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-orange-400/20 blur-[120px]" />
        <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-red-500/10 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 fixed top-0 left-0 right-0 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500/30 to-red-400/30 px-3 py-1 text-[11px] uppercase tracking-[0.4em] text-orange-100 font-semibold">
              АДМИНИСТРИРОВАНИЕ
            </div>
            <h1 className="text-xl font-semibold text-white">Отвёртка</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-300">
              {currentUser?.full_name || currentUser?.email}
            </div>
            <button
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-white/10">
            <button
              onClick={() => setAdminTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                adminTab === 'users'
                  ? 'bg-slate-800/80 text-white border-b-2 border-blue-400 -mb-px'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Пользователи
            </button>
            <button
              onClick={() => setAdminTab('system-status')}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                adminTab === 'system-status'
                  ? 'bg-slate-800/80 text-white border-b-2 border-blue-400 -mb-px'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              Статус системы
            </button>
          </div>

          {adminTab === 'system-status' ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg p-6">
              <SystemStatusView />
            </div>
          ) : (
            <>
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Управление пользователями</h2>
              <p className="text-slate-400">Создание, редактирование и управление пользователями системы</p>
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setEditingUser(null);
                setFormData({ email: '', password: '', full_name: '', role: 'user' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Создать пользователя
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/20 border border-red-500/50 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl bg-green-500/20 border border-green-500/50 p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-green-300" />
              <p className="text-green-200">{success}</p>
            </div>
          )}

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Имя</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Роль</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Статус</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Создан</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{user.full_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                <UserCheck className="w-3 h-3" />
                                Активен
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                <UserX className="w-3 h-3" />
                                Деактивирован
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSendPasswordReset(user)}
                                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                title="Отправить сброс пароля"
                              >
                                <KeyRound className="w-4 h-4 text-amber-400" />
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                title="Редактировать"
                              >
                                <Edit2 className="w-4 h-4 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(user)}
                                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                title={user.is_active ? 'Деактивировать' : 'Активировать'}
                              >
                                {user.is_active ? (
                                  <UserX className="w-4 h-4 text-yellow-400" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-400" />
                                )}
                              </button>
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
            </h3>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Пароль</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Полное имя</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Роль</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserProfile['role'] })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Рабочий</option>
                  <option value="management">Руководство</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  {editingUser ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApp;
