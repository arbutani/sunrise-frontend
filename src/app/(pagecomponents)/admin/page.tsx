'use client'

import { useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { Container, Card, Form, FormLabel, FormControl, Button, Row, Col } from 'react-bootstrap'
import Select from 'react-select'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useToasts } from '@/components/helper/useToasts'
import Toaster from '@/components/helper/toaster'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import ProtectedRoute from '@/components/ProtectedRoute'

const ReactSwal = withReactContent(Swal)

const EmployeePage = () => {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToasts()
  const token = useSelector((state: RootState) => state.auth.token)
  const user = useSelector((state: RootState) => state.auth.user)

  
  useEffect(() => {
    const checkUserAccess = () => {
      let userType = null

     
      if (user && user.type) {
        userType = user.type
      } else {
        
        const stored = localStorage.getItem('user')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            userType = parsed.type || parsed.user_type
          } catch (error) {
            console.error('Error parsing user data:', error)
          }
        }
      }

      
      if (token && !userType) {
        try {
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            if (payload.type) {
              userType = payload.type
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error)
        }
      }
      
      if (userType && userType.toLowerCase() !== 'admin') {
        ReactSwal.fire({
          title: 'Access Denied!',
          text: 'You do not have permission to access this page.',
          icon: 'error',
          confirmButtonText: 'OK',
        }).then(() => {
          router.push('/mainDeshbord')
        })
      }
    }

    checkUserAccess()
  }, [router, token, user])

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Employee Name is required'),
    email_address: Yup.string().email('Invalid email format').required('Email Address is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .required('Password is required'),
  })

  const { register, handleSubmit, control, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
  })
  const { errors } = formState

  const onSubmit = async (values: any) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
      
      const payload = {
        name: values.name,
        email_address: values.email_address,
        password: values.password,
        type: "admin",
      }

      console.log('Sending payload:', payload)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.token) {
            headers['Authorization'] = `Bearer ${parsed.token}`
          }
        }
      }

      console.log('Request headers:', headers)

      const response = await fetch(`${API_URL}/employe-managment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        addToast('Session expired. Please login again.', { toastClass: 'bg-danger', delay: 3000 })
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const res = await response.json()
      console.log('Response:', res)

      if (res.status === true) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 })
        reset()
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Employee added successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        })
      } else {
        addToast(res.message || 'Error creating employee', { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (err: any) {
      console.error('Error creating employee:', err)
      addToast(err?.message || 'Something went wrong', { 
        toastClass: 'bg-danger', 
        delay: 3000 
      })
    }
  }

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3 px-md-4">
        <PageBreadcrumb title="Add Employee" subtitle="Employee List" />
        <Row className="justify-content-center mt-2 mt-sm-3 mt-md-4">
          <Col xs={12} sm={12} md={11} lg={10} xl={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <Card.Title as="h5" className="mb-0 py-2">Add New Employee</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4 p-md-5">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12}>
                      {/* Employee Name */}
                      <div className="mb-3 mb-md-4">
                        <FormLabel className="fw-semibold">
                          Employee Name <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="text"
                          {...register('name')}
                          placeholder="Enter employee name"
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      {/* Email */}
                      <div className="mb-3 mb-md-4">
                        <FormLabel className="fw-semibold">
                          Email Address <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="email"
                          {...register('email_address')}
                          placeholder="Enter email address"
                          isInvalid={!!errors.email_address}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email_address?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      {/* Password */}
                      <div className="mb-3 mb-md-4">
                        <FormLabel className="fw-semibold">
                          Password <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="password"
                          {...register('password')}
                          placeholder="Enter password"
                          isInvalid={!!errors.password}
                        />
                        <Form.Text className="text-muted d-block mt-2 small">
                          At least 8 characters, include uppercase, lowercase, number & special character
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.password?.message as string}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-grid gap-2 mt-3 mt-md-4">
                    <Button 
                      type="submit" 
                      disabled={formState.isSubmitting}
                    >
                      {formState.isSubmitting ? 'Creating Admin...' : 'Create Admin'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

const Page = () => {
  return (
    <ProtectedRoute>
      <EmployeePage />
    </ProtectedRoute>
  )
}

export default Page