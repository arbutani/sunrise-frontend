'use client'

import { useToasts } from "@/components/helper/useToasts";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useRouter, useParams } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, FormControl, FormLabel, Row, Spinner } from "react-bootstrap";
import * as Yup from 'yup';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HandleError } from "@/lib/helper";
import Toaster from "@/components/helper/toaster";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setToken, clearToken } from '@/store/authSlice';
import { appTitle } from '@/helpers';
import { jwtDecode } from 'jwt-decode';

const ReactSwal = withReactContent(Swal);

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

  // सिर्फ name field का validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required')
  });

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: ''
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
        } catch (error) {}
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

      // API endpoint change किया है
      const response = await fetch(`${API_URL}/categories/${id}`, {
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
        
        // सिर्फ name set कर रहे हैं
        reset({
          name: data.name || ''
        });
        
      } else {
        addToast(res.message || 'Failed to fetch data.', { toastClass: 'bg-danger', delay: 3000 });
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
        addToast('ID not found', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }
      
      if (!token || !validateToken(token)) {
        await handleTokenExpired();
        return;
      }

      // सिर्फ name data भेज रहे हैं
      const putData = {
        name: values.name
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // API endpoint change किया है
      const response = await fetch(`${API_URL}/categories/${employeeId}`, {
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
          text: 'Updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        router.push('/categories');
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
          Loading information...
        </div>
      </Container>
    );

  if (loading)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading data...
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
                    <Col xs={12}>
                      <div className="mb-3">
                        <FormLabel>Name <span className="text-danger">*</span></FormLabel>
                        <FormControl
                          type="text"
                          {...register('name')}
                          placeholder="Enter name"
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name?.message as string}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                      {isSubmitting ? 'Updating...' : 'Update'}
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
    <EmployeeUpdatePage />
  );
};

export default Page;