import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CodeBlock from '../components/CodeBlock';
import { demoAPI } from '../utils/api';
import { Database, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

export default function DatabaseView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [encryptedRes, hashesRes] = await Promise.all([
        demoAPI.getEncryptedData(),
        demoAPI.getBcryptHashes()
      ]);

      setData({
        encrypted: encryptedRes.data,
        hashes: hashesRes.data
      });
    } catch (err) {
      setError('Error al cargar datos de la base de datos');
      console.error(err);
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
            🗄️ Vista de Base de Datos
          </h1>
          <p className="text-gray-600">
            Visualiza cómo se almacenan los datos sensibles de forma cifrada
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-semibold mb-1">
                Vista de Demostración
              </p>
              <p className="text-xs text-yellow-700">
                Esta es una vista de solo lectura para propósitos educativos. Los datos
                sensibles están completamente cifrados y son ilegibles sin las llaves correctas.
              </p>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <LoadingSpinner message="Cargando datos de la base de datos..." />
        ) : (
          <div className="space-y-6">
            {/* Tabla: Usuarios (Passwords) */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Database className="w-6 h-6 text-primary mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Tabla: usuarios
                    </h2>
                    <p className="text-sm text-gray-600">
                      Contraseñas protegidas con Bcrypt
                    </p>
                  </div>
                </div>
                <span className="badge badge-info">
                  {data?.hashes?.count || 0} registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Password Hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rondas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.hashes?.hashes?.map((user, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.nombre}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {showSensitive 
                              ? user.passwordHash 
                              : user.passwordHash.substring(0, 30) + '...'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge badge-success">
                            {user.hashInfo.rounds}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Lock className="w-4 h-4 inline mr-1" />
                  <strong>Seguridad Bcrypt:</strong> Cada hash incluye el algoritmo ($2b$),
                  número de rondas (12), salt único y el hash final. Imposible de revertir.
                </p>
              </div>
            </div>

            {/* Tabla: Compradores (Datos Bancarios) */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Database className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Tabla: compradores
                    </h2>
                    <p className="text-sm text-gray-600">
                      Datos bancarios cifrados con AES-256-CBC
                    </p>
                  </div>
                </div>
                <span className="badge badge-success">
                  {data?.encrypted?.count || 0} registros
                </span>
              </div>

              <div className="space-y-4">
                {data?.encrypted?.data?.map((buyer, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {buyer.usuario.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          {buyer.usuario.email}
                        </p>
                      </div>
                      <span className="badge badge-warning">
                        Cifrado AES-256
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-semibold">
                          Nombre Completo (cifrado):
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto font-mono border">
                          {showSensitive 
                            ? buyer.datosEncriptados.nombreCompleto
                            : buyer.datosEncriptados.nombreCompleto.substring(0, 50) + '...'}
                        </code>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-semibold">
                          Tarjeta (cifrada):
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto font-mono border">
                          {showSensitive 
                            ? buyer.datosEncriptados.tarjeta
                            : buyer.datosEncriptados.tarjeta.substring(0, 50) + '...'}
                        </code>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-semibold">
                          CVV (cifrado):
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto font-mono border">
                          {buyer.datosEncriptados.cvv}
                        </code>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-semibold">
                          Expiración (cifrada):
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto font-mono border">
                          {buyer.datosEncriptados.expiracion}
                        </code>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-1 font-semibold">
                        Vector de Inicialización (IV):
                      </p>
                      <code className="text-xs bg-white px-2 py-1 rounded block font-mono border">
                        {buyer.datosEncriptados.iv}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <Lock className="w-4 h-4 inline mr-1" />
                  <strong>Seguridad AES-256:</strong> Cada campo está cifrado individualmente
                  con una llave maestra de 256 bits y un IV único de 16 bytes. Completamente ilegible.
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="card bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Mostrar Datos Completos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ver los valores cifrados sin truncar (solo para demostración)
                  </p>
                </div>
                <button
                  onClick={() => setShowSensitive(!showSensitive)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    showSensitive
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="w-5 h-5 mr-2" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      Mostrar Todo
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-blue-50">
                <h3 className="font-bold text-gray-900 mb-3">
                  🔐 ¿Por qué es seguro?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Las contraseñas nunca se almacenan en texto plano</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Bcrypt incluye salt automático y rondas ajustables</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Datos bancarios cifrados con AES-256 estándar militar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>IV único por registro previene ataques de patrón</span>
                  </li>
                </ul>
              </div>

              <div className="card bg-green-50">
                <h3 className="font-bold text-gray-900 mb-3">
                  ✅ Estándares de Seguridad
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>NIST:</strong> Algoritmos aprobados por estándares</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>OWASP:</strong> Mejores prácticas de seguridad</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>PCI-DSS:</strong> Estándares para datos de pago</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>GDPR:</strong> Protección de datos personales</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}