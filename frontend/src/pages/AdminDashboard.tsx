import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartLine, 
  FaUsers, 
  FaBriefcase, 
  FaClipboardList, 
  FaCheckCircle, 
  FaTimesCircle,
  FaClock,
  FaUserTie,
  FaSignOutAlt,
  FaDownload,
  FaTrash,
  FaEye,
  FaFilter,
  FaUsersCog,
  FaStar,
  FaTimes,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaStickyNote,
  FaFileAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import type { Application, Vacancy } from '../types';
import { applicationService } from '../services/applicationService';
import { documentService } from '../services/documentService';
import { vacancyService } from '../services/vacancyService';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [vacancies, setVacancies] = useState<Map<string, Vacancy>>(new Map());
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const apps = await applicationService.getAllApplications();
      setApplications(apps);

      // Cargar todas las vacantes
      const vacancyMap = new Map<string, Vacancy>();
      const uniqueVacancyIds = [...new Set(apps.map(app => app.vacancyId))];
      
      await Promise.all(
        uniqueVacancyIds.map(async (vacancyId) => {
          try {
            const vacancy = await vacancyService.getVacancyById(vacancyId);
            vacancyMap.set(vacancyId, vacancy);
          } catch (err) {
            console.error(`Error al cargar vacante ${vacancyId}:`, err);
          }
        })
      );
      
      setVacancies(vacancyMap);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      // Encontrar la aplicación actual para verificar si el estado es diferente
      const currentApp = applications.find(app => app.uuid === applicationId);
      if (currentApp && currentApp.status === newStatus) {
        // No hacer nada si el estado es el mismo
        return;
      }

      await applicationService.updateApplicationStatus(applicationId, newStatus, notes);
      await loadData();
      alert('Estado actualizado correctamente');
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado: ' + (err.response?.data?.message || err.message || 'Error desconocido'));
      // Recargar datos para restaurar el estado correcto en el UI
      await loadData();
    }
  };

  const handleDownloadCV = async (applicationId: string) => {
    try {
      await documentService.downloadDocument(applicationId);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      alert('Error al descargar el CV. Verifica que el documento exista.');
    }
  };

  const handleDeleteOne = async (applicationId: string, applicantName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la aplicación de ${applicantName}?`)) {
      return;
    }

    try {
      await applicationService.deleteApplication(applicationId);
      await loadData();
      alert('Aplicación eliminada correctamente');
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar la aplicación');
    }
  };

  const handleBulkDelete = async (status: 'accepted' | 'rejected') => {
    const statusLabel = status === 'accepted' ? 'aceptados' : 'rechazados';
    const count = applications.filter(app => app.status === status).length;

    if (count === 0) {
      alert(`No hay candidatos ${statusLabel} para eliminar`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar TODOS los ${count} candidatos ${statusLabel}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const result = await applicationService.bulkDeleteByStatus(status);
      await loadData();
      alert(`${result.deleted} candidatos eliminados correctamente`);
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar los candidatos');
    }
  };

  const openModal = (app: Application) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedApp(null);
    setShowModal(false);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      interviewed: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      reviewing: 'En Revisión',
      interviewed: 'Entrevistado',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatColombianDate = (dateString: string) => {
    // La fecha viene en UTC, convertir a Colombia (UTC-5)
    const date = new Date(dateString + 'Z'); // Forzar interpretación como UTC
    return date.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  // Paginación
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApplications = filteredApplications.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50'>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50'
      >
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <Link to='/' className='text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent flex items-center gap-2'>
            <FaStar className='text-slate-600' />
            PRISMA.COM
          </Link>
          <div className='flex items-center gap-3'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to='/admin/vacancies'
                className='flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium'
              >
                <FaBriefcase /> Gestión de Vacantes
              </Link>
            </motion.div>
            {user?.role === 'admin' && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to='/admin/users'
                  className='flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all font-medium'
                >
                  <FaUsersCog /> Gestión de Usuarios
                </Link>
              </motion.div>
            )}
            <div className='flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl'>
              <FaUserTie className='text-slate-600' />
              <span className='text-sm font-medium text-gray-700'>
                {user?.email}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className='flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium'
            >
              <FaSignOutAlt /> Cerrar Sesión
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className='container mx-auto px-4 py-8'>
        {/* Header con título */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-4xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2'>
            Panel de Administración
          </h1>
          <p className='text-gray-600'>Gestiona todas las postulaciones de candidatos</p>
        </motion.div>

        {/* Estadísticas */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500'
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='bg-blue-100 p-3 rounded-xl'>
                <FaClipboardList className='text-2xl text-blue-600' />
              </div>
              <span className='text-3xl font-bold text-blue-600'>{applications.length}</span>
            </div>
            <p className='text-sm text-gray-600 font-medium'>Total Aplicaciones</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500'
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='bg-yellow-100 p-3 rounded-xl'>
                <FaClock className='text-2xl text-yellow-600' />
              </div>
              <span className='text-3xl font-bold text-yellow-600'>
                {applications.filter(a => a.status === 'pending').length}
              </span>
            </div>
            <p className='text-sm text-gray-600 font-medium'>Pendientes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500'
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='bg-purple-100 p-3 rounded-xl'>
                <FaChartLine className='text-2xl text-purple-600' />
              </div>
              <span className='text-3xl font-bold text-purple-600'>
                {applications.filter(a => a.status === 'reviewing' || a.status === 'interviewed').length}
              </span>
            </div>
            <p className='text-sm text-gray-600 font-medium'>En Proceso</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500'
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='bg-green-100 p-3 rounded-xl'>
                <FaCheckCircle className='text-2xl text-green-600' />
              </div>
              <span className='text-3xl font-bold text-green-600'>
                {applications.filter(a => a.status === 'accepted').length}
              </span>
            </div>
            <p className='text-sm text-gray-600 font-medium'>Aceptados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500'
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='bg-red-100 p-3 rounded-xl'>
                <FaTimesCircle className='text-2xl text-red-600' />
              </div>
              <span className='text-3xl font-bold text-red-600'>
                {applications.filter(a => a.status === 'rejected').length}
              </span>
            </div>
            <p className='text-sm text-gray-600 font-medium'>Rechazados</p>
          </motion.div>
        </div>

        {/* Filtros modernos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-white rounded-2xl shadow-lg p-6 mb-6'
        >
          <div className='flex items-center gap-3 mb-4'>
            <FaFilter className='text-purple-600 text-xl' />
            <h2 className='text-xl font-bold text-gray-800'>Filtrar Aplicaciones</h2>
          </div>
          <div className='flex flex-wrap gap-3'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaUsers className='inline mr-2' /> Todas ({applications.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('pending')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaClock className='inline mr-2' /> Pendientes ({applications.filter(a => a.status === 'pending').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('reviewing')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'reviewing' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaChartLine className='inline mr-2' /> En Revisión ({applications.filter(a => a.status === 'reviewing').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('interviewed')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'interviewed' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaUserTie className='inline mr-2' /> Entrevistados ({applications.filter(a => a.status === 'interviewed').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('accepted')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'accepted' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCheckCircle className='inline mr-2' /> Aceptados ({applications.filter(a => a.status === 'accepted').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('rejected')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === 'rejected' 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaTimesCircle className='inline mr-2' /> Rechazados ({applications.filter(a => a.status === 'rejected').length})
            </motion.button>
          </div>
        </motion.div>

        {/* Botones de eliminación masiva */}
        {(filter === 'accepted' || filter === 'rejected') && filteredApplications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl shadow-lg'
          >
            <div className='flex items-start gap-4'>
              <div className='bg-red-100 p-3 rounded-xl'>
                <FaTrash className='text-2xl text-red-600' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-red-800 mb-2'>⚠️ Zona de Peligro</h3>
                <p className='text-sm text-red-700 mb-4'>
                  Puedes eliminar permanentemente todos los candidatos {filter === 'accepted' ? 'aceptados' : 'rechazados'} de la base de datos. Esta acción no se puede deshacer.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBulkDelete(filter as 'accepted' | 'rejected')}
                  className='flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-bold'
                >
                  <FaTrash /> Eliminar todos los {filter === 'accepted' ? 'aceptados' : 'rechazados'} ({filteredApplications.length})
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center py-12 bg-white rounded-2xl shadow-lg'
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className='text-5xl text-purple-600 mb-4'
            >
              <FaUsers />
            </motion.div>
            <p className='text-xl font-semibold text-gray-700'>Cargando aplicaciones...</p>
          </motion.div>
        ) : filteredApplications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='text-center py-12 bg-white rounded-2xl shadow-lg'
          >
            <div className='text-6xl text-gray-300 mb-4'>
              <FaClipboardList />
            </div>
            <p className='text-xl font-semibold text-gray-700 mb-2'>No hay aplicaciones</p>
            <p className='text-gray-500'>
              {filter !== 'all' ? 'No se encontraron aplicaciones con este estado' : 'Aún no hay postulaciones'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className='bg-white rounded-2xl shadow-xl overflow-hidden'
          >
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gradient-to-r from-gray-50 to-gray-100'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Candidato
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Vacante
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Contacto
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Documento
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Fecha
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-100'>
                {currentApplications.map((app) => (
                  <tr key={app.uuid} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {app.applicantName}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900'>
                        {vacancies.get(app.vacancyId)?.title || 'Cargando...'}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900'>{app.applicantEmail}</div>
                      <div className='text-sm text-gray-500'>{app.applicantPhone}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {app.applicantDocument}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(app.status)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {formatColombianDate(app.createdAt)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm space-x-2'>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(app)}
                        className='inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium'
                      >
                        <FaEye /> Ver
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDownloadCV(app.uuid)}
                        className='inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium'
                      >
                        <FaDownload /> CV
                      </motion.button>
                      {(app.status === 'accepted' || app.status === 'rejected') && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteOne(app.uuid, app.applicantName)}
                          className='inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium'
                        >
                          <FaTrash />
                        </motion.button>
                      )}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.uuid, e.target.value)}
                        className='border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all'
                      >
                        <option value='pending'>Pendiente</option>
                        <option value='reviewing'>En Revisión</option>
                        <option value='interviewed'>Entrevistado</option>
                        <option value='accepted'>Aceptado</option>
                        <option value='rejected'>Rechazado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Paginación */}
        {!loading && filteredApplications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-8 flex justify-between items-center bg-white rounded-2xl shadow-lg p-6'
          >
            <div className='text-sm font-medium text-gray-600'>
              Mostrando <span className='text-blue-600 font-bold'>{startIndex + 1}</span> a <span className='text-blue-600 font-bold'>{Math.min(endIndex, filteredApplications.length)}</span> de <span className='text-blue-600 font-bold'>{filteredApplications.length}</span> aplicaciones
            </div>
            <div className='flex gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                }`}
              >
                ← Anterior
              </motion.button>
              
              <div className='flex gap-2'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </motion.button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className='px-2 py-2 text-gray-400'>...</span>;
                  }
                  return null;
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                }`}
              >
                Siguiente →
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Detalles - Rediseñado */}
      {showModal && selectedApp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden'
          >
            {/* Header del Modal */}
            <div className='bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-3xl font-bold mb-2 flex items-center gap-3'>
                    <FaFileAlt />
                    Detalles de la Postulación
                  </h2>
                  <p className='text-slate-300'>Información completa del candidato</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className='bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all'
                >
                  <FaTimes className='text-2xl' />
                </motion.button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className='overflow-y-auto max-h-[calc(90vh-180px)] p-8'>
              <div className='space-y-6'>
                {/* Información del Candidato */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className='bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-slate-200'
                >
                  <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                    <FaUserTie className='text-slate-600' />
                    Información del Candidato
                  </h3>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='bg-white/70 rounded-xl p-4'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='bg-slate-100 rounded-full p-2'>
                          <FaUserTie className='text-slate-600' />
                        </div>
                        <div>
                          <p className='text-xs text-gray-500 uppercase font-semibold'>Nombre</p>
                          <p className='font-bold text-gray-800'>{selectedApp.applicantName}</p>
                        </div>
                      </div>
                    </div>
                    <div className='bg-white/70 rounded-xl p-4'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='bg-slate-100 rounded-full p-2'>
                          <FaIdCard className='text-slate-600' />
                        </div>
                        <div>
                          <p className='text-xs text-gray-500 uppercase font-semibold'>Documento</p>
                          <p className='font-bold text-gray-800'>{selectedApp.applicantDocument}</p>
                        </div>
                      </div>
                    </div>
                    <div className='bg-white/70 rounded-xl p-4'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='bg-blue-50 rounded-full p-2'>
                          <FaEnvelope className='text-blue-600' />
                        </div>
                        <div>
                          <p className='text-xs text-gray-500 uppercase font-semibold'>Email</p>
                          <p className='font-bold text-gray-800 text-sm break-all'>{selectedApp.applicantEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className='bg-white/70 rounded-xl p-4'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='bg-green-100 rounded-full p-2'>
                          <FaPhone className='text-green-600' />
                        </div>
                        <div>
                          <p className='text-xs text-gray-500 uppercase font-semibold'>Teléfono</p>
                          <p className='font-bold text-gray-800'>{selectedApp.applicantPhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Información de la Vacante */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200'
                >
                  <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                    <FaBriefcase className='text-blue-600' />
                    Vacante
                  </h3>
                  {vacancies.get(selectedApp.vacancyId) ? (
                    <div className='space-y-3'>
                      <div className='bg-white/70 rounded-xl p-4'>
                        <h4 className='text-2xl font-bold text-gray-800 mb-3'>
                          {vacancies.get(selectedApp.vacancyId)?.title}
                        </h4>
                        <p className='text-gray-600 leading-relaxed'>
                          {vacancies.get(selectedApp.vacancyId)?.description}
                        </p>
                      </div>
                      <div className='grid md:grid-cols-3 gap-3'>
                        <div className='bg-white/70 rounded-xl p-3 flex items-center gap-3'>
                          <FaMapMarkerAlt className='text-blue-600 text-xl' />
                          <div>
                            <p className='text-xs text-gray-500'>Ubicación</p>
                            <p className='font-semibold text-gray-800'>
                              {vacancies.get(selectedApp.vacancyId)?.location}
                            </p>
                          </div>
                        </div>
                        <div className='bg-white/70 rounded-xl p-3 flex items-center gap-3'>
                          <FaClipboardList className='text-indigo-600 text-xl' />
                          <div>
                            <p className='text-xs text-gray-500'>Tipo</p>
                            <p className='font-semibold text-gray-800'>
                              {vacancies.get(selectedApp.vacancyId)?.employmentType}
                            </p>
                          </div>
                        </div>
                        {vacancies.get(selectedApp.vacancyId)?.salaryRange && (
                          <div className='bg-white/70 rounded-xl p-3 flex items-center gap-3'>
                            <FaMoneyBillWave className='text-green-600 text-xl' />
                            <div>
                              <p className='text-xs text-gray-500'>Salario</p>
                              <p className='font-semibold text-gray-800'>
                                {vacancies.get(selectedApp.vacancyId)?.salaryRange}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className='inline-block'
                      >
                        <FaBriefcase className='text-4xl text-blue-400' />
                      </motion.div>
                      <p className='text-gray-500 mt-3'>Cargando información de la vacante...</p>
                    </div>
                  )}
                </motion.div>

                {/* Carta de Presentación */}
                {selectedApp.coverLetter && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className='bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-6 border border-gray-200'
                  >
                    <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                      <FaFileAlt className='text-gray-600' />
                      Carta de Presentación
                    </h3>
                    <div className='bg-white/70 rounded-xl p-5'>
                      <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                        {selectedApp.coverLetter}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Estado y Fechas */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className='bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-slate-200'
                >
                  <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                    <FaCalendarAlt className='text-slate-600' />
                    Estado de la Postulación
                  </h3>
                  <div className='space-y-4'>
                    <div className='bg-white/70 rounded-xl p-4 flex items-center justify-between'>
                      <span className='text-gray-600 font-semibold'>Estado actual:</span>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    <div className='bg-white/70 rounded-xl p-4 flex items-center gap-3'>
                      <FaCalendarAlt className='text-slate-600 text-xl' />
                      <div>
                        <p className='text-xs text-gray-500 uppercase font-semibold'>Fecha de Postulación</p>
                        <p className='font-bold text-gray-800'>
                          {formatColombianDate(selectedApp.createdAt)}
                        </p>
                      </div>
                    </div>
                    {selectedApp.notes && (
                      <div className='bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4'>
                        <div className='flex items-start gap-3'>
                          <FaStickyNote className='text-yellow-600 text-xl mt-1' />
                          <div>
                            <p className='text-sm font-bold text-yellow-800 mb-1'>Notas del Reclutador:</p>
                            <p className='text-gray-700'>{selectedApp.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className='bg-gray-50 p-6 border-t border-gray-200'>
              <div className='flex gap-4 justify-end items-center'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownloadCV(selectedApp.uuid)}
                  className='bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:shadow-lg font-semibold flex items-center gap-2 transition-all text-base'
                >
                  <FaDownload className='text-lg' />
                  Descargar Hoja de Vida
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className='bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 font-semibold transition-all text-base'
                >
                  Cerrar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mensaje de éxito al descargar CV */}
      <AnimatePresence>
        {downloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className='fixed top-8 left-8 z-[100]'
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 10px 40px rgba(16, 185, 129, 0.3)',
                  '0 10px 60px rgba(16, 185, 129, 0.5)',
                  '0 10px 40px rgba(16, 185, 129, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className='bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-4 border-2 border-green-400'
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.6 }}
                className='bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-3'
              >
                <FaCheckCircle className='text-white text-3xl' />
              </motion.div>
              <div>
                <h3 className='font-bold text-gray-800 text-lg'>¡Descarga Exitosa!</h3>
                <p className='text-gray-600 text-sm'>La hoja de vida se descargó correctamente</p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <FaDownload className='text-green-600 text-2xl' />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
