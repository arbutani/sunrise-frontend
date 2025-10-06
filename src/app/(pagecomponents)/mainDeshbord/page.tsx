'use client'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container } from 'react-bootstrap'
import { Fragment } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute' 

const Page = () => {
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