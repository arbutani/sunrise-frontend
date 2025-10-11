'use client'

import { useEffect, Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { Container, Card, Form, FormLabel, FormControl, Button, Row, Col, Spinner } from 'react-bootstrap'
import Select from 'react-select'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useToasts } from '@/components/helper/useToasts'
import Toaster from '@/components/helper/toaster'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setToken, clearToken } from '@/store/authSlice'
import { appTitle } from '@/helpers'
import { jwtDecode } from 'jwt-decode'

const ReactSwal = withReactContent(Swal)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  } catch (error) {
    return false
  }
}

const EmployeePage = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { toasts, addToast, removeToast } = useToasts()
  const token = useSelector((state: RootState) => state.auth.token)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    document.title = `${appTitle}Add Employee`
  }, [])

  const employeeTypes = [
    { label: 'Store Manager', value: 'Store Manager' },
    { label: 'Delivery Driver', value: 'Delivery Driver' },
    { label: 'Store Suppervisor', value: 'Store Suppervisor' },
  ]

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
    type: Yup.string().required('Employee Type is required'),
    monthly_salary: Yup.number()
      .typeError('Monthly Salary must be a number')
      .positive('Monthly Salary must be positive')
      .required('Monthly Salary is required'),
    working_days: Yup.number()
      .typeError('Working Days must be a number')
      .positive('Working Days must be positive')
      .max(31, 'Working Days cannot exceed 31')
      .required('Working Days is required'),
    working_hour: Yup.number()
      .typeError('Working Hour must be a number')
      .positive('Working Hour must be positive')
      .max(24, 'Working Hour cannot exceed 24')
      .required('Working Hour is required'),
  })

  const { register, handleSubmit, control, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
  })
  const { errors } = formState

  const handleTokenExpired = async () => {
    await Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      confirmButtonText: 'Login',
      allowOutsideClick: false,
    })
    
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
        const parsed = JSON.parse(stored)
        if (parsed.token && validateToken(parsed.token)) {
          dispatch(setToken(parsed.token))
          setIsAuthChecking(false)
          return
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
        type: values.type,
        salary: {
          monthly_salary: values.monthly_salary,
          working_days: values.working_days,
          working_hour: values.working_hour,
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/employee-management`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        await handleTokenExpired()
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const res = await response.json()

      if (res.status === true) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 })
        reset()
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Employee added successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        })
        router.push('/employee')
      } else {
        addToast(res.message || 'Error creating employee', { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('401')) {
        await handleTokenExpired()
      } else {
        console.error('Error creating employee:', err)
        addToast(err?.message || 'Something went wrong', { 
          toastClass: 'bg-danger', 
          delay: 3000 
        })
      }
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
        <PageBreadcrumb title="Add Employee" subtitle="Employee List" subtitleLink="/employee" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Add New Employee</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12} md={6}>
                      {/* Employee Name */}
                      <div className="mb-3">
                        <FormLabel>Employee Name <span className="text-danger">*</span></FormLabel>
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
                      <div className="mb-3">
                        <FormLabel>Email Address <span className="text-danger">*</span></FormLabel>
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
                      <div className="mb-3">
                        <FormLabel>Password <span className="text-danger">*</span></FormLabel>
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

                      {/* Employee Type */}
                      <div className="mb-3">
                        <FormLabel>Employee Type <span className="text-danger">*</span></FormLabel>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={employeeTypes}
                              value={employeeTypes.find(opt => opt.value === field.value) || null}
                              onChange={option => field.onChange(option?.value)}
                              placeholder="Select Employee Type"
                              isInvalid={!!errors.type}
                            />
                          )}
                        />
                        {errors.type && <p className="text-danger mt-1 mb-0">{errors.type.message as string}</p>}
                      </div>
                    </Col>

                    <Col xs={12} md={6}>
                      {/* Salary Fields */}
                      <div className="mb-3">
                        <FormLabel>Monthly Salary <span className="text-danger">*</span></FormLabel>
                        <FormControl
                          type="number"
                          {...register('monthly_salary')}
                          placeholder="Enter monthly salary"
                          isInvalid={!!errors.monthly_salary}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.monthly_salary?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      <div className="mb-3">
                        <FormLabel>Working Days per Month <span className="text-danger">*</span></FormLabel>
                        <FormControl
                          type="number"
                          {...register('working_days')}
                          placeholder="Enter working days"
                          min="1"
                          max="31"
                          isInvalid={!!errors.working_days}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.working_days?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      <div className="mb-3">
                        <FormLabel>Working Hours per Day <span className="text-danger">*</span></FormLabel>
                        <FormControl
                          type="number"
                          {...register('working_hour')}
                          placeholder="Enter working hours"
                          min="1"
                          max="24"
                          isInvalid={!!errors.working_hour}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.working_hour?.message as string}
                        </Form.Control.Feedback>
                      </div>

                      {/* Optional Note */}
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>Note:</h6>
                          <p className="mb-0 text-muted">
                            Salary information is required for all employees. Make sure to enter accurate salary details.
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={formState.isSubmitting} size="lg">
                      {formState.isSubmitting ? 'Creating Employee...' : 'Create Employee'}
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

export default EmployeePage
