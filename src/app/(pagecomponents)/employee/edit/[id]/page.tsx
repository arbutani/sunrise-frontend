'use client';

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
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';

const ReactSwal = withReactContent(Swal);

const dropdownStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: '#fff',
    borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
    minHeight: '38px',
    boxShadow: 'none',
    '&:hover': { borderColor: '#86b7fe' },
  }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#0d6efd'
      : state.isFocused
      ? '#e7f1ff'
      : '#fff',
    color: state.isSelected ? '#fff' : '#212529',
    cursor: 'pointer',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#0d6efd',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#6c757d',
  }),
}

// Admin removed from employee types
const employeeTypes = [
  { label: 'Store Manager', value: 'Store Manager' },
  { label: 'Delivery Driver', value: 'Delivery Driver' },
  { label: 'Store Supervisor', value: 'Store Supervisor' },
];

const EmployeeUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id;
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Employee name is required'),
    email_address: Yup.string().required('E-Mail address is required'),
    password: Yup.string().optional(),
    type: Yup.string().required('Employee type is required'),
    // Add salary fields to main validation schema
    monthly_salary: Yup.number()
      .typeError('Monthly salary must be a number')
      .min(0, 'Monthly salary cannot be negative')
      .nullable()
      .optional(),
    working_days: Yup.number()
      .typeError('Working days must be a number')
      .min(0, 'Working days cannot be negative')
      .max(31, 'Working days cannot exceed 31')
      .nullable()
      .optional(),
    working_hour: Yup.number()
      .typeError('Working hours must be a number')
      .min(0, 'Working hours cannot be negative')
      .max(24, 'Working hours cannot exceed 24')
      .nullable()
      .optional(),
  });

  const formOptions = { resolver: yupResolver(validationSchema) };
  const { register, handleSubmit, formState, setValue, reset, control } = useForm(formOptions);
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee(employeeId as string);
    }
  }, [employeeId]);

  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
    
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
          return headers;
        }
      } catch (error) {
        // Ignore error
      }
    }
    
    return headers;
  }

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const headers = getAuthHeaders();

      const response = await fetch(`${API_URL}/employe-managment/${id}`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        addToast('Session expired. Please login again.', { toastClass: 'bg-danger', delay: 3000 });
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();

      if (res.status) {
        const data = res.data;
        
        setValue('name', data.name || "");
        setValue('email_address', data.email_address || "");
        setValue('type', data.type || "");
        
        // Set salary values if they exist
        if (data.salary) {
          setValue('monthly_salary', data.salary.monthly_salary || "");
          setValue('working_days', data.salary.working_days || "");
          setValue('working_hour', data.salary.working_hour || "");
        }
      } else {
        const message = Array.isArray(res.message) ? 'All Fields are required.' : res.message;
        addToast(message, { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (formField: any) => {
    try {
      const putData: any = {
        name: formField.name,
        email_address: formField.email_address,
        type: formField.type,
      };

      if (formField.password && formField.password.trim() !== '') {
        putData.password = formField.password;
      }

      // Add salary data only if at least one field is provided
      const hasSalaryData = formField.monthly_salary || formField.working_days || formField.working_hour;
      
      if (hasSalaryData) {
        putData.salary = {};
        
        if (formField.monthly_salary) {
          putData.salary.monthly_salary = Number(formField.monthly_salary);
        }
        if (formField.working_days) {
          putData.salary.working_days = Number(formField.working_days);
        }
        if (formField.working_hour) {
          putData.salary.working_hour = Number(formField.working_hour);
        }
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const headers = getAuthHeaders();

      const response = await fetch(`${API_URL}/employe-managment/${employeeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putData),
      });

      if (response.status === 401) {
        addToast('Session expired. Please login again.', { toastClass: 'bg-danger', delay: 3000 });
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();

      if (res.status) {
        addToast(res.message, { toastClass: 'bg-success', delay: 3000 });
        reset();
        const result = await ReactSwal.fire({
          title: 'Success!',
          text: 'Employee updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        if (result.isConfirmed) router.push('/employee');
      } else {
        if (Array.isArray(res.message)) {
          res.message.forEach((error: any) => {
            addToast(`${error.field}: ${error.message}`, { toastClass: 'bg-danger', delay: 3000 });
          });
        } else {
          addToast(res.message, { toastClass: 'bg-danger', delay: 3000 });
        }
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    }
  }

  if (!employeeId) {
    return <div className="text-center py-5">Invalid Employee</div>;
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="me-2" />
        Loading employee data...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Fragment>
        <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
        <Container fluid>
          <PageBreadcrumb title="Employee Update" subtitle="Employee Update" />
        </Container>
        <Container fluid>
          <Row className="justify-content-center mt-3">
            <Col sm={6}>
              <Card>
                <Card.Header>
                  <Card.Title as="h5">Employee Update</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit(onSubmit)} style={{ zIndex: 5 }}>
                    <div className="mb-3 form-group">
                      <FormLabel>Employee Name <span className="text-danger">*</span></FormLabel>
                      <FormControl 
                        type="text" 
                        {...register('name')}
                        placeholder="Name" 
                        required 
                      />
                      {errors.name && <p className="text-danger">{errors.name.message}</p>}
                    </div>

                    <div className="mb-3 form-group">
                      <FormLabel>Email Address <span className="text-danger">*</span></FormLabel>
                      <FormControl 
                        type="email" 
                        {...register('email_address')} 
                        placeholder="you@example.com" 
                        required 
                      />
                      {errors.email_address && <p className="text-danger">{errors.email_address.message}</p>}
                    </div>

                    <div className="mb-3 form-group">
                      <FormLabel>Password</FormLabel>
                      <FormControl 
                        type="password" 
                        {...register('password')} 
                        placeholder="Leave blank to keep current password" 
                      />
                      <Form.Text className="text-muted">
                        Leave blank if you don't want to change the password
                      </Form.Text>
                      {errors.password && <p className="text-danger">{errors.password.message}</p>}
                    </div>

                    <div className="mb-3 form-group">
                      <FormLabel>Employee Type <span className="text-danger">*</span></FormLabel>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => {
                          const selected = employeeTypes.find(et => et.value === field.value) || null;
                          return (
                            <Select
                              {...field}
                              options={employeeTypes}
                              value={selected}
                              onChange={opt => field.onChange(opt?.value)}
                              placeholder="Select Employee Type"
                              styles={dropdownStyles}
                            />
                          );
                        }}
                      />
                      {errors.type && <p className="text-danger mt-1">{errors.type.message}</p>}
                    </div>

                    {/* Salary Fields */}
                    <div className="mb-3 form-group">
                      <FormLabel>Monthly Salary</FormLabel>
                      <FormControl 
                        type="number" 
                        {...register('monthly_salary')}
                        placeholder="Enter monthly salary" 
                        min="0"
                        step="0.01"
                      />
                      {errors.monthly_salary && <p className="text-danger">{errors.monthly_salary.message}</p>}
                    </div>

                    <div className="mb-3 form-group">
                      <FormLabel>Working Days (per month)</FormLabel>
                      <FormControl 
                        type="number" 
                        {...register('working_days')}
                        placeholder="Enter working days" 
                        min="0"
                        max="31"
                      />
                      {errors.working_days && <p className="text-danger">{errors.working_days.message}</p>}
                    </div>

                    <div className="mb-3 form-group">
                      <FormLabel>Working Hours (per day)</FormLabel>
                      <FormControl 
                        type="number" 
                        {...register('working_hour')}
                        placeholder="Enter working hours" 
                        min="0"
                        max="24"
                      />
                      {errors.working_hour && <p className="text-danger">{errors.working_hour.message}</p>}
                    </div>

                    <div className="d-grid mt-3">
                      <Button type="submit" disabled={isSubmitting} className="btn-primary fw-semibold py-2">
                        {isSubmitting ? 'Updating...' : 'Update Employee'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Fragment>
    </ProtectedRoute>
  )
}

export default EmployeeUpdatePage;