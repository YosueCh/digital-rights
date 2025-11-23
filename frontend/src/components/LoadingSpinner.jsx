export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="spinner mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
