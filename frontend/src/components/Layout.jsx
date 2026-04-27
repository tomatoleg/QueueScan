export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="opacity-50 mt-1">
            Realtime Scanner Dashboard
          </div>
        </div>

        {children}

      </div>
    </div>
  );
}
