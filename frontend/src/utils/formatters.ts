export const formatEmploymentType = (type: string): string => {
  const types: Record<string, string> = {
    'full-time': 'Tiempo Completo',
    'full_time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'part_time': 'Medio Tiempo',
    'contract': 'Contrato',
    'freelance': 'Freelance',
  };
  return types[type] || type;
};

export const formatSalary = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};
