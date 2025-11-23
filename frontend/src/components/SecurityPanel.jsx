import { Shield, Lock, FileSignature, Network } from 'lucide-react';

export default function SecurityPanel() {
  const securityLayers = [
    {
      icon: Lock,
      title: 'CAPA 1: Bcrypt',
      description: 'Hash seguro de contraseñas',
      color: 'bg-blue-500',
      details: ['12 rondas de hashing', 'Salt automático', 'Resistente a rainbow tables']
    },
    {
      icon: Shield,
      title: 'CAPA 2: AES-256',
      description: 'Cifrado simétrico de datos',
      color: 'bg-green-500',
      details: ['256 bits de seguridad', 'IV único por registro', 'Datos bancarios protegidos']
    },
    {
      icon: FileSignature,
      title: 'CAPA 3: RSA',
      description: 'Firma digital asimétrica',
      color: 'bg-purple-500',
      details: ['2048 bits RSA', 'SHA-256 hashing', 'No repudio garantizado']
    },
    {
      icon: Network,
      title: 'CAPA 4: Híbrido',
      description: 'AES + RSA combinados',
      color: 'bg-orange-500',
      details: ['Velocidad de AES', 'Seguridad de RSA', 'Descarga protegida']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {securityLayers.map((layer, index) => {
        const Icon = layer.icon;
        return (
          <div key={index} className="card">
            <div className={`${layer.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {layer.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {layer.description}
            </p>

            <ul className="space-y-1">
              {layer.details.map((detail, idx) => (
                <li key={idx} className="text-xs text-gray-500 flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}