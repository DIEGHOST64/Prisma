import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyService } from '../services/vacancyService';
import type { VacancyFull } from '../services/vacancyService';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBriefcase, 
  FaPlus, 
  FaArrowLeft, 
  FaEdit, 
  FaTrash,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaListUl,
  FaBuilding,
  FaLightbulb,
  FaMagic,
  FaSpinner,
  FaExclamationCircle,
  FaSave,
  FaTimes
} from 'react-icons/fa';

const VacancyManagement: React.FC = () => {
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState<VacancyFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<VacancyFull | null>(null);
  const [improvingField, setImprovingField] = useState<string | null>(null);
  
  // Ciudades principales de Colombia
  const colombianCities = [
    'Bogotá, Colombia',
    'Medellín, Colombia',
    'Cali, Colombia',
    'Barranquilla, Colombia',
    'Cartagena, Colombia',
    'Cúcuta, Colombia',
    'Bucaramanga, Colombia',
    'Pereira, Colombia',
    'Santa Marta, Colombia',
    'Ibagué, Colombia',
    'Manizales, Colombia',
    'Villavicencio, Colombia',
    'Pasto, Colombia',
    'Montería, Colombia',
    'Valledupar, Colombia',
  ];

  const workModalities = [
    'Presencial',
    'Remoto',
    'Híbrido'
  ];

  const [formData, setFormData] = useState<VacancyFull>({
    title: '',
    description: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: '',
    requirements: '',
    isActive: true
  });

  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedModality, setSelectedModality] = useState('Presencial');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  useEffect(() => {
    loadVacancies();
  }, []);

  // Formatear número con puntos como separador de miles
  const formatNumber = (value: string): string => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Actualizar rango salarial cuando cambian los valores
  useEffect(() => {
    if (salaryMin || salaryMax) {
      const min = salaryMin ? `$${formatNumber(salaryMin)}` : '';
      const max = salaryMax ? `$${formatNumber(salaryMax)}` : '';
      const range = min && max ? `${min} - ${max} COP` : min || max;
      setFormData(prev => ({ ...prev, salaryRange: range }));
    }
  }, [salaryMin, salaryMax]);

  // Actualizar ubicación cuando cambian ciudad o modalidad
  useEffect(() => {
    if (selectedModality === 'Remoto') {
      setFormData(prev => ({ ...prev, location: 'Remoto - Colombia' }));
    } else if (selectedCity) {
      const location = selectedModality === 'Híbrido' 
        ? `${selectedModality} - ${selectedCity}`
        : selectedCity;
      setFormData(prev => ({ ...prev, location }));
    }
  }, [selectedCity, selectedModality]);

  const handleCityInputChange = (value: string) => {
    setSelectedCity(value);
    
    if (value.length > 0 && selectedModality !== 'Remoto') {
      const filtered = colombianCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(true);
    } else {
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setShowCitySuggestions(false);
  };

  const handleModalityChange = (modality: string) => {
    setSelectedModality(modality);
    if (modality === 'Remoto') {
      setSelectedCity('');
      setShowCitySuggestions(false);
    }
  };

  const handleSalaryMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSalaryMin(value);
  };

  const handleSalaryMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSalaryMax(value);
  };

  const improveTextWithAI = async (field: 'title' | 'description' | 'requirements') => {
    const fieldValue = formData[field];
    if (!fieldValue) {
      alert('Por favor escribe algo primero');
      return;
    }

    try {
      setImprovingField(field);
      const context = field === 'title' ? 'titulo' : field === 'description' ? 'descripcion' : 'requisitos';
      const improved = await aiService.improveText({ 
        text: fieldValue, 
        context 
      });
      
      setFormData({ ...formData, [field]: improved });
    } catch (err) {
      alert('Error al mejorar el texto. Intenta nuevamente.');
      console.error(err);
    } finally {
      setImprovingField(null);
    }
  };

  const loadVacancies = async () => {
    try {
      setLoading(true);
      const data = await vacancyService.getAllVacancies();
      setVacancies(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las vacantes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingVacancy && editingVacancy.uuid) {
        await vacancyService.updateVacancy(editingVacancy.uuid, formData);
      } else {
        await vacancyService.createVacancy(formData);
      }
      await loadVacancies();
      resetForm();
      setError(null);
    } catch (err) {
      setError('Error al guardar la vacante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vacancy: VacancyFull) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      description: vacancy.description,
      location: vacancy.location,
      employmentType: vacancy.employmentType,
      salaryRange: vacancy.salaryRange || '',
      requirements: vacancy.requirements,
      isActive: vacancy.isActive
    });
    
    // Extraer modalidad y ciudad de location
    if (vacancy.location) {
      if (vacancy.location.includes('Remoto')) {
        setSelectedModality('Remoto');
        setSelectedCity('');
      } else if (vacancy.location.includes('Híbrido')) {
        setSelectedModality('Híbrido');
        const city = vacancy.location.replace('Híbrido - ', '');
        setSelectedCity(city);
      } else {
        setSelectedModality('Presencial');
        setSelectedCity(vacancy.location);
      }
    }
    
    // Extraer valores de salario si existen
    if (vacancy.salaryRange) {
      const match = vacancy.salaryRange.match(/\$?([\d.]+)\s*-\s*\$?([\d.]+)/);
      if (match) {
        setSalaryMin(match[1].replace(/\./g, ''));
        setSalaryMax(match[2].replace(/\./g, ''));
      }
    }
    
    setShowForm(true);
  };

  const handleToggleStatus = async (vacancy: VacancyFull) => {
    if (!vacancy.uuid) return;
    try {
      setLoading(true);
      await vacancyService.toggleVacancyStatus(vacancy.uuid, !vacancy.isActive);
      await loadVacancies();
      setError(null);
    } catch (err) {
      setError('Error al cambiar el estado de la vacante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta vacante?')) return;
    try {
      setLoading(true);
      await vacancyService.deleteVacancy(uuid);
      await loadVacancies();
      setError(null);
    } catch (err) {
      setError('Error al eliminar la vacante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      employmentType: 'full-time',
      salaryRange: '',
      requirements: '',
      isActive: true
    });
    setSalaryMin('');
    setSalaryMax('');
    setSelectedCity('');
    setSelectedModality('Presencial');
    setEditingVacancy(null);
    setShowForm(false);
    setShowCitySuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
              <FaBriefcase className="text-3xl text-white" />
            </div>
            Gestión de Vacantes
          </h1>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
            >
              <FaArrowLeft /> Volver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
            >
              {showForm ? <><FaTimes /> Cancelar</> : <><FaPlus /> Nueva Vacante</>}
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 shadow-lg"
            >
              <FaExclamationCircle className="text-red-500 text-2xl" />
              <p className="text-red-700 font-medium">{error}</p>
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
                {editingVacancy ? <FaEdit className="text-2xl text-white" /> : <FaPlus className="text-2xl text-white" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {editingVacancy ? 'Editar Vacante' : 'Nueva Vacante'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div whileFocus={{ scale: 1.01 }}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaBriefcase className="text-blue-600" />
                    Título *
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => improveTextWithAI('title')}
                    disabled={improvingField === 'title'}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {improvingField === 'title' ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <FaSpinner />
                        </motion.div>
                        Mejorando...
                      </>
                    ) : (
                      <>
                        <FaMagic /> Mejorar con IA
                      </>
                    )}
                  </motion.button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ej: Desarrollador Full Stack"
                />
                {formData.title && aiService.validateText(formData.title).length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                    <FaExclamationCircle className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">{aiService.validateText(formData.title).join(', ')}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                  📊 {aiService.getCharacterCount(formData.title, 'titulo').length} caracteres - {aiService.getCharacterCount(formData.title, 'titulo').recommendation}
                </div>
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaListUl className="text-pink-600" />
                    Descripción *
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => improveTextWithAI('description')}
                    disabled={improvingField === 'description'}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {improvingField === 'description' ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <FaSpinner />
                        </motion.div>
                        Mejorando...
                      </>
                    ) : (
                      <>
                        <FaMagic /> Mejorar con IA
                      </>
                    )}
                  </motion.button>
                </div>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none"
                  placeholder="Describe las responsabilidades y funciones del cargo..."
                />
                {formData.description && aiService.validateText(formData.description).length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                    <FaExclamationCircle className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">{aiService.validateText(formData.description).join(', ')}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 bg-pink-50 p-2 rounded-lg">
                  📊 {aiService.getCharacterCount(formData.description, 'descripcion').length} caracteres - {aiService.getCharacterCount(formData.description, 'descripcion').recommendation}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" />
                    Modalidad de Trabajo *
                  </label>
                  <select
                    required
                    value={selectedModality}
                    onChange={(e) => handleModalityChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {workModalities.map((modality) => (
                      <option key={modality} value={modality}>
                        {modality}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-green-600" />
                    {selectedModality === 'Remoto' ? 'Ubicación (Remoto)' : 'Ciudad *'}
                  </label>
                  <input
                    type="text"
                    required={selectedModality !== 'Remoto'}
                    disabled={selectedModality === 'Remoto'}
                    value={selectedModality === 'Remoto' ? 'Remoto - Colombia' : selectedCity}
                    onChange={(e) => handleCityInputChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      selectedModality === 'Remoto' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder={selectedModality === 'Remoto' ? 'Trabajo remoto' : 'Ej: Bogotá, Colombia'}
                  />
                  {showCitySuggestions && filteredCities.length > 0 && selectedModality !== 'Remoto' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-purple-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {filteredCities.map((city, index) => (
                        <div
                          key={index}
                          onClick={() => selectCity(city)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.location && (
                    <p className="mt-1 text-xs text-gray-500">
                      Se guardará como: <span className="font-semibold">{formData.location}</span>
                    </p>
                  )}
                </div>
              </div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaClock className="text-orange-600" />
                  Tipo de Contrato *
                </label>
                <select
                  required
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="full-time">⏰ Tiempo Completo</option>
                  <option value="part-time">⏱️ Medio Tiempo</option>
                  <option value="contract">📄 Contrato</option>
                  <option value="internship">🎓 Pasantía</option>
                </select>
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-600" />
                  Rango Salarial
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Salario Mínimo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500 font-bold">$</span>
                      <input
                        type="text"
                        value={salaryMin ? formatNumber(salaryMin) : ''}
                        onChange={handleSalaryMinChange}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="3.000.000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Salario Máximo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500 font-bold">$</span>
                      <input
                        type="text"
                        value={salaryMax ? formatNumber(salaryMax) : ''}
                        onChange={handleSalaryMaxChange}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="5.000.000"
                      />
                    </div>
                  </div>
                </div>
                {formData.salaryRange && (
                  <p className="mt-2 text-sm bg-green-50 p-3 rounded-lg text-gray-700">
                    💵 Vista previa: <span className="font-bold text-green-700">{formData.salaryRange}</span>
                  </p>
                )}
              </motion.div>

              <motion.div whileFocus={{ scale: 1.01 }}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaLightbulb className="text-yellow-600" />
                    Requisitos *
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => improveTextWithAI('requirements')}
                    disabled={improvingField === 'requirements'}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {improvingField === 'requirements' ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <FaSpinner />
                        </motion.div>
                        Mejorando...
                      </>
                    ) : (
                      <>
                        <FaMagic /> Mejorar con IA
                      </>
                    )}
                  </motion.button>
                </div>
                <textarea
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all resize-none"
                  placeholder="Lista los requisitos necesarios para el cargo..."
                />
                {formData.requirements && aiService.validateText(formData.requirements).length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                    <FaExclamationCircle className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">{aiService.validateText(formData.requirements).join(', ')}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg">
                  📊 {aiService.getCharacterCount(formData.requirements, 'requisitos').length} caracteres - {aiService.getCharacterCount(formData.requirements, 'requisitos').recommendation}
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"
              >
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <FaCheckCircle className="text-blue-600" />
                  Vacante Activa (visible para postulantes)
                </label>
              </motion.div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <FaSpinner />
                      </motion.div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave /> {editingVacancy ? 'Actualizar' : 'Crear Vacante'}
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
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700"></div>
          
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <FaBriefcase className="text-xl text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Lista de Vacantes <span className="text-blue-600">({vacancies.length})</span>
              </h2>
            </div>
          </div>
          
          {loading && vacancies.length === 0 ? (
            <div className="p-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block text-5xl mb-4"
              >
                <FaBriefcase className="text-blue-600" />
              </motion.div>
              <p className="text-gray-500 font-medium">Cargando vacantes...</p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-4xl text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">No hay vacantes registradas</p>
              <p className="text-gray-500 text-sm mt-2">Crea una nueva vacante para comenzar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {vacancies.map((vacancy, index) => (
                <motion.div
                  key={vacancy.uuid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: '#faf5ff' }}
                  className="p-6 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-xl">
                          <FaBriefcase className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{vacancy.title}</h3>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg mt-1 ${
                              vacancy.isActive 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                            }`}
                          >
                            {vacancy.isActive ? <><FaCheckCircle /> Activa</> : <><FaTimesCircle /> Inactiva</>}
                          </motion.span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">{vacancy.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                          <FaMapMarkerAlt className="text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Ubicación</p>
                            <p className="text-sm text-gray-800">{vacancy.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg">
                          <FaClock className="text-indigo-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Tipo</p>
                            <p className="text-sm text-gray-800">
                              {vacancy.employmentType === 'full-time' ? 'Tiempo Completo' :
                               vacancy.employmentType === 'part-time' ? 'Medio Tiempo' :
                               vacancy.employmentType === 'contract' ? 'Contrato' : 'Pasantía'}
                            </p>
                          </div>
                        </div>
                        {vacancy.salaryRange && (
                          <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                            <FaMoneyBillWave className="text-green-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-semibold">Salario</p>
                              <p className="text-sm text-gray-800 font-bold">{vacancy.salaryRange}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                        <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <FaLightbulb className="text-yellow-600" /> Requisitos:
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{vacancy.requirements}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(vacancy)}
                        className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
                        title="Editar"
                      >
                        <FaEdit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleStatus(vacancy)}
                        className={`p-3 text-white rounded-lg hover:shadow-lg transition-all ${
                          vacancy.isActive 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                        title={vacancy.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {vacancy.isActive ? <FaTimesCircle size={18} /> : <FaCheckCircle size={18} />}
                      </motion.button>
                      {vacancy.uuid && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(vacancy.uuid!)}
                          className="p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                          title="Eliminar"
                        >
                          <FaTrash size={18} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VacancyManagement;
