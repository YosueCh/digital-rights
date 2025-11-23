import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Image, 
  FileSignature, 
  Download, 
  Database, 
  FlaskConical, 
  LogOut, 
  User 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/gallery', icon: Image, label: 'Galería' },
    { path: '/demo', icon: FlaskConical, label: 'Demo Seguridad' },
    { path: '/database', icon: Database, label: 'Base de Datos' },
  ];

  return (
    <nav className="bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y links */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-xl hidden sm:block">
                  Digital Rights
                </span>
              </Link>
            </div>

            {/* Navigation links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary-dark text-white'
                        : 'text-gray-300 hover:bg-primary-light hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-white">
              <User className="w-5 h-5" />
              <div className="text-sm">
                <p className="font-semibold">{user?.nombre}</p>
                <p className="text-xs text-gray-300 capitalize">{user?.rol}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-dark transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive(link.path)
                    ? 'bg-primary-dark text-white'
                    : 'text-gray-300 hover:bg-primary-light hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}