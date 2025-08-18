
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'U razmatranju': return 'status-reviewing border-yellow-400';
    case 'U izradi': return 'status-developing border-cyan-400';
    case 'Gotovo': return 'status-completed border-green-400';
    default: return 'bg-gray-500 text-white border-gray-500';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Zahtev za alat': return 'bg-purple-500/30 text-purple-200 border-purple-400 backdrop-blur-sm';
    case 'Funkcionalnost': return 'bg-blue-500/30 text-blue-200 border-blue-400 backdrop-blur-sm';
    case 'Bug': return 'bg-red-500/30 text-red-200 border-red-400 backdrop-blur-sm';
    case 'Generalni utisak': return 'bg-gray-500/30 text-gray-200 border-gray-400 backdrop-blur-sm';
    default: return 'bg-gray-500/30 text-gray-200 border-gray-400 backdrop-blur-sm';
  }
};
