import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { assetsAPI, buyersAPI, transfersAPI } from '../utils/api';
import { formatPrice } from '../utils/formatters';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Purchase() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Datos bancarios, 2: Confirmación, 3: Completado

  const [bankData, setBankData] = useState({
    nombreCompleto: '',
    numeroTarjeta: '',
    cvv: '',
    fechaExpiracion: ''
  });

  useEffect(() => {
    loadAsset();
    loadExistingBankData();
  }, [assetId]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const response = await assetsAPI.getById(assetId);
      setAsset(response.data);
    } catch (err) {
      setError('Error al cargar la obra');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingBankData = async () => {
    try {
      const response = await buyersAPI.getBankData();
      if (response.data) {
        setBankData({
          nombreCompleto: response.data.nombreCompleto,
          numeroTarjeta: response.data.numeroTarjeta,
          cvv: response.data.cvv,
          fechaExpiracion: response.data.fechaExpiracion
        });
      }
    } catch (err) {
      // No hay datos bancarios guardados, está bien
      console.log('No hay datos bancarios previos');
    }
  };

  const handleBankDataChange = (e) => {
    const { name, value } = e.target;
    setBankData({
      ...bankData,
      [name]: value
    });
  };

  const handleSaveBankData = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setPurchasing(true);

      // Guardar datos bancarios cifrados (CAPA 2: AES-256)
      await buyersAPI.saveBankData(bankData);

      setSuccess('✅ Datos bancarios guardados de forma segura con AES-256');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar datos bancarios');
    } finally {
      setPurchasing(false);
    }
  };

  const handleConfirmPurchase = async () => {
    setError('');
    setPurchasing(true);

    try {
      // Crear transferencia firmada (CAPA 3: RSA)
      const response = await transfersAPI.create({
        obraId: parseInt(assetId),
        compradorId: JSON.parse(localStorage.getItem('user')).id
      });

      setSuccess('🎉 ¡Compra completada! La transferencia ha sido firmada digitalmente.');
      setStep(3);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate(`/download/${response.data.transfer.id}`);
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la compra');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSpinner message="Cargando información de la obra..." />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorMessage message="Obra no encontrada" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Completar Compra
          </h1>
          <p className="text-gray-600">
            Proceso seguro con cifrado de datos bancarios
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Datos Bancarios' },
              { num: 2, label: 'Confirmación' },
              { num: 3, label: 'Completado' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step >= s.num ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step > s.num ? <CheckCircle className="w-6 h-6" /> : s.num}
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
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            {/* PASO 1: Datos Bancarios */}
            {step === 1 && (
              <div className="card">
                <div className="flex items-center mb-6">
                  <CreditCard className="w-6 h-6 text-primary mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Información de Pago
                  </h2>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                  <div className="flex items-start">
                    <Lock className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-semibold mb-1">
                        Seguridad AES-256
                      </p>
                      <p className="text-xs text-blue-700">
                        Tus datos bancarios serán cifrados con AES-256-CBC antes de almacenarse.
                        Cada campo tiene su propio vector de inicialización (IV) único.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveBankData} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo en la Tarjeta
                    </label>
                    <input
                      type="text"
                      name="nombreCompleto"
                      value={bankData.nombreCompleto}
                      onChange={handleBankDataChange}
                      className="input-field"
                      placeholder="Juan Pérez García"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      name="numeroTarjeta"
                      value={bankData.numeroTarjeta}
                      onChange={handleBankDataChange}
                      className="input-field"
                      placeholder="4532-1234-5678-9010"
                      maxLength="19"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={bankData.cvv}
                        onChange={handleBankDataChange}
                        className="input-field"
                        placeholder="123"
                        maxLength="4"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vencimiento (MM/AA)
                      </label>
                      <input
                        type="text"
                        name="fechaExpiracion"
                        value={bankData.fechaExpiracion}
                        onChange={handleBankDataChange}
                        className="input-field"
                        placeholder="12/25"
                        maxLength="5"
                        required
                      />
                    </div>
                  </div>

                  {error && <ErrorMessage message={error} />}
                  {success && <SuccessMessage message={success} />}

                  <button
                    type="submit"
                    disabled={purchasing}
                    className="w-full btn-primary"
                  >
                    {purchasing ? (
                      <div className="spinner w-5 h-5 border-2 mx-auto"></div>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2 inline" />
                        Cifrar y Guardar Datos
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* PASO 2: Confirmación */}
            {step === 2 && (
              <div className="card">
                <div className="flex items-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Confirmar Compra
                  </h2>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-800">
                    ✅ Tus datos bancarios han sido cifrados y almacenados de forma segura.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Obra:</span>
                    <span className="font-semibold">{asset.titulo}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Vendedor:</span>
                    <span className="font-semibold">{asset.vendedor.nombre}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-semibold text-2xl text-primary">
                      {formatPrice(asset.precio)}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-purple-800 font-semibold mb-1">
                        Firma Digital RSA
                      </p>
                      <p className="text-xs text-purple-700">
                        Al confirmar, se creará un certificado de transferencia que será
                        firmado digitalmente por el vendedor con RSA-2048. Esto garantiza
                        la autenticidad y el no repudio de la transacción.
                      </p>
                    </div>
                  </div>
                </div>

                {error && <ErrorMessage message={error} />}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary"
                    disabled={purchasing}
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={purchasing}
                    className="flex-1 btn-primary"
                  >
                    {purchasing ? (
                      <div className="spinner w-5 h-5 border-2 mx-auto"></div>
                    ) : (
                      'Confirmar Compra'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Completado */}
            {step === 3 && (
              <div className="card text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ¡Compra Completada!
                </h2>

                <SuccessMessage message={success} />

                <div className="mt-6 space-y-4 text-left bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Datos Cifrados</p>
                      <p className="text-xs text-gray-600">Información bancaria protegida con AES-256</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Transferencia Firmada</p>
                      <p className="text-xs text-gray-600">Certificado con firma digital RSA-2048</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Listo para Descargar</p>
                      <p className="text-xs text-gray-600">Descarga segura con cifrado híbrido</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mt-6 text-sm">
                  Redirigiendo a la página de descarga...
                </p>
              </div>
            )}
          </div>

          {/* Resumen de Obra */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Resumen de Compra
              </h3>

              <div className="relative h-48 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 overflow-hidden">
                {asset.preview_path ? (
                  <img
                    src={asset.preview_path}
                    alt={asset.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Lock className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              <h4 className="font-bold text-gray-900 mb-2">{asset.titulo}</h4>
              <p className="text-sm text-gray-600 mb-4">
                {asset.descripcion || 'Sin descripción'}
              </p>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendedor:</span>
                  <span className="font-semibold">{asset.vendedor.nombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Archivo:</span>
                  <span className="badge badge-success">🔒 Cifrado</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(asset.precio)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}