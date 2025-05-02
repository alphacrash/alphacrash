import { Laptop2 } from "lucide-react";

const MobileView = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        <Laptop2 className="mx-auto mb-6 text-blue-600" size={64} />
        <h1 className="text-2xl font-bold mb-4">Desktop Only</h1>
        <p className="text-gray-600">
          This SQL page is optimized for desktop use. Please access it on a
          larger screen for the best learning experience.
        </p>
      </div>
    </div>
  );
};

export default MobileView;
