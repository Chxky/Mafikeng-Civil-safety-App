export default function CopyrightFooter() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-6 mt-8">
      <div className="max-w-lg mx-auto text-center">
        {/* App Logo */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-civic-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-gray-800 dark:text-gray-200">Mahikeng Civic Safety</span>
        </div>

        {/* Copyright */}
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          &copy; 2026 Pardon Mahara
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Built for the Mahikeng Community
        </p>

        {/* Links */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <a href="/leaders" className="text-xs text-civic-600 hover:underline">
            Community Leaders
          </a>
          <span className="text-gray-300">|</span>
          <a href="tel:10111" className="text-xs text-danger-600 hover:underline">
            SAPS Emergency: 10111
          </a>
        </div>

        {/* POPI Notice */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            This application complies with the Protection of Personal Information Act (POPIA), 2013.
            Your data is encrypted and minimized. Safety reports are anonymous.
            Emergency contacts are stored only on your device.
          </p>
        </div>

        {/* Version */}
        <p className="text-[10px] text-gray-300 mt-2">
          v1.0.0 &middot; Made with care for Mahikeng
        </p>
      </div>
    </footer>
  );
}
