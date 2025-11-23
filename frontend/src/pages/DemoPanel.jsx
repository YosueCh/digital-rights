import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CodeBlock from '../components/CodeBlock';
import { demoAPI } from '../utils/api';
import { 
  Lock, 
  Shield, 
  FileSignature, 
  Network, 
  Eye, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DemoPanel() {
  const [activeTab, setActiveTab] = useState('bcrypt');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab) => {
    try {
      setLoading(true);
      setError('');

      let response;
      switch (tab) {
        case 'bcrypt':
          response = await demoAPI.getBcryptHashes();
          break;
        case 'aes':
          response = await demoAPI.getEncryptedData();
          break;
        case 'rsa':
          response = await demoAPI.getSignatures();
          break;
        case 'hybrid':
          response = await demoAPI.getHybridPackages();
          break;
        case 'summary':
          response = await demoAPI.getSecuritySummary();
          break;
        default:
          break;
      }

      setData(response.data);
    } catch (err) {
      setError('Error al cargar datos de demostración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'bcrypt', label: 'CAPA 1: Bcrypt', icon: Lock, color: 'blue' },
    { id: 'aes', label: 'CAPA 2: AES-256', icon: Shield, color: 'green' },
    { id: 'rsa', label: 'CAPA 3: RSA', icon: FileSignature, color: 'purple' },
    { id: 'hybrid', label: 'CAPA 4: Híbrido', icon: Network, color: 'orange' },
    { id: 'summary', label: 'Resumen', icon: Eye, color: 'gray' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔬 Panel de Demostración de Seguridad
          </h1>
          <p className="text-gray-600">
            Visualiza las 4 capas de seguridad criptográfica en acción
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-500 text-white shadow-lg`
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} />}

        {/* Loading */}
        {loading && <LoadingSpinner message="Cargando datos..." />}

        {/* Content */}
        {!loading && data && (
          <div className="space-y-6">
            {/* CAPA 1: Bcrypt */}
            {activeTab === 'bcrypt' && (
              <>
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🔐 CAPA 1: Hash de Contraseñas con Bcrypt
                  </h2>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Bcrypt</strong> es un algoritmo de hashing diseñado específicamente
                      para contraseñas. Incluye un salt automático y permite ajustar el factor
                      de trabajo (número de rondas).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-primary mb-1">12</p>
                      <p className="text-sm text-gray-600">Rondas de Hashing</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-primary mb-1">{data.count}</p>
                      <p className="text-sm text-gray-600">Usuarios Registrados</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-primary mb-1">60</p>
                      <p className="text-sm text-gray-600">Caracteres Hash</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.hashes?.map((user, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{user.nombre}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <span className="badge badge-success">
                            {user.hashInfo.rounds} rondas
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Hash Completo:</p>
                            <CodeBlock code={user.passwordHash} />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Algoritmo:</p>
                              <p className="font-semibold">${user.hashInfo.algorithm}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Salt (primeros 22):</p>
                              <p className="font-mono text-xs truncate">{user.hashInfo.salt}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Longitud:</p>
                              <p className="font-semibold">{user.hashInfo.hashLength} chars</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-green-50">
                  <h3 className="font-bold text-gray-900 mb-3">✅ Ventajas de Bcrypt</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                      Salt único generado automáticamente para cada contraseña
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                      Resistente a ataques de rainbow tables
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                      Factor de trabajo ajustable (adaptable al hardware futuro)
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                      Imposible de revertir (función unidireccional)
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* CAPA 2: AES-256 */}
            {activeTab === 'aes' && (
              <>
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🛡️ CAPA 2: Cifrado Simétrico con AES-256-CBC
                  </h2>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
                    <p className="text-sm text-green-800">
                      <strong>AES-256-CBC</strong> es el estándar de cifrado simétrico más seguro.
                      Cada registro tiene su propio Vector de Inicialización (IV) único de 16 bytes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600 mb-1">256</p>
                      <p className="text-sm text-gray-600">Bits de Llave</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600 mb-1">{data.count}</p>
                      <p className="text-sm text-gray-600">Registros Cifrados</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600 mb-1">16</p>
                      <p className="text-sm text-gray-600">Bytes de IV</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.data?.map((buyer, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <p className="font-semibold text-gray-900">{buyer.usuario.nombre}</p>
                          <p className="text-sm text-gray-500">{buyer.usuario.email}</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Nombre Completo (Cifrado):</p>
                            <CodeBlock code={buyer.datosEncriptados.nombreCompleto.substring(0, 100) + '...'} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">Tarjeta (Cifrada):</p>
                            <CodeBlock code={buyer.datosEncriptados.tarjeta.substring(0, 100) + '...'} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">CVV (Cifrado):</p>
                            <CodeBlock code={buyer.datosEncriptados.cvv} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">Vector de Inicialización (IV):</p>
                            <CodeBlock code={buyer.datosEncriptados.iv} />
                          </div>

                          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                            <p className="text-xs text-yellow-800">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              Estos datos son completamente ilegibles sin la llave maestra de 32 bytes.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-blue-50">
                  <h3 className="font-bold text-gray-900 mb-3">📚 Información Técnica</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Algoritmo:</p>
                      <p className="font-semibold">AES-256-CBC</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Modo:</p>
                      <p className="font-semibold">CBC (Cipher Block Chaining)</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Tamaño de Llave:</p>
                      <p className="font-semibold">256 bits (32 bytes)</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Tamaño de IV:</p>
                      <p className="font-semibold">128 bits (16 bytes)</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CAPA 3: RSA */}
            {activeTab === 'rsa' && (
              <>
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    ✍️ CAPA 3: Firma Digital con RSA-2048
                  </h2>

                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
                    <p className="text-sm text-purple-800">
                      <strong>RSA</strong> con llaves de 2048 bits garantiza la autenticidad,
                      integridad y no repudio de las transferencias digitales.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-1">2048</p>
                      <p className="text-sm text-gray-600">Bits RSA</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-1">{data.count}</p>
                      <p className="text-sm text-gray-600">Firmas Digitales</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-1">256</p>
                      <p className="text-sm text-gray-600">Bits SHA Hash</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.signatures?.map((sig, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {sig.obra}
                            </p>
                            <p className="text-sm text-gray-500">
                              {sig.vendedor} → {sig.comprador}
                            </p>
                          </div>
                          {sig.verificado ? (
                            <span className="badge badge-success">
                              <CheckCircle className="w-4 h-4 mr-1 inline" />
                              Verificada
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              Pendiente
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Hash SHA-256 del Documento:</p>
                            <CodeBlock code={sig.hashDocumento} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">Firma Digital RSA:</p>
                            <CodeBlock code={sig.firmaDigital.substring(0, 200) + '...'} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Timestamp:</p>
                              <p className="font-semibold">{new Date(sig.timestamp).toLocaleString('es-MX')}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">ID:</p>
                              <p className="font-semibold">#{sig.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-purple-50">
                  <h3 className="font-bold text-gray-900 mb-3">🔒 Garantías de RSA</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                      <strong>Autenticidad:</strong> Verifica que la firma proviene del vendedor
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                      <strong>Integridad:</strong> Detecta cualquier modificación del documento
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                      <strong>No Repudio:</strong> El vendedor no puede negar haber firmado
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* CAPA 4: Híbrido */}
            {activeTab === 'hybrid' && (
              <>
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🌐 CAPA 4: Cifrado Híbrido (AES + RSA)
                  </h2>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
                    <p className="text-sm text-orange-800">
                      El <strong>cifrado híbrido</strong> combina AES-256 para cifrar datos
                      y RSA-2048 para proteger la llave AES, logrando velocidad y seguridad.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-orange-600 mb-1">AES+RSA</p>
                      <p className="text-sm text-gray-600">Algoritmos Combinados</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-orange-600 mb-1">{data.count}</p>
                      <p className="text-sm text-gray-600">Paquetes Híbridos</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-orange-600 mb-1">E2E</p>
                      <p className="text-sm text-gray-600">End-to-End</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.packages?.map((pkg, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <p className="font-semibold text-gray-900">{pkg.obra}</p>
                          <p className="text-sm text-gray-500">Comprador: {pkg.comprador}</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Llave AES Cifrada con RSA:</p>
                            <CodeBlock code={pkg.llaveAESCifrada} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">IV del Cifrado:</p>
                            <CodeBlock code={pkg.ivCifrado} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Timestamp:</p>
                              <p className="font-semibold">{new Date(pkg.timestamp).toLocaleString('es-MX')}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Estado:</p>
                              {pkg.completado ? (
                                <span className="badge badge-success text-xs">Completado</span>
                              ) : (
                                <span className="badge badge-warning text-xs">Pendiente</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-bold text-gray-900 mb-4">🔄 Flujo del Cifrado Híbrido</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-2">📤 Servidor (Envío)</h4>
                      <ol className="space-y-2 text-xs text-gray-700">
                        <li>1. Generar llave AES temporal (32 bytes)</li>
                        <li>2. Cifrar ARCHIVO con AES-256</li>
                        <li>3. Cifrar LLAVE AES con RSA público del comprador</li>
                        <li>4. Enviar paquete híbrido</li>
                      </ol>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-600 mb-2">📥 Cliente (Recepción)</h4>
                      <ol className="space-y-2 text-xs text-gray-700">
                        <li>1. Recibir paquete híbrido</li>
                        <li>2. Descifrar LLAVE AES con RSA privado</li>
                        <li>3. Descifrar ARCHIVO con llave AES</li>
                        <li>4. Obtener archivo original</li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">💡 Ventajas</h4>
                    <ul className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        Velocidad de AES
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        Seguridad de RSA
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        Defense in Depth
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        E2E Protection
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Resumen */}
            {activeTab === 'summary' && data.securityLayers && (
              <>
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📊 Resumen de Seguridad del Sistema
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold mb-1">{data.statistics.usuarios}</p>
                      <p className="text-sm">Usuarios</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold mb-1">{data.statistics.datosEncriptados}</p>
                      <p className="text-sm">Datos Cifrados</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold mb-1">{data.statistics.firmasDigitales}</p>
                      <p className="text-sm">Firmas</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold mb-1">{data.statistics.descargasHibridas}</p>
                      <p className="text-sm">Descargas</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(data.securityLayers).map(([key, layer]) => {
                      const icons = {
                        capa1: Lock,
                        capa2: Shield,
                        capa3: FileSignature,
                        capa4: Network
                      };
                      const Icon = icons[key];

                      return (
                        <div key={key} className="border rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{layer.name}</h3>
                              <p className="text-sm text-gray-600">{layer.usage}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Algoritmo:</span>
                              <span className="font-semibold">{layer.algorithm}</span>
                            </div>
                            {layer.keySize && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tamaño:</span>
                                <span className="font-semibold">{layer.keySize}</span>
                              </div>
                            )}
                            {layer.rounds && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Rondas:</span>
                                <span className="font-semibold">{layer.rounds}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-gray-600">Estado:</span>
                              {layer.implemented ? (
                                <span className="badge badge-success">
                                  <CheckCircle className="w-3 h-3 mr-1 inline" />
                                  Activa
                                </span>
                              ) : (
                                <span className="badge badge-error">Inactiva</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    ✅ Sistema Completamente Seguro
                  </h3>
                  <p className="text-gray-700 mb-4">
                    La plataforma Digital Rights implementa 4 capas de seguridad independientes
                    que trabajan en conjunto para proteger:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Autenticación:</strong> Contraseñas con bcrypt</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Confidencialidad:</strong> Datos con AES-256</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>No Repudio:</strong> Firmas con RSA-2048</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Transferencia:</strong> Cifrado híbrido E2E</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}