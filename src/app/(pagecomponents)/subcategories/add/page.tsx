'use client'

import { useEffect, Fragment, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { Container, Card, Form, FormLabel, FormControl, Button, Row, Col, Spinner, InputGroup } from 'react-bootstrap'
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

interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Subcategory {
  name: string;
}

interface CategoryFormData {
  subcategories: Subcategory[];
}

const AddCategoryPage = () => {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToasts()
  const dispatch = useDispatch()
  const token = useSelector((state: RootState) => state.auth.token)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  const addToastRef = useRef(addToast)

  useEffect(() => {
    addToastRef.current = addToast
  }, [addToast])

  useEffect(() => {
    document.title = `${appTitle} - Add Subcategory`
  }, [])

  const validationSchema = Yup.object().shape({
    subcategories: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Subcategory name is required'),
      })
    ).min(1, 'At least one subcategory is required'),
  })

  const { register, handleSubmit, formState, control, reset } = useForm<CategoryFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      subcategories: [{ name: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subcategories',
  })

  const { errors } = formState

  const handleTokenExpired = useCallback(async () => {
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
  }, [dispatch, router])

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
        } catch {
          // Silent catch for production
        }
      }

      await handleTokenExpired()
    }

    checkAuth()
  }, [dispatch, token, handleTokenExpired])

  useEffect(() => {
    let isMounted = true

    const fetchCategories = async () => {
      if (!token || !validateToken(token)) return;
      
      setIsLoadingCategories(true);
      try {
        const response = await apiClient.get('/categories', token, handleTokenExpired);
        
        if (!isMounted) return;

        let categoriesData: Category[] = [];
        
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else {
          addToastRef.current('Failed to load categories - unexpected format', { toastClass: 'bg-danger', delay: 3000 });
          return;
        }

        setCategories(categoriesData);
        
      } catch (error: any) {
        if (!isMounted) return;
        
        if (error.message.includes('Session expired')) {
          return;
        }
        addToastRef.current('Failed to load categories', { toastClass: 'bg-danger', delay: 3000 });
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    if (!isAuthChecking && token) {
      fetchCategories();
    }

    return () => {
      isMounted = false
    }
  }, [isAuthChecking, token, handleTokenExpired])

  const addSubcategory = () => {
    append({ name: '' })
  }

  const removeSubcategory = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const onSubmit = async (values: CategoryFormData) => {
    try {
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      if (!selectedCategoryId.trim()) {
        addToast('Please select a category', { toastClass: 'bg-danger', delay: 3000 })
        return
      }

      const validSubcategories = values.subcategories.filter(sub => sub.name.trim() !== '')

      if (validSubcategories.length === 0) {
        addToast('Please enter at least one subcategory name', { toastClass: 'bg-danger', delay: 3000 })
        return
      }

      const subcategoryPromises = validSubcategories.map(subcategory => 
        apiClient.post('/subcategories', {
          category_id: selectedCategoryId.trim(),
          name: subcategory.name,
        }, token, handleTokenExpired)
      );

      const results = await Promise.allSettled(subcategoryPromises);
      
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          if ((response.status === true) || (response && response.id)) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      });

      if (successCount > 0) {
        if (errorCount === 0) {
          addToast(`All ${successCount} subcategories created successfully!`, { 
            toastClass: 'bg-success', 
            delay: 5000 
          });
        } else {
          addToast(`${successCount} subcategories created successfully, ${errorCount} failed`, { 
            toastClass: 'bg-warning', 
            delay: 5000 
          });
        }

        reset();
        setSelectedCategoryId('');
        
        await ReactSwal.fire({
          title: errorCount === 0 ? 'Success!' : 'Partial Success',
          text: errorCount === 0 
            ? `All ${successCount} subcategories added successfully!` 
            : `${successCount} out of ${validSubcategories.length} subcategories added successfully`,
          icon: errorCount === 0 ? 'success' : 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        
        router.push('/subcategories');
      } else {
        addToast('Failed to create any subcategories', { 
          toastClass: 'bg-danger', 
          delay: 3000 
        });
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
        <PageBreadcrumb title="Add Subcategory" subtitle="SubCategories List" subtitleLink="/subcategories" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Add New Subcategory</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col xs={12}>
                      {/* Category Dropdown */}
                      <div className="mb-4">
                        <FormLabel>
                          Select Category <span className="text-danger">*</span>
                        </FormLabel>
                        <Form.Select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          isInvalid={!selectedCategoryId.trim() && formState.isSubmitted}
                          disabled={isLoadingCategories}
                        >
                          <option value="">{isLoadingCategories ? 'Loading categories...' : 'Select a category'}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          Please select a category
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Select the category where you want to add subcategories
                        </Form.Text>
                        {isLoadingCategories && (
                          <div className="mt-2">
                            <Spinner animation="border" size="sm" className="me-2" />
                            <small className="text-muted">Loading categories...</small>
                          </div>
                        )}
                      </div>

                      {/* Subcategories Section */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <FormLabel className="mb-0">
                            Subcategories <span className="text-danger">*</span>
                          </FormLabel>
                          <Button 
                            type="button" 
                            variant="primary" 
                            size="sm"
                            onClick={addSubcategory}
                          >
                            + Add More
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div key={field.id} className="subcategory-item">
                              <InputGroup>
                                <FormControl
                                  type="text"
                                  placeholder={`Enter subcategory name ${index + 1}`}
                                  {...register(`subcategories.${index}.name` as const)}
                                  isInvalid={!!errors.subcategories?.[index]?.name}
                                />
                                <Button
                                  variant="outline-danger"
                                  onClick={() => removeSubcategory(index)}
                                  disabled={formState.isSubmitting || fields.length === 1}
                                >
                                  Remove
                                </Button>
                                <Form.Control.Feedback type="invalid">
                                  {errors.subcategories?.[index]?.name?.message}
                                </Form.Control.Feedback>
                              </InputGroup>
                            </div>
                          ))}
                        </div>
                        
                        {errors.subcategories && typeof errors.subcategories === 'object' && !Array.isArray(errors.subcategories) && (
                          <Form.Text className="text-danger">
                            {errors.subcategories.message}
                          </Form.Text>
                        )}
                        
                        <Form.Text className="text-muted">
                          Add one or multiple subcategories. All will be added to the same category. Empty subcategories will be ignored.
                        </Form.Text>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mt-4">
                    <Button 
                      type="button" 
                      variant="outline-secondary" 
                      onClick={() => router.push('/categories')}
                      disabled={formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={formState.isSubmitting || !selectedCategoryId.trim()} 
                      className="flex-fill"
                    >
                      {formState.isSubmitting 
                        ? 'Creating Subcategories...' 
                        : `Create ${fields.length > 1 ? fields.length + ' Subcategories' : 'Subcategory'}`
                      }
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
  return <AddCategoryPage />
}

export default Page