import { CheckCircle } from 'lucide-react';

export default function SuccessMessage({ message }) {
  if (!message) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
}