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

interface CountryFormData {
  country_name: string;
  currency_code: string;
  conversion_rate: number;
}

const AddCountryPage = () => {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToasts()
  const dispatch = useDispatch()
  const token = useSelector((state: RootState) => state.auth.token)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    document.title = `${appTitle} - Add Country`
  }, [])

  const validationSchema = Yup.object().shape({
    country_name: Yup.string().required('Country Name is required'),
    currency_code: Yup.string()
      .required('Currency Code is required')
      .length(3, 'Currency Code must be exactly 3 characters'),
    conversion_rate: Yup.number()
      .required('Conversion Rate is required')
      .positive('Conversion Rate must be positive')
      .typeError('Conversion Rate must be a number'),
  })

  const { register, handleSubmit, formState, reset } = useForm<CountryFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      country_name: '',
      currency_code: '',
      conversion_rate: 0,
    },
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

  const onSubmit = async (values: CountryFormData) => {
    try {
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      const payload = {
        country_name: values.country_name,
        currency_code: values.currency_code.toUpperCase(),
        conversion_rate: parseFloat(values.conversion_rate.toString()),
      }

      const res = await apiClient.post('/country', payload, token, handleTokenExpired)

      if (res.status === true) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 })
        reset()
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Country added successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        })
        router.push('/country')
      } else {
        addToast(res.message || 'Error creating country', { toastClass: 'bg-danger', delay: 3000 })
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
        <PageBreadcrumb title="Add Country" subtitle="Country List" subtitleLink="/country" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Add New Country</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12}>
                      <div className="mb-4">
                        <FormLabel>
                          Country Name <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="text"
                          {...register('country_name')}
                          placeholder="Enter country name"
                          isInvalid={!!errors.country_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.country_name?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      <div className="mb-4">
                        <FormLabel>
                          Currency Code <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="text"
                          {...register('currency_code')}
                          placeholder="Enter currency code (e.g., USD, EUR)"
                          isInvalid={!!errors.currency_code}
                          maxLength={3}
                          style={{ textTransform: 'uppercase' }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.currency_code?.message as string}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Must be exactly 3 characters (e.g., USD, EUR, GBP)
                        </Form.Text>
                      </div>

                      <div className="mb-4">
                        <FormLabel>
                          Conversion Rate <span className="text-danger">*</span>
                        </FormLabel>
                        <FormControl
                          type="number"
                          step="0.01"
                          {...register('conversion_rate')}
                          placeholder="Enter conversion rate"
                          isInvalid={!!errors.conversion_rate}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.conversion_rate?.message as string}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Conversion rate relative to base currency
                        </Form.Text>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mt-4">
                    <Button 
                      type="submit" 
                      disabled={formState.isSubmitting} 
                      className="flex-fill"
                    >
                      {formState.isSubmitting ? 'Creating Country...' : 'Create Country'}
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
  return <AddCountryPage />
}

export default Page