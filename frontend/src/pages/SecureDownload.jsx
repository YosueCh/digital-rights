import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import CodeBlock from '../components/CodeBlock';
import { downloadsAPI, transfersAPI } from '../utils/api';
import { unpackageHybrid, downloadFile } from '../utils/hybridCrypto';
import { formatBytes, formatHash } from '../utils/formatters';
import { Download, Lock, Key, Shield, CheckCircle, Package } from 'lucide-react';

export default function SecureDownload() {
  const { transferId } = useParams();

  const [transfer, setTransfer] = useState(null);
  const [downloadPackage, setDownloadPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: Preparar, 3: Descargar

  useEffect(() => {
    loadTransfer();
  }, [transferId]);

  const loadTransfer = async () => {
    try {
      setLoading(true);
      const response = await transfersAPI.getById(transferId);
      setTransfer(response.data);
    } catch (err) {
      setError('Error al cargar la transferencia');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareDownload = async () => {
    try {
      setPreparing(true);
      setError('');

      console.log('🔐 Preparando descarga con cifrado híbrido...');

      // Solicitar paquete híbrido al servidor
      const response = await downloadsAPI.prepare(transferId);
      setDownloadPackage(response.data);

      setSuccess('✅ Paquete híbrido preparado con éxito');
      setStep(3);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al preparar la descarga');
      console.error(err);
    } finally {
      setPreparing(false);
    }
  };

  const handleDownloadFile = async () => {
    try {
      setDownloading(true);
      setError('');

      console.log('📥 Descifrando y descargando archivo...');

      // Obtener llave privada del usuario (en producción vendría de un lugar seguro)
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Nota: En una implementación real, la llave privada no debería estar en localStorage
      // Aquí es solo para demostración
      const privateKey = transfer.comprador.private_key || 
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----';

      // Desempaquetar con cifrado híbrido (CAPA 4)
      const decryptedBuffer = await unpackageHybrid(
        downloadPackage.package,
        privateKey
      );

      // Descargar archivo
      downloadFile(
        decryptedBuffer,
        downloadPackage.fileInfo.originalName || 'archivo_descargado.png',
        'image/png'
      );

      setSuccess('🎉 ¡Archivo descargado exitosamente!');

    } catch (err) {
      setError('Error al descifrar o descargar el archivo: ' + err.message);
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner message="Cargando información de descarga..." />
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ErrorMessage message="Transferencia no encontrada" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📥 Descarga Segura con Cifrado Híbrido
          </h1>
          <p className="text-gray-600">
            Archivo protegido con AES-256 + RSA-2048
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Información', icon: Shield },
              { num: 2, label: 'Preparar Paquete', icon: Package },
              { num: 3, label: 'Descargar', icon: Download }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                    step >= s.num ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 ml-3">
                    <p className={`text-sm font-medium ${step >= s.num ? 'text-primary' : 'text-gray-500'}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < 2 && (
                    <div className={`flex-1 h-1 mx-4 ${step > s.num ? 'bg-primary' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* PASO 1: Información */}
            {step === 1 && (
              <>
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Proceso de Cifrado Híbrido
                  </h2>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                    <p className="text-sm text-gray-700 mb-4">
                      El cifrado híbrido combina lo mejor de dos mundos:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Lock className="w-5 h-5 text-blue-500 mr-2" />
                          <h3 className="font-bold text-gray-900">AES-256</h3>
                        </div>
                        <p className="text-xs text-gray-600">
                          Cifra el ARCHIVO completo de forma rápida y eficiente
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Key className="w-5 h-5 text-purple-500 mr-2" />
                          <h3 className="font-bold text-gray-900">RSA-2048</h3>
                        </div>
                        <p className="text-xs text-gray-600">
                          Cifra la LLAVE AES de forma segura con tu llave pública
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Servidor: Generar Llave AES Temporal
                        </h3>
                        <p className="text-sm text-gray-600">
                          Se genera una llave AES-256 de 32 bytes completamente aleatoria
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Servidor: Cifrar Archivo con AES
                        </h3>
                        <p className="text-sm text-gray-600">
                          El archivo de alta resolución se cifra con la llave temporal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Servidor: Cifrar Llave AES con tu RSA Público
                        </h3>
                        <p className="text-sm text-gray-600">
                          La llave temporal se cifra con tu llave pública RSA-2048
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        4
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Cliente: Descifrar Llave AES con tu RSA Privado
                        </h3>
                        <p className="text-sm text-gray-600">
                          Solo tú puedes descifrar la llave AES con tu llave privada
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        5
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Cliente: Descifrar Archivo con Llave AES
                        </h3>
                        <p className="text-sm text-gray-600">
                          Usas la llave AES descifrada para recuperar el archivo original
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full btn-primary"
                >
                  Continuar
                </button>
              </>
            )}

            {/* PASO 2: Preparar Paquete */}
            {step === 2 && (
              <>
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Preparar Paquete de Descarga
                  </h2>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Al hacer clic en "Preparar Descarga", el servidor:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-yellow-700">
                      <li>• Generará una llave AES-256 temporal única</li>
                      <li>• Cifrará tu archivo con esta llave</li>
                      <li>• Cifrará la llave con tu RSA público</li>
                      <li>• Creará el paquete híbrido seguro</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-gray-600">Archivo:</span>
                      <span className="font-semibold">{transfer.obra.titulo}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-gray-600">Cifrado de Datos:</span>
                      <span className="badge badge-info">AES-256-CBC</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-gray-600">Cifrado de Llave:</span>
                      <span className="badge badge-info">RSA-2048-OAEP</span>
                    </div>
                  </div>

                  {error && <ErrorMessage message={error} />}
                  {success && <SuccessMessage message={success} />}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary"
                    disabled={preparing}
                  >
                    Volver
                  </button>
                  <button
                    onClick={handlePrepareDownload}
                    disabled={preparing}
                    className="flex-1 btn-primary"
                  >
                    {preparing ? (
                      <div className="spinner w-5 h-5 border-2 mx-auto"></div>
                    ) : (
                      <>
                        <Package className="w-5 h-5 mr-2 inline" />
                        Preparar Descarga
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* PASO 3: Descargar */}
            {step === 3 && downloadPackage && (
              <>
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Paquete Híbrido Preparado
                  </h2>

                  <SuccessMessage message="El paquete está listo para descarga" />

                  <div className="mt-6 space-y-4">
                    {/* Datos Cifrados */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Datos Cifrados (Base64)
                      </h3>
                      <CodeBlock 
                        code={downloadPackage.package.encryptedData.substring(0, 200) + '...'} 
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Tamaño: {formatBytes(Buffer.from(downloadPackage.package.encryptedData, 'base64').length)}
                      </p>
                    </div>

                    {/* Llave AES Cifrada */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Llave AES Cifrada con RSA (Base64)
                      </h3>
                      <CodeBlock 
                        code={downloadPackage.package.encryptedKey.substring(0, 200) + '...'} 
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Solo tú puedes descifrarla con tu llave privada RSA
                      </p>
                    </div>

                    {/* IV */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Vector de Inicialización (IV)
                      </h3>
                      <CodeBlock code={downloadPackage.package.iv} />
                      <p className="text-xs text-gray-500 mt-2">
                        IV único de 16 bytes (32 caracteres hex)
                      </p>
                    </div>
                  </div>

                  {error && <ErrorMessage message={error} />}
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    ✅ Listo para Descargar
                  </h3>

                  <p className="text-sm text-gray-700 mb-4">
                    Al hacer clic en descargar, tu navegador:
                  </p>

                  <ol className="space-y-2 text-sm text-gray-700 mb-6">
                    <li className="flex items-start">
                      <span className="font-bold mr-2">1.</span>
                      Descifrará la llave AES con tu RSA privado
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2">2.</span>
                      Usará la llave AES para descifrar el archivo
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2">3.</span>
                      Descargará el archivo original en alta resolución
                    </li>
                  </ol>

                  <button
                    onClick={handleDownloadFile}
                    disabled={downloading}
                    className="w-full btn-accent"
                  >
                    {downloading ? (
                      <div className="spinner w-5 h-5 border-2 mx-auto"></div>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2 inline" />
                        Descifrar y Descargar Archivo
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información del Archivo */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Información del Archivo
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Obra:</p>
                  <p className="font-semibold">{transfer.obra.titulo}</p>
                </div>

                {downloadPackage && (
                  <>
                    <div className="pt-3 border-t">
                      <p className="text-gray-600 mb-1">Archivo Original:</p>
                      <p className="font-semibold text-xs">{downloadPackage.fileInfo.originalName}</p>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-gray-600 mb-1">Tamaño Cifrado:</p>
                      <p className="font-semibold">{formatBytes(downloadPackage.fileInfo.size)}</p>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t">
                  <p className="text-gray-600 mb-1">Vendedor:</p>
                  <p className="font-semibold">{transfer.vendedor.nombre}</p>
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🔒 Capas de Seguridad
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">CAPA 1: Bcrypt</p>
                    <p className="text-xs text-gray-600">Tu contraseña está protegida</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">CAPA 2: AES-256</p>
                    <p className="text-xs text-gray-600">Archivo cifrado en servidor</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">CAPA 3: RSA</p>
                    <p className="text-xs text-gray-600">Transferencia firmada digitalmente</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">CAPA 4: Híbrido</p>
                    <p className="text-xs text-gray-600">Descarga protegida de extremo a extremo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ventajas */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                💡 Ventajas del Híbrido
              </h3>

              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Velocidad:</strong> AES es extremadamente rápido para archivos grandes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Seguridad:</strong> RSA protege la llave de descifrado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Confidencialidad:</strong> Solo tú puedes descifrarlo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Defense in Depth:</strong> Múltiples capas de protección</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}