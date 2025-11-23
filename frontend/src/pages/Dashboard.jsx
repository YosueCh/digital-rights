import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import SecurityPanel from '../components/SecurityPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Image, 
  ShoppingCart, 
  FileSignature, 
  Download,
  Shield,
  TrendingUp
} from 'lucide-react';
import { transfersAPI, downloadsAPI, assetsAPI } from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    transfers: 0,
    downloads: 0,
    assets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar transferencias
      const transfersRes = await transfersAPI.getMyTransfers();
      const transfers = transfersRes.data.transfers || [];

      // Cargar descargas si es comprador
      let downloads = [];
      if (user.rol === 'comprador') {
        const downloadsRes = await downloadsAPI.getMyDownloads();
        downloads = downloadsRes.data.downloads || [];
      }

      // Cargar obras si es vendedor
      let assets = [];
      if (user.rol === 'vendedor') {
        const assetsRes = await assetsAPI.getMyAssets();
        assets = assetsRes.data.assets || [];
      }

      setStats({
        transfers: transfers.length,
        downloads: downloads.length,
        assets: assets.length
      });

      // Crear actividad reciente
      const activity = [
        ...transfers.map(t => ({
          type: 'transfer',
          title: `Transferencia: ${t.obra_titulo}`,
          date: t.timestamp,
          icon: FileSignature
        })),
        ...downloads.map(d => ({
          type: 'download',
          title: `Descarga: ${d.obra_titulo}`,
          date: d.download_timestamp,
          icon: Download
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setRecentActivity(activity);

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user?.nombre}! 👋
          </h1>
          <p className="text-gray-600">
            Panel de control de tu cuenta {user?.rol}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Cargando datos del dashboard..." />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                icon={Shield}
                title="Capas de Seguridad"
                value="4"
                color="primary"
              />
              
              {user.rol === 'vendedor' && (
                <StatsCard
                  icon={Image}
                  title="Mis Obras"
                  value={stats.assets}
                  color="accent"
                />
              )}

              <StatsCard
                icon={FileSignature}
                title="Transferencias"
                value={stats.transfers}
                color="success"
              />

              {user.rol === 'comprador' && (
                <StatsCard
                  icon={Download}
                  title="Descargas"
                  value={stats.downloads}
                  color="info"
                />
              )}
            </div>

            {/* Security Layers Panel */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔐 Capas de Seguridad Activas
              </h2>
              <SecurityPanel />
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Acciones Rápidas
                </h2>
                <div className="space-y-3">
                  <Link
                    to="/gallery"
                    className="flex items-center p-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Image className="w-6 h-6 mr-3" />
                    <div>
                      <p className="font-semibold">Explorar Galería</p>
                      <p className="text-sm opacity-90">Ver obras disponibles</p>
                    </div>
                  </Link>

                  <Link
                    to="/demo"
                    className="flex items-center p-4 bg-gradient-to-r from-accent to-accent-light text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Shield className="w-6 h-6 mr-3" />
                    <div>
                      <p className="font-semibold">Panel de Demostración</p>
                      <p className="text-sm opacity-90">Ver seguridad en acción</p>
                    </div>
                  </Link>

                  <Link
                    to="/database"
                    className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <FileSignature className="w-6 h-6 mr-3" />
                    <div>
                      <p className="font-semibold">Ver Base de Datos</p>
                      <p className="text-sm opacity-90">Datos cifrados</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Actividad Reciente
                </h2>
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay actividad reciente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-start p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="bg-primary text-white p-2 rounded-lg mr-3">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">💡 ¿Sabías que?</h3>
                <p className="text-sm opacity-90">
                  Todas tus contraseñas están protegidas con bcrypt, que incluye 
                  12 rondas de hashing y un salt único por usuario. ¡Imposible de descifrar!
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">🔒 Cifrado Híbrido</h3>
                <p className="text-sm opacity-90">
                  Las descargas combinan la velocidad de AES-256 con la seguridad 
                  de RSA-2048. Solo tú puedes descifrar tus archivos.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}