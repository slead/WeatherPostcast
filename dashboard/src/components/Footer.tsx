/**
 * Footer component with GitHub repo link
 */

export function Footer() {
  return (
    <footer className="py-4 px-6 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50">
      <a
        href="https://github.com/slead/WeatherReporter"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-700 hover:underline"
      >
        View on GitHub
      </a>
    </footer>
  );
}

export default Footer;
