'use client';

import { useToasts } from "@/components/helper/useToasts";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useRouter, useParams } from "next/navigation";
import React, { Fragment, useEffect } from "react";
import { Button, Card, Col, Container, Form, FormControl, FormLabel, Row, Spinner } from "react-bootstrap";
import * as Yup from 'yup';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HandleError } from "@/lib/helper";
import { get, put } from "@/lib/requests";
import Toaster from "@/components/helper/toaster";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Select from 'react-select';

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

const employeeTypes = [
  { label: 'admin', value: 'admin' },
  { label: 'Store Manager', value: 'Store Manager' },
  { label: 'Delivery Driver', value: 'Delivery Driver' },
  { label: 'Store Supervisor', value: 'Store Supervisor' },
];

const EmployeeUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id;

  const validationSchema = Yup.object().shape({
    employee_name: Yup.string().required('Employee name is required'),
    email_address: Yup.string().required('E-Mail address is required'),
    password: Yup.string().optional(),
    employee_type: Yup.string().required('Employee type is required'),
  });

  const formOptions = { resolver: yupResolver(validationSchema) };
  const { register, handleSubmit, formState, setValue, reset, control } = useForm(formOptions);
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee(employeeId as string);
    }
  }, [employeeId]);

  const fetchEmployee = async (id: string) => {
    try {
      const res = await get('/employe-managment/' + id, true);
      if (res.data.status) {
        const data = res.data.data;
        setValue('employee_name', data.employee_name ?? "");
        setValue('email_address', data.email_address ?? "");
        setValue('employee_type', data.employee_type ?? "");
      } else {
        const message = Array.isArray(res.data.message) ? 'All Fields are required.' : res.data.message;
        addToast(message, { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    }
  }

  const onSubmit = async (formField: any) => {
    try {
      const putData = {
        employee_name: formField.employee_name,
        email_address: formField.email_address,
        password: formField.password,
        employee_type: formField.employee_type,
      };

      const res = await put('/employe-managment/' + employeeId, putData, true);
      if (res.data.status) {
        addToast(res.data.message, { toastClass: 'bg-success', delay: 3000 });
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
        const message = Array.isArray(res.data.message) ? 'All Fields are required.' : res.data.message;
        addToast(message, { toastClass: 'bg-danger', delay: 3000 });
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 });
    }
  }

  if (!employeeId) {
    return <div className="text-center py-5">Invalid Employee</div>;
  }

  return (
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
                    <FormControl type="text" {...register('employee_name')} placeholder="Name" required />
                    {errors.employee_name && <p className="text-danger">{errors.employee_name.message}</p>}
                  </div>

                  <div className="mb-3 form-group">
                    <FormLabel>Email Address <span className="text-danger">*</span></FormLabel>
                    <FormControl type="email" {...register('email_address')} placeholder="you@example.com" required />
                    {errors.email_address && <p className="text-danger">{errors.email_address.message}</p>}
                  </div>

                  <div className="mb-3 form-group">
                    <FormLabel>Password</FormLabel>
                    <FormControl type="password" {...register('password')} placeholder="••••••••" />
                    {errors.password && <p className="text-danger">{errors.password.message}</p>}
                  </div>

                  <div className="mb-3 form-group">
                    <FormLabel>Employee Type <span className="text-danger">*</span></FormLabel>
                    <Controller
                      name="employee_type"
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
                    {errors.employee_type && <p className="text-danger mt-1">{errors.employee_type.message}</p>}
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
  )
}

export default EmployeeUpdatePage;
