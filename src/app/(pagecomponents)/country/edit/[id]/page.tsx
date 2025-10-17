'use client';

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

let isShowingSessionAlert = false;

class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  }
  
  private async handleResponse(response: Response, onTokenExpired: () => Promise<void>) {
    if (response.status === 401) {
      await onTokenExpired();
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
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

interface CountryData {
  id: string;
  country_name: string;
  currency_code: string;
  conversion_rate: number;
}

const CountryUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [countryId, setCountryId] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${appTitle}Update Country`;
  }, []);

  const validationSchema = Yup.object().shape({
    country_name: Yup.string().required('Country Name is required'),
    currency_code: Yup.string().required('Currency Code is required'),
    conversion_rate: Yup.number()
      .required('Conversion Rate is required')
      .positive('Conversion Rate must be positive')
      .typeError('Conversion Rate must be a number'),
  });

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      country_name: '',
      currency_code: '',
      conversion_rate: '',
    },
  });

  const { errors, isSubmitting } = formState;

  const handleTokenExpired = async () => {
    if (!isShowingSessionAlert) {
      isShowingSessionAlert = true;
      
      await Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please login again.',
        confirmButtonText: 'OK',
        allowOutsideClick: false,
      });
      
      setTimeout(() => {
        isShowingSessionAlert = false;
      }, 1000);
    }
    
    dispatch(clearToken());
    localStorage.removeItem('user');
    router.push('/login');
  };

  useEffect(() => {
    const getCountryId = () => {
      if (params?.id) return params.id as string;
      if (typeof window !== 'undefined') {
        const segments = window.location.pathname.split('/');
        const idFromUrl = segments[segments.length - 1];
        if (idFromUrl && idFromUrl !== 'country' && idFromUrl !== 'update') return idFromUrl;
      }
      return null;
    };
    setCountryId(getCountryId());
  }, [params]);

  useEffect(() => {
    const checkAuth = () => {
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
          }
        } catch {}
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, [dispatch, token]);

  const fetchCountry = async (id: string) => {
    try {
      setLoading(true);

      const res = await apiClient.get(`/country/${id}`, token!, handleTokenExpired);

      if (res.status && res.data) {
        const data: CountryData = res.data;
        
        reset({
          country_name: data.country_name || '',
          currency_code: data.currency_code || '',
          conversion_rate: data.conversion_rate || '',
        });

      } else {
        addToast(res.message || 'Failed to fetch country data.', { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        return;
      }
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthChecking && countryId && token) {
      fetchCountry(countryId);
    }
  }, [isAuthChecking, countryId, token]);

  const onSubmit = async (values: any) => {
    try {
      if (!countryId) {
        addToast('Country ID not found', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }

      const putData = {
        country_name: values.country_name,
        currency_code: values.currency_code.toUpperCase(),
        conversion_rate: parseFloat(values.conversion_rate),
      };

      const res = await apiClient.put(`/country/${countryId}`, putData, token!, handleTokenExpired);

      if (res.status) {
        addToast(res.message || 'Country updated successfully!', { toastClass: 'bg-success', delay: 3000 });
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Country updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        router.push('/country');
      } else {
        addToast(res.message || 'Update failed.', { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        return;
      }
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    }
  };

  if (isAuthChecking || loading)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          {isAuthChecking ? 'Checking authentication...' : 'Loading country data...'}
        </div>
      </Container>
    );

  if (!countryId)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading country information...
        </div>
      </Container>
    );

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Update Country" subtitle="Country List" subtitleLink="/country" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={8} xl={6}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Update Country</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <FormLabel>Country Name <span className="text-danger">*</span></FormLabel>
                    <FormControl 
                      type="text" 
                      {...register('country_name')} 
                      placeholder="Enter country name" 
                      isInvalid={!!errors.country_name} 
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.country_name?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <FormLabel>Currency Code <span className="text-danger">*</span></FormLabel>
                    <FormControl 
                      type="text" 
                      {...register('currency_code')} 
                      placeholder="e.g., USD, EUR, INR" 
                      isInvalid={!!errors.currency_code} 
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.currency_code?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <FormLabel>Conversion Rate <span className="text-danger">*</span></FormLabel>
                    <FormControl 
                      type="number" 
                      step="0.01"
                      {...register('conversion_rate')} 
                      placeholder="Enter conversion rate" 
                      isInvalid={!!errors.conversion_rate} 
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.conversion_rate?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                      {isSubmitting ? 'Updating Country...' : 'Update Country'}
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

export default CountryUpdatePage;