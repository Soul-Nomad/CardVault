import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AuthPage() {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-inter">
      <div className="w-full max-w-[420px] bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center mb-8">
          <span className="text-white font-bold text-2xl tracking-tighter">CV</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Welcome to CardVault</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">Securely manage and track your digital assets, gift cards, and store credits.</p>
        
        <button 
          onClick={signInWithGoogle}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-neutral-200 transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#000000" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#000000" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#000000" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#000000" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
