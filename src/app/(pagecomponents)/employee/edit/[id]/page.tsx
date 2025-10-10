'use client'

import { useToasts } from "@/components/helper/useToasts";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useRouter, useParams } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, FormControl, FormLabel, Row, Spinner } from "react-bootstrap";
import * as Yup from 'yup';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HandleError } from "@/lib/helper";
import Toaster from "@/components/helper/toaster";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Select from 'react-select';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setToken, clearToken } from '@/store/authSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import { appTitle } from '@/helpers';
import { jwtDecode } from 'jwt-decode';

const ReactSwal = withReactContent(Swal);

const employeeTypes = [
  { label: 'Store Manager', value: 'Store Manager' },
  { label: 'Delivery Driver', value: 'Delivery Driver' },
  { label: 'Store Supervisor', value: 'Store Suppervisor' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const EmployeeUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${appTitle}Update Employee`;
  }, []);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Employee Name is required'),
    email_address: Yup.string().email('Invalid email format').required('Email Address is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .optional(),
    type: Yup.string().required('Employee Type is required'),
    monthly_salary: Yup.number()
      .typeError('Monthly Salary must be a number')
      .positive('Monthly Salary must be positive')
      .optional(),
    working_days: Yup.number()
      .typeError('Working Days must be a number')
      .positive('Working Days must be positive')
      .max(31, 'Working Days cannot exceed 31')
      .optional(),
    working_hour: Yup.number()
      .typeError('Working Hour must be a number')
      .positive('Working Hour must be positive')
      .max(24, 'Working Hour cannot exceed 24')
      .optional(),
  });

  const { register, handleSubmit, control, formState, setValue, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      email_address: '',
      password: '',
      type: '',
      monthly_salary: '',
      working_days: '',
      working_hour: ''
    }
  });
  const { errors, isSubmitting } = formState;

  const handleTokenExpired = async () => {
    await Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      confirmButtonText: 'Login',
      allowOutsideClick: false,
    });
    
    dispatch(clearToken());
    localStorage.removeItem('user');
    router.push('/login');
  };

  useEffect(() => {
    const getEmployeeId = () => {
      if (params?.id) {
        return params.id as string;
      }
      
      if (typeof window !== 'undefined') {
        const pathSegments = window.location.pathname.split('/');
        const idFromUrl = pathSegments[pathSegments.length - 1];
        if (idFromUrl && idFromUrl !== 'employee' && idFromUrl !== 'update') {
          return idFromUrl;
        }
      }
      
      return null;
    };

    const id = getEmployeeId();
    setEmployeeId(id);
  }, [params]);

  useEffect(() => {
    const checkAuth = async () => {
      if (token && validateToken(token)) {
        setIsAuthChecking(false);
        return;
      }

      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.token && validateToken(parsed.token)) {
            dispatch(setToken(parsed.token));
            setIsAuthChecking(false);
            return;
          }
        } catch (error) {
          // Silent error handling for production
        }
      }

      await handleTokenExpired();
    };

    checkAuth();
  }, []);

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);

      if (!token || !validateToken(token)) {
        await handleTokenExpired();
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_URL}/employe-managment/${id}`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        await handleTokenExpired();
        return;
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const res = await response.json();

      if (res.status && res.data) {
        const data = res.data;
        
        const formData: any = {
          name: data.name || '',
          email_address: data.email_address || '',
          password: '',
          type: data.type || '',
          monthly_salary: '',
          working_days: '',
          working_hour: ''
        };

        let salary = null;
        if (Array.isArray(data.employee_salaries) && data.employee_salaries.length > 0) {
          salary = data.employee_salaries.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        } else if (data.salary) {
          salary = data.salary;
        }

        if (salary) {
          formData.monthly_salary = salary.monthly_salary?.toString() || '';
          formData.working_days = salary.working_days?.toString() || '';
          formData.working_hour = salary.working_hour?.toString() || '';
        }

        reset(formData);
        
      } else {
        addToast(res.message || 'Failed to fetch employee data.', { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        await handleTokenExpired();
      } else {
        addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthChecking && employeeId) {
      fetchEmployee(employeeId);
    }
  }, [isAuthChecking, employeeId]);

  const onSubmit = async (values: any) => {
    try {
      if (!employeeId) {
        addToast('Employee ID not found', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }
      
      if (!token || !validateToken(token)) {
        await handleTokenExpired();
        return;
      }

      const putData: any = {
        name: values.name,
        email_address: values.email_address,
        type: values.type,
      };

      if (values.password?.trim()) {
        putData.password = values.password;
      }

      if (values.monthly_salary || values.working_days || values.working_hour) {
        putData.salary = {
          monthly_salary: Number(values.monthly_salary || 0),
          working_days: Number(values.working_days || 0),
          working_hour: Number(values.working_hour || 0),
        };
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_URL}/employe-managment/${employeeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putData),
      });

      if (response.status === 401) {
        await handleTokenExpired();
        return;
      }

      const res = await response.json();

      if (res.status) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 });
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Employee updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        router.push('/employee');
      } else {
        addToast(res.message || 'Update failed.', { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        await handleTokenExpired();
      } else {
        addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
      }
    }
  };

  if (isAuthChecking) {
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Checking authentication...
        </div>
      </Container>
    );
  }

  if (!employeeId)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading employee information...
        </div>
      </Container>
    );

  if (loading)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading employee data...
        </div>
      </Container>
    );

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Update Employee" subtitle="Employee List" subtitleLink="/employee" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Update Employee</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12} md={6}>
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

                      <div className="mb-3">
                        <FormLabel>Password</FormLabel>
                        <FormControl
                          type="password"
                          {...register('password')}
                          placeholder="Enter new password (leave blank to keep current)"
                          isInvalid={!!errors.password}
                        />
                        <Form.Text className="text-muted">
                          Leave blank to keep current password. If provided, must be at least 8 characters, include uppercase, lowercase, number & special character
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.password?.message as string}
                        </Form.Control.Feedback>
                      </div>

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
                      <div className="mb-3">
                        <FormLabel>Monthly Salary</FormLabel>
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
                        <FormLabel>Working Days per Month</FormLabel>
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
                        <FormLabel>Working Hours per Day</FormLabel>
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

                      <Card className="bg-light">
                        <Card.Body>
                          <h6>Note:</h6>
                          <p className="mb-0 text-muted">
                            Leave password field blank to keep the current password. Salary information is optional for updates.
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                      {isSubmitting ? 'Updating Employee...' : 'Update Employee'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

const Page = () => {
  return (
    <ProtectedRoute>
      <EmployeeUpdatePage />
    </ProtectedRoute>
  );
};

export default Page;