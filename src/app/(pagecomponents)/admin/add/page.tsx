'use client'

import { useEffect, Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { Container, Card, Form, FormLabel, FormControl, Button, Row, Col, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useToasts } from '@/components/helper/useToasts'
import Toaster from '@/components/helper/toaster'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { appTitle } from '@/helpers'
import { clearToken, setToken } from '@/store/authSlice'
import { jwtDecode } from 'jwt-decode'

const ReactSwal = withReactContent(Swal)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

let isShowingSessionAlert = false

class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  }
  
  private async handleResponse(response: Response, onTokenExpired: () => Promise<void>) {
    if (response.status === 401) {
      await onTokenExpired()
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async get(url: string, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response, onTokenExpired);
  }
  
  async post(url: string, data: any, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response, onTokenExpired);
  }
  
  async put(url: string, data: any, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response, onTokenExpired);
  }
  
  async delete(url: string, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response, onTokenExpired);
  }
}

export const apiClient = new ApiClient();

const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const AddAdminPage = () => {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToasts()
  const dispatch = useDispatch()
  const token = useSelector((state: RootState) => state.auth.token)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    document.title = `${appTitle}Add Admin`
  }, [])

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Admin Name is required'),
    email_address: Yup.string().email('Invalid email format').required('Email Address is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .required('Password is required'),
  })

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
  })
  const { errors } = formState

  const handleTokenExpired = async () => {
    if (!isShowingSessionAlert) {
      isShowingSessionAlert = true
      
      await Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please login again.',
        confirmButtonText: 'OK',
        allowOutsideClick: false,
      })
      
      setTimeout(() => {
        isShowingSessionAlert = false
      }, 1000)
    }
    
    dispatch(clearToken())
    localStorage.removeItem('user')
    router.push('/login')
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (token && validateToken(token)) {
        setIsAuthChecking(false)
        return
      }

      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.token && validateToken(parsed.token)) {
            dispatch(setToken(parsed.token))
            setIsAuthChecking(false)
            return
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
        }
      }

      await handleTokenExpired()
    }

    checkAuth()
  }, [dispatch, token])

  const onSubmit = async (values: any) => {
    try {
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      const payload = {
        name: values.name,
        email_address: values.email_address,
        password: values.password,
        type: 'admin',
      }

      const res = await apiClient.post('/employee-management', payload, token, handleTokenExpired)

      if (res.status === true) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 })
        reset()
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Admin added successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        })
        router.push('/admin')
      } else {
        addToast(res.message || 'Error creating admin', { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('Session expired')) {
        return
      }
      addToast(err?.message || 'Something went wrong', {
        toastClass: 'bg-danger',
        delay: 3000,
      })
    }
  }

  if (isAuthChecking) {
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Checking authentication...
        </div>
      </Container>
    )
  }

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Add Admin" subtitle="Admin List" subtitleLink="/admin" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Add New Admin</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12}>
                      <div className="mb-3">
                        <FormLabel>
                          Admin Name <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="text"
                          {...register('name')}
                          placeholder="Enter admin name"
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      <div className="mb-3">
                        <FormLabel>
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

                      <div className="mb-3">
                        <FormLabel>
                          Password <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="password"
                          {...register('password')}
                          placeholder="Enter password"
                          isInvalid={!!errors.password}
                        />
                        <Form.Text className="text-muted">
                          At least 8 characters, include uppercase, lowercase, number & special character
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.password?.message as string}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={formState.isSubmitting} size="lg">
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
  return <AddAdminPage />
}

export default Page