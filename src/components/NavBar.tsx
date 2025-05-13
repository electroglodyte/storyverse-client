import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">StoryVerse</Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/projects" className="text-gray-700 hover:text-indigo-600">Projects</Link>
            </li>
            {/* Add more navigation items as needed */}
          </ul>
        </nav>
      </div>
    </header>
  );
}