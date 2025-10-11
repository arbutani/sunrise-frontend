import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/layouts/MainLayout'
import { ChildrenType } from '@/types'

const Layout = ({ children }: ChildrenType) => {
  return <MainLayout><ProtectedRoute>{children}</ProtectedRoute></MainLayout>
}

export default Layout
