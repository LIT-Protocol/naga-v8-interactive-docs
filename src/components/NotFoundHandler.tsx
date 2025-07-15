import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// const LEGACY_DOMAIN = "https://legacy-developer.litprotocol.com";
const LEGACY_DOMAIN = "https://developer.litprotocol.com";

// Routes that should show 404 instead of redirecting to legacy
const ROUTES_TO_404 = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/api/*",
  "/_next/*",
  "/static/*",
  "/assets/*",
]);

// Check if a route should show 404 instead of redirecting
const shouldShow404 = (pathname: string): boolean => {
  return Array.from(ROUTES_TO_404).some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route;
  });
};

export const NotFoundHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    // Don't redirect certain paths - show 404 instead
    if (shouldShow404(currentPath)) {
      return;
    }

    // For all other paths, redirect to legacy domain
    const legacyUrl = `${LEGACY_DOMAIN}${currentPath}${location.search}${location.hash}`;
    window.location.href = legacyUrl;
  }, [location]);

  // This component renders a 404 page for paths that shouldn't redirect
  if (shouldShow404(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist in the new
              documentation.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </a>
            <div className="text-sm text-gray-500">
              Looking for older documentation?{" "}
              <a
                href={LEGACY_DOMAIN}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Legacy Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to legacy documentation...</p>
      </div>
    </div>
  );
};
