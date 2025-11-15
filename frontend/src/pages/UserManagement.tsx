import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaUserPlus,
  FaArrowLeft,
  FaUserShield,
  FaUserTie,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaTrash,
  FaExchangeAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaIdBadge,
  FaUserCircle,
  FaUserSlash,
  FaCog,
  FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import type { User, CreateUserData } from '../services/userService';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'recruiter'
  });

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/admin');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carga de usuarios...');
      const data = await userService.getAllUsers();
      console.log('📦 Datos recibidos:', data);
      console.log('📊 Tipo de datos:', typeof data, 'Es array?', Array.isArray(data));
      console.log('📈 Cantidad de usuarios:', data?.length || 0);
      
      // Asegurar que siempre sea un array
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
      console.log('✅ Usuarios cargados exitosamente:', data?.length || 0);
    } catch (err: any) {
      let errorMessage = 'Error al cargar los usuarios';
      
      if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('❌ Error al cargar usuarios:', err);
      console.error('❌ Response:', err.response);
      setUsers([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await userService.createUser(formData);
      setSuccess(`Usuario ${formData.name} creado exitosamente`);
      resetForm();
      
      // Recargar la lista de usuarios
      await loadUsers();
      
      setSuccess('Usuario creado exitosamente');
      resetForm();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      let errorMessage = 'Error al crear el usuario';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Mensajes específicos de validación
      if (errorMessage.includes('password')) {
        errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'El correo electrónico ya está registrado o es inválido';
      } else if (errorMessage.includes('name')) {
        errorMessage = 'El nombre debe tener al menos 2 caracteres';
      }
      
      setError(errorMessage);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (uuid: string, currentRole: string) => {
    console.log('🔍 UUID recibido en handleChangeRole:', uuid);
    console.log('🔍 Longitud del UUID:', uuid.length);
    console.log('🔍 UUID completo:', JSON.stringify(uuid));
    
    const newRole = currentRole === 'admin' ? 'recruiter' : 'admin';
    if (!window.confirm(`¿Cambiar el rol de este usuario a ${newRole}?`)) return;
    
    try {
      setLoading(true);
      await userService.updateUserRole(uuid, newRole);
      await loadUsers();
      setSuccess('Rol actualizado exitosamente');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al cambiar el rol del usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string, email: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${email}?`)) return;
    
    try {
      setLoading(true);
      await userService.deleteUser(uuid);
      await loadUsers();
      setSuccess('Usuario eliminado exitosamente');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al eliminar el usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'recruiter'
    });
    setShowForm(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
      }).format(date);
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <FaUsers /> Gestión de Usuarios
            </h1>
            <p className="text-gray-600">Administra los usuarios del sistema</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
            >
              <FaArrowLeft /> Volver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              {showForm ? <FaExclamationCircle /> : <FaUserPlus />}
              {showForm ? 'Cancelar' : 'Nuevo Usuario'}
            </motion.button>
          </div>
        </motion.div>

        {/* Mensajes */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-lg flex items-center gap-3"
            >
              <FaExclamationCircle className="text-2xl" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-lg flex items-center gap-3"
            >
              <FaCheckCircle className="text-2xl" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600 -mx-8 -mt-8 mb-6"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <FaUserPlus className="text-2xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Juan Pérez"
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaEnvelope className="text-indigo-600" />
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="usuario@ejemplo.com"
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaLock className="text-blue-600" />
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  💡 La contraseña debe tener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
                </p>
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaIdBadge className="text-green-600" />
                  Rol *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'recruiter' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="recruiter">🎯 Reclutador</option>
                  <option value="admin">👑 Administrador</option>
                </select>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <strong className="text-blue-700">Reclutador:</strong>
                    <p className="text-gray-600">Gestiona aplicaciones</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <strong className="text-indigo-700">Administrador:</strong>
                    <p className="text-gray-600">Acceso completo</p>
                  </div>
                </div>
              </motion.div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <FaUserPlus />
                      </motion.div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Crear Usuario
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancelar
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600"></div>
          
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <FaUsers className="text-xl text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Lista de Usuarios <span className="text-blue-600">({users.length})</span>
              </h2>
            </div>
          </div>
          
          {loading && users.length === 0 ? (
            <div className="p-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block text-5xl mb-4"
              >
                <FaUserCircle className="text-blue-600" />
              </motion.div>
              <p className="text-gray-500 font-medium">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserSlash className="text-4xl text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">No hay usuarios registrados</p>
              <p className="text-gray-500 text-sm mt-2">Crea un nuevo usuario para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUser /> Nombre
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaEnvelope /> Email
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaIdBadge /> Rol
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaClock /> Creado
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaCog /> Acciones
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.uuid}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: '#eff6ff' }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg">
                            <FaUserCircle className="text-blue-600 text-xl" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{user.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex items-center gap-2 text-xs font-bold rounded-xl ${
                          user.role === 'admin' 
                            ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800' 
                            : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <FaUserShield /> Administrador
                            </>
                          ) : (
                            <>
                              <FaUserTie /> Reclutador
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-slate-500" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {user.uuid && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleChangeRole(user.uuid!, user.role)}
                                className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all"
                                title="Cambiar rol"
                              >
                                <FaExchangeAlt />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(user.uuid!, user.email)}
                                className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
                                title="Eliminar usuario"
                              >
                                <FaTrash />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserManagement;
