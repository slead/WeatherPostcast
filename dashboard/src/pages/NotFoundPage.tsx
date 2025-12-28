/**
 * NotFoundPage - 404 error page for unknown routes
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.3: Handle navigation (redirect unknown routes)
 * - 2.3: Handle navigation between cities
 */

import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

/**
 * NotFoundPage component
 * Displays a user-friendly 404 error page with navigation back to home
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or the city couldn't be found.
        </p>
        <Link to="/">
          <Button>
            Return to home page
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
