import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle, FaEye, FaUserCircle, FaEnvelope, FaPhone, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';
import type { Application } from '../types';
import { applicationService } from '../services/applicationService';

export default function CheckStatusPage() {
  const [document, setDocument] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(false);

    try {
      const data = await applicationService.getApplicationStatus(document);
      setApplications(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al consultar el estado');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { 
        bg: 'from-yellow-400 to-orange-500', 
        text: 'text-white', 
        icon: FaClock,
        label: 'Pendiente' 
      },
      reviewing: { 
        bg: 'from-blue-400 to-blue-600', 
        text: 'text-white', 
        icon: FaEye,
        label: 'En Revisión' 
      },
      interviewed: { 
        bg: 'from-purple-400 to-purple-600', 
        text: 'text-white', 
        icon: FaUserCircle,
        label: 'Entrevistado' 
      },
      accepted: { 
        bg: 'from-green-400 to-emerald-600', 
        text: 'text-white', 
        icon: FaCheckCircle,
        label: 'Aceptado' 
      },
      rejected: { 
        bg: 'from-red-400 to-red-600', 
        text: 'text-white', 
        icon: FaTimesCircle,
        label: 'Rechazado' 
      },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.bg} ${config.text} font-semibold shadow-lg`}
      >
        <Icon className="text-lg" />
        {config.label}
      </motion.div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50'>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='bg-white shadow-xl border-b-4 border-slate-200'
      >
        <div className='container mx-auto px-4 py-5'>
          <Link to='/' className='text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent hover:scale-105 transition-transform inline-block'>
            ✨ PRISMA.COM
          </Link>
        </div>
      </motion.nav>

      <div className='container mx-auto px-4 py-12 max-w-4xl'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-12'
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className='inline-block mb-4'
          >
            <FaSearch className='text-6xl text-blue-600 drop-shadow-lg' />
          </motion.div>
          <h1 className='text-5xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent mb-3'>
            Consultar Estado
          </h1>
          <p className='text-gray-600 text-lg'>
            Ingresa tu número de documento para ver el estado de tus postulaciones
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-blue-100'
        >
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='document' className='flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3'>
                <FaFileAlt className='text-blue-600' />
                Número de Documento
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                id='document'
                type='text'
                required
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder='Ej: 1234567890'
                className='w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all shadow-sm'
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3'
                >
                  <FaTimesCircle className='text-2xl' />
                  <span className='font-medium'>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type='submit'
              disabled={loading}
              className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold py-4 px-6 rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3'
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <FaSearch className='text-2xl' />
                  </motion.div>
                  <span>Buscando tus postulaciones...</span>
                </>
              ) : (
                <>
                  <FaSearch className='text-xl' />
                  <span>Consultar Estado</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Loading Animation */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className='flex flex-col items-center justify-center py-16'
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className='mb-6'
              >
                <FaFileAlt className='text-8xl text-blue-600' />
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className='text-2xl font-bold text-blue-600'
              >
                Buscando tus postulaciones...
              </motion.p>
              <div className='flex gap-2 mt-4'>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -20, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className='w-3 h-3 bg-blue-600 rounded-full'
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        <AnimatePresence>
          {searched && applications.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300'
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <FaFileAlt className='text-8xl text-gray-300 mx-auto mb-6' />
              </motion.div>
              <h3 className='text-2xl font-bold text-gray-700 mb-2'>
                No se encontraron postulaciones
              </h3>
              <p className='text-gray-500 text-lg'>
                No hay postulaciones registradas con este número de documento
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {applications.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='space-y-6'
            >
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className='text-3xl font-bold text-gray-800 flex items-center gap-3'
              >
                <FaCheckCircle className='text-green-500' />
                Tus Postulaciones ({applications.length})
              </motion.h2>
              
              {applications.map((app, index) => (
                <motion.div
                  key={app.uuid}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className='bg-white rounded-2xl shadow-xl p-8 border-l-4 border-blue-500 hover:shadow-2xl transition-all'
                >
                  <div className='flex flex-col md:flex-row justify-between items-start gap-4 mb-6'>
                    <div className='flex-1'>
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='font-bold text-2xl mb-4 text-gray-800 flex items-center gap-2'
                      >
                        <FaUserCircle className='text-blue-600' />
                        {app.applicantName}
                      </motion.h3>
                      
                      <div className='space-y-2'>
                        <p className='text-gray-600 flex items-center gap-2'>
                          <FaEnvelope className='text-blue-500' />
                          <span className='font-medium'>Email:</span> {app.applicantEmail}
                        </p>
                        <p className='text-gray-600 flex items-center gap-2'>
                          <FaPhone className='text-blue-500' />
                          <span className='font-medium'>Teléfono:</span> {app.applicantPhone}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                  
                  {app.notes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className='mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200'
                    >
                      <p className='text-sm font-bold text-blue-700 mb-2 flex items-center gap-2'>
                        <FaStickyNote />
                        Notas del Reclutador:
                      </p>
                      <p className='text-gray-700'>{app.notes}</p>
                    </motion.div>
                  )}
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className='text-sm text-gray-500 mt-6 flex items-center gap-2'
                  >
                    <FaCalendarAlt className='text-blue-500' />
                    <span className='font-medium'>Fecha de aplicación:</span>
                    {new Date(app.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
