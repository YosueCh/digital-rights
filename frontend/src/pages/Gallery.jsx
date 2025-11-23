import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AssetCard from '../components/AssetCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { assetsAPI } from '../utils/api';
import { Search, Filter } from 'lucide-react';

export default function Gallery() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    filterAndSortAssets();
  }, [searchTerm, sortBy, assets]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await assetsAPI.getAll();
      setAssets(response.data.assets || []);
      setError('');
    } catch (err) {
      setError('Error al cargar las obras digitales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssets = () => {
    let filtered = [...assets];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.vendedor?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'title':
        filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      default:
        break;
    }

    setFilteredAssets(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🖼️ Galería de Obras Digitales
          </h1>
          <p className="text-gray-600">
            Todas las obras están cifradas con AES-256
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar obras, artistas..."
                className="input-field pl-10"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field pl-10"
              >
                <option value="recent">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="title">Título (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} />}

        {/* Loading */}
        {loading && <LoadingSpinner message="Cargando obras digitales..." />}

        {/* Assets Grid */}
        {!loading && !error && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredAssets.length} {filteredAssets.length === 1 ? 'obra encontrada' : 'obras encontradas'}
              </p>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No se encontraron obras que coincidan con tu búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Info banner */}
        {!loading && filteredAssets.length > 0 && (
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              🔒 <strong>Seguridad garantizada:</strong> Todos los archivos de alta resolución 
              están cifrados con AES-256-CBC. Solo el comprador podrá descargarlos usando cifrado híbrido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}