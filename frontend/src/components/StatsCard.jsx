export default function StatsCard({ icon: Icon, title, value, color = 'primary', trend }) {
  const colorClasses = {
    primary: 'bg-primary text-white',
    accent: 'bg-accent text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-16 h-16 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}