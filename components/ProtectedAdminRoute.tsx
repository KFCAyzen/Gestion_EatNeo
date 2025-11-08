'use client'

import { UserRole } from '../hooks/useAuth'
import AdminPage from './AdminPage'

interface ProtectedAdminRouteProps {
  userRole: UserRole
}

export default function ProtectedAdminRoute({ userRole }: ProtectedAdminRouteProps) {
  return <AdminPage userRole={userRole} />
}