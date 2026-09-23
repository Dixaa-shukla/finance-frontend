import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import LoginSuccessPage from '@/pages/LoginSuccessPage'
import OAuth2CallbackPage from '@/pages/OAuth2CallbackPage'
import ChangePasswordPage from '@/pages/ChangePasswordPage'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public — redirect away if already signed in */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/*
            Reachable while signed in OR signed out: a reset link revokes every
            session, so someone may well open it in a browser that still has a
            token. Same for the Google callback.
          */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
          <Route path="/login-success" element={<LoginSuccessPage />} />

          {/*
            Signed-in only, and deliberately NOT under PublicOnlyRoute — it needs
            the Bearer token. Someone who has forgotten their password wants
            /forgot-password instead.
          */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/*
            Everything below here requires a valid session.
            ⚠️ THIS MUST STAY A SPLAT ("*"). App renders a nested <Routes> for the
            module pages, and a descendant <Routes> only matches against the part
            of the URL its parent left unconsumed — pinning this to "/" would make
            every module route (/dashboard, /expenses, …) fail to match. "*" also
            catches "/" itself, which App redirects to /dashboard.
          */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
