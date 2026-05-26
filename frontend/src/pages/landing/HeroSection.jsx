import { Link } from 'react-router-dom'
export default function HeroSection() {
  return (
    <section className="rbg-gradient-to-r from-sky-600 to-sky-800 text-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6">
          <img
            src="/icpep_logo.png"
            alt="ICPEP.SE Logo"
            className="h-20 w-auto mx-auto mb-6"
          />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          Welcome to ICPEP.SE Portal
        </h1>
        <p className="text-lg md:text-xl mb-8 text-sky-100 max-w-3xl mx-auto">
          Integration of Computer Professionals and Educators. Connect, collaborate, and grow with our community of dedicated professionals and educators.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="bg-white text-sky-600 px-8 py-3 rounded-lg font-bold hover:bg-slate-100 transition"
          >
            Join Us Today
          </Link>
          <Link
            to="/login"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-sky-700 transition"
          >
            Sign In
          </Link
          </div>
              </div>
            </div>
          </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
