import { Link } from 'react-router-dom';
import { Image as ImageIcon, User, DollarSign } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

export default function AssetCard({ asset }) {
  return (
    <div className="card hover:scale-105 transition-transform duration-200">
      {/* Preview Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 overflow-hidden">
        {asset.preview_path ? (
          <img
            src={asset.preview_path}
            alt={asset.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Badge de cifrado */}
        <div className="absolute top-2 right-2">
          <span className="badge bg-green-500 text-white text-xs">
            🔐 Cifrado
          </span>
        </div>
      </div>

      {/* Información */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900 truncate">
          {asset.titulo}
        </h3>

        <p className="text-gray-600 text-sm line-clamp-2">
          {asset.descripcion || 'Sin descripción'}
        </p>

        {/* Vendedor */}
        <div className="flex items-center text-sm text-gray-500">
          <User className="w-4 h-4 mr-1" />
          <span>{asset.vendedor?.nombre || asset.vendedor_nombre}</span>
        </div>

        {/* Precio */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-2xl font-bold text-primary">
            <DollarSign className="w-6 h-6" />
            <span>{formatPrice(asset.precio)}</span>
          </div>

          <Link
            to={`/purchase/${asset.id}`}
            className="btn-accent text-sm"
          >
            Comprar
          </Link>
        </div>
      </div>
    </div>
  );
}