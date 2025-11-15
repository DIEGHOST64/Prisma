import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaRocket,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si viene de una redirección por sesión expirada
    const params = new URLSearchParams(location.search);
    if (params.get('session') === 'expired') {
      setSessionExpired(true);
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setSessionExpired(false), 5000);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSessionExpired(false);

    try {
      await login({ email, password });
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col'>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='bg-white/80 backdrop-blur-md shadow-lg'
      >
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <Link to='/' className='text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent'>
            ✨ PRISMA.COM
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to='/' className='flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium'>
              <FaArrowLeft /> Volver
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Mensaje de sesión expirada */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className='container mx-auto px-4 mt-4'
          >
            <div className='max-w-md mx-auto bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-lg'>
              <div className='flex items-center gap-3'>
                <FaExclamationCircle className='text-2xl text-yellow-600' />
                <div>
                  <h3 className='font-bold text-yellow-800'>Sesión Expirada</h3>
                  <p className='text-sm text-yellow-700'>Tu sesión ha expirado. Por favor, vuelve a iniciar sesión para continuar.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className='flex-1 flex items-center justify-center px-4 py-12'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='max-w-md w-full'
        >
          {/* Card de login */}
          <div className='bg-white rounded-3xl shadow-2xl overflow-hidden'>
            {/* Header con gradiente */}
            <div className='h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700'></div>

            <div className='p-8'>
              {/* Icono y título */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className='flex justify-center mb-6'
              >
                <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full'>
                  <FaUser className='text-4xl text-white' />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='text-3xl font-bold text-center mb-2 bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent'
              >
                Bienvenido de nuevo
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className='text-center text-gray-600 mb-8'
              >
                Inicia sesión para acceder al panel de administración
              </motion.p>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Campo Email */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <FaEnvelope className='text-indigo-600' />
                    Correo Electrónico
                  </label>
                  <input
                    id='email'
                    type='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all'
                    placeholder='tu@email.com'
                  />
                </motion.div>

                {/* Campo Contraseña */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor='password' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <FaLock className='text-blue-600' />
                    Contraseña
                  </label>
                  <div className='relative'>
                    <input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12'
                      placeholder='••••••••'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors'
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                </motion.div>

                {/* Mensaje de error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3'
                    >
                      <FaExclamationCircle className='text-xl' />
                      <span className='text-sm'>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón de login */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  type='submit'
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3'
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FaRocket className='text-2xl' />
                      </motion.div>
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Link de vuelta */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className='mt-6 text-center'
              >
                <Link 
                  to='/' 
                  className='text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 hover:gap-3 transition-all'
                >
                  <FaArrowLeft />
                  Volver al inicio
                </Link>
              </motion.div>
            </div>

            {/* Footer decorativo */}
            <div className='bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-4 text-center'>
              <p className='text-sm text-gray-600'>
                ¿Necesitas ayuda? Contacta al administrador del sistema
              </p>
            </div>
          </div>

          {/* Decoración de fondo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 1 }}
            className='absolute top-20 right-10 text-9xl text-blue-600 -z-10'
          >
            <FaRocket className='transform rotate-45' />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
