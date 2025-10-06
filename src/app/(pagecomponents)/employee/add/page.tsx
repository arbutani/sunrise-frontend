'use client'

import { useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { Container, Card, Form, FormLabel, FormControl, Button, Row, Col } from 'react-bootstrap'
import Select from 'react-select'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useToasts } from '@/components/helper/useToasts'
import Toaster from '@/components/helper/toaster'
import post from '@/lib/requests'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const ReactSwal = withReactContent(Swal)

const EmployeePage = () => {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToasts()

  const employeeTypes = [
    { label: 'Admin', value: 'admin' },
    { label: 'Store Manager', value: 'Store Manager' },
    { label: 'Delivery Driver', value: 'Delivery Driver' },
    { label: 'Store Supervisor', value: 'Store Supervisor' },
  ]

  const validationSchema = Yup.object().shape({
    employee_name: Yup.string().required('Employee Name is required'),
    email_address: Yup.string().email('Invalid email format').required('Email Address is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .required('Password is required'),
    employee_type: Yup.string().required('Employee Type is required'),
    salary: Yup.object().shape({
      monthly_salary: Yup.number().min(0, 'Cannot be negative').nullable(),
      working_days: Yup.number().min(0).max(31).nullable(),
      working_hour: Yup.number().min(0).max(24).nullable(),
      over_time: Yup.number().min(0).nullable(),
      leave_day: Yup.number().min(0).nullable(),
    }),
  })

  const { register, handleSubmit, control, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
  })
  const { errors } = formState

  const onSubmit = async (values: any) => {
    try {
      const payload: any = {
        employee_name: values.employee_name,
        email_address: values.email_address,
        password: values.password,
        employee_type: values.employee_type,
      }

      const salaryData: any = {}
      if (values.salary?.monthly_salary) salaryData.monthly_salary = parseFloat(values.salary.monthly_salary)
      if (values.salary?.working_days) salaryData.working_days = parseInt(values.salary.working_days)
      if (values.salary?.working_hour) salaryData.working_hour = parseInt(values.salary.working_hour)
      if (values.salary?.over_time) salaryData.over_time = parseFloat(values.salary.over_time)
      if (values.salary?.leave_day) salaryData.leave_day = parseFloat(values.salary.leave_day)
      if (Object.keys(salaryData).length > 0) payload.salary = salaryData

      const res = await post('/employe-managment', payload, true)
      if (res.data.status === true) {
        addToast(res.data.message, { toastClass: 'bg-success', delay: 3000 })
        reset()
        await ReactSwal.fire({
          title: 'Success!',
          text: 'Employee added successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        })
        router.push('/employee')
      } else {
        addToast(res.data.message || 'Error creating employee', { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (err: any) {
      addToast(err?.message || 'Something went wrong', { toastClass: 'bg-danger', delay: 3000 })
    }
  }

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Add Employee" subtitle="Employee List" />
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
                          {...register('employee_name')}
                          placeholder="Enter employee name"
                          isInvalid={!!errors.employee_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.employee_name?.message as string}
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
                          name="employee_type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={employeeTypes}
                              value={employeeTypes.find(opt => opt.value === field.value) || null}
                              onChange={option => field.onChange(option?.value)}
                              placeholder="Select Employee Type"
                            />
                          )}
                        />
                        {errors.employee_type && <p className="text-danger mt-1 mb-0">{errors.employee_type.message as string}</p>}
                      </div>
                    </Col>

                    <Col xs={12} md={6}>
                      {/* Salary Section */}
                      <Card>
                        <Card.Header>
                          <Card.Title as="h6">Salary Information (Optional)</Card.Title>
                          <small className="text-warning d-block mt-1">
                            Leave blank if not applicable
                          </small>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col sm={6}>
                              <FormLabel>Monthly Salary ($)</FormLabel>
                              <FormControl
                                type="number"
                                step="0.01"
                                {...register('salary.monthly_salary')}
                                placeholder="Leave blank if not applicable"
                                min="0"
                              />
                            </Col>
                            <Col sm={6}>
                              <FormLabel>Working Days</FormLabel>
                              <FormControl
                                type="number"
                                {...register('salary.working_days')}
                                placeholder="Leave blank if not applicable"
                                min="0" max="31"
                              />
                            </Col>
                          </Row>

                          <Row>
                            <Col sm={6}>
                              <FormLabel>Working Hours</FormLabel>
                              <FormControl
                                type="number"
                                {...register('salary.working_hour')}
                                placeholder="Leave blank if not applicable"
                                min="0" max="24"
                              />
                            </Col>
                            <Col sm={6}>
                              <FormLabel>Overtime Rate ($/hr)</FormLabel>
                              <FormControl
                                type="number"
                                step="0.01"
                                {...register('salary.over_time')}
                                placeholder="Leave blank if not applicable"
                                min="0"
                              />
                            </Col>
                          </Row>

                          <FormLabel>Leave Days</FormLabel>
                          <FormControl
                            type="number"
                            step="0.01"
                            {...register('salary.leave_day')}
                            placeholder="Leave blank if not applicable"
                            min="0"
                          />
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
