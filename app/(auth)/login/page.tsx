import LoginForm from '@/components/auth/LoginForm'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Training Platform
        </h1>
        <p className="text-gray-600">Sign in to access learning materials</p>
      </div>

      <GoogleSignInButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
          Sign up
        </a>
      </p>
    </div>
  )
}
