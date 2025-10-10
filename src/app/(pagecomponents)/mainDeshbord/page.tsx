'use client'
import { useEffect, Fragment} from 'react'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container } from 'react-bootstrap'
import ProtectedRoute from '@/components/ProtectedRoute'
import { appTitle } from '@/helpers'
 




const Page = () => {

  useEffect(() => {
    document.title = `${appTitle}Dashboard`
  }, [])

  return (
    <ProtectedRoute>
    <Fragment>
      <Container fluid>
        <PageBreadcrumb title="Home" />
      </Container>
      </Fragment>
    </ProtectedRoute> 
  )
}

export default Page     