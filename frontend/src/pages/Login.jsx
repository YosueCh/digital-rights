import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Image, Lock, Mail, LogIn } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  // Credenciales de ejemplo para demostración
  const fillDemoCredentials = (role) => {
    if (role === 'vendedor') {
      setEmail('vendedor@digitalrights.com');
      setPassword('vendedor123');
    } else if (role === 'comprador') {
      setEmail('comprador@digitalrights.com');
      setPassword('comprador123');
    } else {
      setEmail('admin@digitalrights.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-2xl mb-4 shadow-lg">
            <Image className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Digital Rights</h1>
          <p className="text-gray-300">Plataforma segura con 4 capas de cifrado</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && <ErrorMessage message={error} />}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner w-5 h-5 border-2"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">
              🔬 Credenciales de demostración:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => fillDemoCredentials('vendedor')}
                className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
              >
                Vendedor
              </button>
              <button
                onClick={() => fillDemoCredentials('comprador')}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
              >
                Comprador
              </button>
              <button
                onClick={() => fillDemoCredentials('admin')}
                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-accent hover:text-accent-dark font-semibold">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-white text-sm">
            <Lock className="w-4 h-4" />
            <span>Protegido con bcrypt, AES-256, RSA y cifrado híbrido</span>
          </div>
        </div>
      </div>
    </div>
  );
}