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

interface SubcategoryData {
  id: string;
  name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const SubcategoryUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    document.title = `${appTitle}Update Subcategory`;
  }, []);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Subcategory Name is required'),
    category_id: Yup.string().required('Category is required'),
  });

  const { register, handleSubmit, formState, setValue, watch } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      category_id: '',
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
    const getSubcategoryId = () => {
      if (params?.id) return params.id as string;
      if (typeof window !== 'undefined') {
        const segments = window.location.pathname.split('/');
        const idFromUrl = segments[segments.length - 1];
        if (idFromUrl && idFromUrl !== 'subcategory' && idFromUrl !== 'update') return idFromUrl;
      }
      return null;
    };
    setSubcategoryId(getSubcategoryId());
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

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories', token!, handleTokenExpired);
      
      if (Array.isArray(res)) {
        setCategories(res);
      } else if (res.status && res.data) {
        setCategories(res.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        addToast('Failed to load categories - unexpected format', { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      addToast('Failed to load categories', { toastClass: 'bg-danger', delay: 3000 });
    }
  };

  const fetchSubcategory = async (id: string) => {
    try {
      setLoading(true);

      await fetchCategories();

      const res = await apiClient.get(`/subcategories`, token!, handleTokenExpired);

      let allSubcategories: any[] = [];
      
      if (res.status && Array.isArray(res.data)) {
        allSubcategories = res.data;
      } else if (Array.isArray(res)) {
        allSubcategories = res;
      } else if (Array.isArray(res.data)) {
        allSubcategories = res.data;
      } else {
        addToast('Failed to fetch subcategory data - unexpected format', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }

      const subcategoryData = allSubcategories.find((sub: any) => sub.id === id);
      
      if (!subcategoryData) {
        addToast('Subcategory not found. Please check the ID.', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }

      setValue('name', subcategoryData.name || '');
      setValue('category_id', subcategoryData.category_id || '');
      setSelectedCategoryId(subcategoryData.category_id || '');
      
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        return;
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        addToast('Subcategory not found. Please check the ID.', { toastClass: 'bg-danger', delay: 3000 });
      } else {
        addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthChecking && subcategoryId && token) {
      fetchSubcategory(subcategoryId);
    }
  }, [isAuthChecking, subcategoryId, token]);

  const onSubmit = async (values: any) => {
    try {
      if (!subcategoryId) {
        addToast('Subcategory ID not found', { toastClass: 'bg-danger', delay: 3000 });
        return;
      }

      const putData = {
        name: values.name,
        category_id: values.category_id
      };

      const res = await apiClient.put(`/subcategories/${subcategoryId}`, putData, token!, handleTokenExpired);

      if (res.status) {
        addToast(res.message || 'Subcategory updated successfully!', { toastClass: 'bg-success', delay: 3000 });
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Subcategory updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        router.push('/subcategories');
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
          {isAuthChecking ? 'Checking authentication...' : 'Loading subcategory data...'}
        </div>
      </Container>
    );

  if (!subcategoryId)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading subcategory information...
        </div>
      </Container>
    );

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Update Subcategory" subtitle="Subcategories List" subtitleLink="/subcategories" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={8} xl={6}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Update Subcategory</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <FormLabel>Subcategory Name <span className="text-danger">*</span></FormLabel>
                    <FormControl 
                      type="text" 
                      {...register('name')} 
                      placeholder="Enter subcategory name" 
                      isInvalid={!!errors.name} 
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <FormLabel>Select Category <span className="text-danger">*</span></FormLabel>
                    <Form.Select 
                      {...register('category_id')}
                      isInvalid={!!errors.category_id}
                      value={watch('category_id')}
                      onChange={(e) => setValue('category_id', e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.category_id?.message}
                    </Form.Control.Feedback>
                    {categories.length === 0 && !loading && (
                      <Form.Text className="text-danger">
                        No categories available. Please add categories first.
                      </Form.Text>
                    )}
                  </Form.Group>

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={isSubmitting || categories.length === 0} size="lg">
                      {isSubmitting ? 'Updating Subcategory...' : 'Update Subcategory'}
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

export default SubcategoryUpdatePage;