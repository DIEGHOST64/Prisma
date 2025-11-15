import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaMoneyBillWave, 
  FaClock,
  FaSearch,
  FaUser,
  FaCheckCircle,
  FaRocket
} from 'react-icons/fa';
import type { Vacancy } from '../types';
import { vacancyService } from '../services/vacancyService';
import { formatEmploymentType } from '../utils/formatters';

export default function HomePage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    loadVacancies();
    // Mostrar animación de bienvenida por 2.5 segundos
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadVacancies = async () => {
    try {
      setLoading(true);
      const data = await vacancyService.getActiveVacancies();
      setVacancies(data);
    } catch (err) {
      setError('Error al cargar las vacantes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Animación de bienvenida inicial
  if (showWelcome) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex flex-col justify-center items-center min-h-screen bg-white overflow-hidden relative'
      >
        {/* Logo central con animación minimalista */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          className='text-center'
        >
          {/* Círculo decorativo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ 
              duration: 1,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
            className='absolute inset-0 flex items-center justify-center'
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className='w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl'
            />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className='relative z-10'
          >
            <motion.h1
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
              className='text-7xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2'
            >
              PRISMA
            </motion.h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className='h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto'
            />
          </motion.div>

          {/* Texto descriptivo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className='mt-6 text-gray-600 text-lg font-medium relative z-10'
          >
            Encuentra tu próxima oportunidad
          </motion.p>
        </motion.div>

        {/* Puntos minimalistas en las esquinas */}
        {[
          { top: '10%', left: '10%', delay: 0.5 },
          { top: '10%', right: '10%', delay: 0.7 },
          { bottom: '10%', left: '10%', delay: 0.9 },
          { bottom: '10%', right: '10%', delay: 1.1 }
        ].map((pos, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ delay: pos.delay, duration: 0.5 }}
            style={pos}
            className='absolute w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500'
          />
        ))}
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center'
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className='inline-block text-6xl text-blue-600 mb-4'
          >
            <FaRocket />
          </motion.div>
          <p className='text-xl font-semibold text-gray-700'>Cargando oportunidades...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Navbar moderna */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50'
      >
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className='text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent'
          >
            ✨ PRISMA.COM
          </motion.h1>
          <div className='flex gap-4'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to='/login' 
                className='flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                <FaUser /> Iniciar Sesión
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to='/check-status' 
                className='flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-shadow font-medium'
              >
                <FaSearch /> Consultar Estado
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className='container mx-auto px-4 py-16 text-center'
      >
        <h2 className='text-5xl font-bold mb-4 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent'>
          Encuentra Tu Próxima Oportunidad
        </h2>
        <p className='text-xl text-gray-600 mb-8'>
          Las mejores vacantes esperándote
        </p>
        <div className='flex justify-center gap-8 mb-12'>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className='flex flex-col items-center'
          >
            <div className='bg-blue-100 p-4 rounded-full mb-2'>
              <FaBriefcase className='text-3xl text-blue-600' />
            </div>
            <p className='font-semibold text-gray-700'>{vacancies.length} Vacantes</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className='flex flex-col items-center'
          >
            <div className='bg-green-100 p-4 rounded-full mb-2'>
              <FaCheckCircle className='text-3xl text-green-600' />
            </div>
            <p className='font-semibold text-gray-700'>Proceso Rápido</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className='flex flex-col items-center'
          >
            <div className='bg-blue-100 p-4 rounded-full mb-2'>
              <FaRocket className='text-3xl text-blue-600' />
            </div>
            <p className='font-semibold text-gray-700'>Impulsa Tu Carrera</p>
          </motion.div>
        </div>
      </motion.div>

      <div className='container mx-auto px-4 pb-16'>
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className='bg-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md'
          >
            {error}
          </motion.div>
        )}

        {vacancies.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center text-gray-500 py-12 bg-white rounded-2xl shadow-lg'
          >
            <FaBriefcase className='text-6xl mx-auto mb-4 text-gray-300' />
            <p className='text-xl'>No hay vacantes disponibles en este momento</p>
            <p className='text-sm mt-2'>Vuelve pronto para ver nuevas oportunidades</p>
          </motion.div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {vacancies.map((vacancy, index) => (
              <motion.div
                key={vacancy.uuid}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className='bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group'
              >
                {/* Card header con gradiente */}
                <div className='h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700'></div>
                
                <div className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <h3 className='text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors'>
                      {vacancy.title}
                    </h3>
                    <div className='bg-blue-100 p-2 rounded-lg'>
                      <FaBriefcase className='text-blue-600 text-xl' />
                    </div>
                  </div>

                  <p className='text-gray-600 mb-6 line-clamp-3 leading-relaxed'>
                    {vacancy.description}
                  </p>

                  <div className='space-y-3 mb-6'>
                    <div className='flex items-center gap-3 text-gray-700'>
                      <div className='bg-blue-100 p-2 rounded-lg'>
                        <FaMapMarkerAlt className='text-blue-600' />
                      </div>
                      <span className='font-medium'>{vacancy.location}</span>
                    </div>

                    <div className='flex items-center gap-3 text-gray-700'>
                      <div className='bg-green-100 p-2 rounded-lg'>
                        <FaClock className='text-green-600' />
                      </div>
                      <span className='font-medium'>{formatEmploymentType(vacancy.employmentType)}</span>
                    </div>

                    <div className='flex items-center gap-3 text-gray-700'>
                      <div className='bg-yellow-100 p-2 rounded-lg'>
                        <FaMoneyBillWave className='text-yellow-600' />
                      </div>
                      <span className='font-medium'>
                        {(() => {
                          if (!vacancy.salaryRange) return 'A convenir';
                          
                          if (typeof vacancy.salaryRange === 'string') {
                            if (vacancy.salaryRange.includes('$')) {
                              return vacancy.salaryRange;
                            }
                            const parts = vacancy.salaryRange.split('-');
                            if (parts.length === 2) {
                              const min = parseInt(parts[0].trim());
                              const max = parseInt(parts[1].trim());
                              if (!isNaN(min) && !isNaN(max)) {
                                return `$${min.toLocaleString('es-CO')} - $${max.toLocaleString('es-CO')}`;
                              }
                            }
                          }
                          
                          return 'A convenir';
                        })()}
                      </span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={`/apply/${vacancy.uuid}`}
                      className='block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow'
                    >
                      Aplicar Ahora →
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
