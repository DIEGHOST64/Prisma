import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaFileUpload,
  FaPaperPlane,
  FaCheckCircle,
  FaTimes,
  FaArrowLeft,
  FaEdit
} from 'react-icons/fa';
import type { Vacancy, CreateApplicationData } from '../types';
import { vacancyService } from '../services/vacancyService';
import { applicationService } from '../services/applicationService';
import { documentService } from '../services/documentService';
import { formatEmploymentType } from '../utils/formatters';

export default function ApplyPage() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantDocument: '',
    coverLetter: '',
  });
  
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    loadVacancy();
  }, [vacancyId]);

  const loadVacancy = async () => {
    try {
      const vacancies = await vacancyService.getActiveVacancies();
      const found = vacancies.find((v) => v.uuid === vacancyId);
      
      if (!found) {
        setError('Vacante no encontrada');
      } else {
        setVacancy(found);
      }
    } catch (err) {
      setError('Error al cargar la vacante');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF o Word');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }
      
      setCvFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cvFile) {
      setError('Debe adjuntar su CV');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      // 1. Crear la aplicación primero
      const applicationData: CreateApplicationData = {
        vacancy_id: vacancyId!,
        applicant_name: formData.applicantName,
        applicant_email: formData.applicantEmail,
        applicant_phone: formData.applicantPhone,
        applicant_document: formData.applicantDocument,
        cover_letter: formData.coverLetter,
      };
      
      console.log('Enviando aplicación...', applicationData);
      const application = await applicationService.createApplication(applicationData);
      console.log('Aplicación creada:', application);
      
      // 2. Intentar subir el documento
      try {
        console.log('Subiendo documento...', {
          user_document: formData.applicantDocument,
          application_id: application.uuid,
        });
        
        await documentService.uploadDocument({
          file: cvFile,
          user_document: formData.applicantDocument,
          application_id: application.uuid,
          document_type: 'cv',
        });
        
        console.log('Documento subido exitosamente');
      } catch (docError: any) {
        console.error('Error al subir documento:', docError);
        // La aplicación ya está guardada, solo notificamos que el CV falló
        setError('Postulación guardada, pero hubo un error al subir el CV. Por favor, contáctenos.');
      }
      
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error('Error al crear aplicación:', err);
      setError(err.response?.data?.message || err.message || 'Error al enviar la postulación');
      setSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/check-status');
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center'
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className='text-5xl text-blue-600 mb-4'
          >
            <FaBriefcase />
          </motion.div>
          <p className='text-xl font-semibold text-gray-700'>Cargando vacante...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !vacancy) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <nav className='bg-white/80 backdrop-blur-md shadow-lg'>
          <div className='container mx-auto px-4 py-4'>
            <Link to='/' className='text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent'>
              ✨ PRISMA.COM
            </Link>
          </div>
        </nav>
        <div className='container mx-auto px-4 py-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto shadow-lg'
          >
            {error}
          </motion.div>
          <Link to='/' className='mt-6 inline-block text-blue-600 hover:text-blue-800 font-semibold'>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50'
      >
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
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

      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {vacancy && (
          <>
            {/* Vacancy Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-xl p-8 mb-8 overflow-hidden'
            >
              <div className='h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 -mx-8 -mt-8 mb-6'></div>
              
              <div className='flex items-start gap-4 mb-6'>
                <div className='bg-blue-100 p-4 rounded-xl'>
                  <FaBriefcase className='text-4xl text-blue-600' />
                </div>
                <div className='flex-1'>
                  <h1 className='text-3xl font-bold text-gray-800 mb-2'>{vacancy.title}</h1>
                  <p className='text-gray-600 leading-relaxed'>{vacancy.description}</p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center gap-3 bg-blue-50 p-4 rounded-xl'>
                  <FaMapMarkerAlt className='text-2xl text-blue-600' />
                  <div>
                    <p className='text-xs text-gray-500 font-semibold'>Ubicación</p>
                    <p className='text-gray-800 font-medium'>{vacancy.location}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 bg-green-50 p-4 rounded-xl'>
                  <FaClock className='text-2xl text-green-600' />
                  <div>
                    <p className='text-xs text-gray-500 font-semibold'>Tipo de Empleo</p>
                    <p className='text-gray-800 font-medium'>{formatEmploymentType(vacancy.employmentType)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Application Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl shadow-xl p-8'
            >
              <div className='flex items-center gap-3 mb-6'>
                <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl'>
                  <FaEdit className='text-2xl text-white' />
                </div>
                <h2 className='text-2xl font-bold text-gray-800'>Formulario de Postulación</h2>
              </div>
              
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <motion.div whileFocus={{ scale: 1.02 }} className='relative'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                      <FaUser className='text-blue-600' />
                      Nombre Completo *
                    </label>
                    <input
                      type='text'
                      required
                      value={formData.applicantName}
                      onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                      placeholder='Juan Pérez'
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                      <FaEnvelope className='text-indigo-600' />
                      Correo Electrónico *
                    </label>
                    <input
                      type='email'
                      required
                      value={formData.applicantEmail}
                      onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all'
                      placeholder='juan@email.com'
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                      <FaPhone className='text-blue-600' />
                      Teléfono *
                    </label>
                    <input
                      type='tel'
                      required
                      value={formData.applicantPhone}
                      onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                      placeholder='+57 300 123 4567'
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                      <FaIdCard className='text-green-600' />
                      Número de Documento *
                    </label>
                    <input
                      type='text'
                      required
                      value={formData.applicantDocument}
                      onChange={(e) => setFormData({ ...formData, applicantDocument: e.target.value })}
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all'
                      placeholder='1234567890'
                    />
                  </motion.div>
                </div>

                <motion.div whileFocus={{ scale: 1.01 }}>
                  <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <FaEdit className='text-slate-600' />
                    Carta de Presentación *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    placeholder='Cuéntanos por qué eres el candidato ideal para esta posición...'
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none'
                  />
                </motion.div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <FaFileUpload className='text-blue-600' />
                    Currículum Vitae (PDF o Word, máx 5MB) *
                  </label>
                  <div className='relative'>
                    <input
                      type='file'
                      required
                      accept='.pdf,.doc,.docx'
                      onChange={handleFileChange}
                      className='w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                    />
                  </div>
                  {cvFile && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='mt-3 text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg'
                    >
                      <FaCheckCircle />
                      Archivo seleccionado: <span className='font-semibold'>{cvFile.name}</span>
                    </motion.p>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className='bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3'
                    >
                      <FaTimes className='text-xl' />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className='flex gap-4 pt-4'>
                  <motion.button
                    type='submit'
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <FaPaperPlane />
                        </motion.div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Enviar Postulación
                      </>
                    )}
                  </motion.button>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                    <Link
                      to='/'
                      className='block bg-gray-200 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-300 text-center font-bold text-lg transition-all'
                    >
                      Cancelar
                    </Link>
                  </motion.div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            onClick={handleCloseSuccessModal}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: "spring", duration: 0.5 }}
              className='bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className='bg-gradient-to-r from-green-400 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6'
              >
                <FaCheckCircle className='text-white text-5xl' />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='text-3xl font-bold text-center mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
              >
                ¡Postulación Enviada!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='text-gray-600 text-center mb-6 leading-relaxed'
              >
                Tu postulación ha sido enviada exitosamente. Pronto recibirás noticias sobre tu proceso de selección.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6'
              >
                <p className='text-sm text-blue-800'>
                  💡 <strong>Próximos pasos:</strong> Revisa tu correo electrónico regularmente y mantén tu teléfono disponible.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCloseSuccessModal}
                className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all'
              >
                Consultar Estado de Postulación
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


