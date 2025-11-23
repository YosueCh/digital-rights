import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import CodeBlock from '../components/CodeBlock';
import { transfersAPI } from '../utils/api';
import { formatDate, formatHash } from '../utils/formatters';
import { FileSignature, CheckCircle, XCircle, Shield } from 'lucide-react';

export default function SignTransfer() {
  const { transferId } = useParams();
  const navigate = useNavigate();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTransfer();
  }, [transferId]);

  const loadTransfer = async () => {
    try {
      setLoading(true);
      const response = await transfersAPI.getById(transferId);
      setTransfer(response.data);
      setVerified(response.data.verificado);
    } catch (err) {
      setError('Error al cargar la transferencia');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignature = async () => {
    try {
      setVerifying(true);
      setError('');

      const response = await transfersAPI.verify(transferId);
      setVerified(response.data.valid);

      if (response.data.valid) {
        await loadTransfer(); // Recargar para actualizar el estado verificado
      }
    } catch (err) {
      setError('Error al verificar la firma');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner message="Cargando transferencia..." />
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
            ✍️ Certificado de Transferencia de Derechos
          </h1>
          <p className="text-gray-600">
            Firmado digitalmente con RSA-2048 + SHA-256
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documento Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de Verificación */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Estado de la Firma Digital
                </h2>
                {verified !== null && (
                  <span className={`badge ${verified ? 'badge-success' : 'badge-error'}`}>
                    {verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1 inline" />
                        Verificada
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1 inline" />
                        No Verificada
                      </>
                    )}
                  </span>
                )}
              </div>

              {verified === true ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 font-semibold mb-1">
                        Firma Digital Válida
                      </p>
                      <p className="text-xs text-green-700">
                        El documento ha sido verificado y no ha sido alterado desde su firma.
                        La autenticidad del vendedor está garantizada.
                      </p>
                    </div>
                  </div>
                </div>
              ) : verified === false ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-semibold mb-1">
                        Firma Digital Inválida
                      </p>
                      <p className="text-xs text-red-700">
                        El documento puede haber sido alterado o la firma no coincide.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleVerifySignature}
                  disabled={verifying}
                  className="w-full btn-primary"
                >
                  {verifying ? (
                    <div className="spinner w-5 h-5 border-2 mx-auto"></div>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2 inline" />
                      Verificar Firma Digital
                    </>
                  )}
                </button>
              )}

              {error && <ErrorMessage message={error} />}
            </div>

            {/* Documento de Transferencia */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Certificado de Propiedad
              </h2>

              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {transfer.documento}
                </pre>
              </div>
            </div>

            {/* Hash del Documento */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Hash SHA-256 del Documento
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Este hash representa el contenido exacto del documento. Cualquier
                modificación cambiaría completamente este valor.
              </p>

              <CodeBlock code={transfer.hash} language="text" />

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Algoritmo:</p>
                  <p className="font-semibold">SHA-256</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Longitud:</p>
                  <p className="font-semibold">64 caracteres hex (256 bits)</p>
                </div>
              </div>
            </div>

            {/* Firma Digital */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Firma Digital RSA
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Esta firma fue generada cifrando el hash del documento con la llave
                privada RSA del vendedor. Solo puede ser verificada con su llave pública.
              </p>

              <CodeBlock code={transfer.firma} language="text" />

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Algoritmo:</p>
                  <p className="font-semibold">RSA-2048</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Hash:</p>
                  <p className="font-semibold">SHA-256</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Longitud:</p>
                  <p className="font-semibold">{transfer.firma.length} chars</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar de Información */}
          <div className="lg:col-span-1 space-y-6">
            {/* Detalles de la Transferencia */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Detalles
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Obra:</p>
                  <p className="font-semibold">{transfer.obra.titulo}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-gray-600 mb-1">Vendedor:</p>
                  <p className="font-semibold">{transfer.vendedor.nombre}</p>
                  <p className="text-xs text-gray-500">{transfer.vendedor.email}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-gray-600 mb-1">Comprador:</p>
                  <p className="font-semibold">{transfer.comprador.nombre}</p>
                  <p className="text-xs text-gray-500">{transfer.comprador.email}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-gray-600 mb-1">Fecha:</p>
                  <p className="font-semibold">{formatDate(transfer.timestamp)}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-gray-600 mb-1">ID de Transferencia:</p>
                  <p className="font-mono text-xs">{transfer.id}</p>
                </div>
              </div>
            </div>

            {/* Proceso de Firma */}
            <div className="card bg-gradient-to-br from-purple-50 to-blue-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Proceso de Firma Digital
              </h3>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Generar Hash</p>
                    <p className="text-gray-600 text-xs">SHA-256 del documento</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Firmar Hash</p>
                    <p className="text-gray-600 text-xs">Con llave privada RSA del vendedor</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Verificar</p>
                    <p className="text-gray-600 text-xs">Con llave pública del vendedor</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Garantías */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Garantías de Seguridad
              </h3>

              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Autenticidad:</strong> Garantiza que la firma proviene del vendedor</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Integridad:</strong> Detecta cualquier modificación del documento</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>No Repudio:</strong> El vendedor no puede negar haber firmado</span>
                </li>
              </ul>
            </div>

            {/* Botón de Descarga */}
            {transfer.verificado && (
              <button
                onClick={() => navigate(`/download/${transfer.id}`)}
                className="w-full btn-accent"
              >
                <FileSignature className="w-5 h-5 mr-2 inline" />
                Proceder a Descarga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}