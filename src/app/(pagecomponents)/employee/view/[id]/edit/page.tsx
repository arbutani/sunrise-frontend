'use client'

import { useToasts } from '@/components/helper/useToasts'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useRouter, useParams } from 'next/navigation'
import React, { Fragment, useEffect } from 'react'
import { Button, Card, Col, Container, Form, FormControl, FormLabel, Row } from 'react-bootstrap'
import * as Yup from 'yup'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { HandleError } from '@/lib/helper'
import { get, put } from '@/lib/requests'
import Toaster from '@/components/helper/toaster'
import Swal from 'sweetalert2'

const Page = () => {
  const { toasts, addToast, removeToast } = useToasts()
  const router = useRouter()
  const params = useParams()
  const employeeSalaryId = params.id

  const validationSchema = Yup.object().shape({
    monthly_salary: Yup.number().required('Monthly salary is required'),
    working_days: Yup.number().required('Working days are required'),
    working_hour: Yup.number().required('Working hours are required'),
    over_time: Yup.number().required('Over time hours are required'),
    leave_day: Yup.number().required('Leave days are required'),
  })

  const formOptions = { resolver: yupResolver(validationSchema) }
  const { register, handleSubmit, formState, setValue } = useForm(formOptions)
  const { errors } = formState

  useEffect(() => {
    if (employeeSalaryId) {
      getData(employeeSalaryId as string)
    }
  }, [employeeSalaryId])

  const getData = async (id: string) => {
    try {
      const res = await get(`/employee-salary/${id}`, true)
      if (res.data.status === true) {
        const data = res.data.data
        setValue('monthly_salary', data.monthly_salary ?? 0)
        setValue('working_days', data.working_days ?? 0)
        setValue('working_hour', data.working_hour ?? 0)
        setValue('over_time', data.over_time ?? 0)
        setValue('leave_day', data.leave_day ?? 0)
      } else {
        const message = Array.isArray(res.data.message) ? 'All Fields are required.' : res.data.message
        addToast(message, { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 })
    }
  }

  const onSubmit = async (formField: any) => {
    try {
      const putData = {
        monthly_salary: formField.monthly_salary,
        working_days: formField.working_days,
        working_hour: formField.working_hour,
        over_time: formField.over_time,
        leave_day: formField.leave_day,
      }

      const res = await put(`/employee-salary/${employeeSalaryId}`, putData, true)

      if (res.data.status === true) {
        addToast(res.data.message, { toastClass: 'bg-success', delay: 3000 })

        const result = await Swal.fire({
          title: 'Success!',
          text: 'Salary updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        })

        if (result.isConfirmed) {
          // Redirect to the employee view page after successful update
          router.push(`/employee/view/${employeeSalaryId}`)
        }
      } else {
        const message = Array.isArray(res.data.message) ? 'All Fields are required.' : res.data.message
        addToast(message, { toastClass: 'bg-danger', delay: 3000 })
      }
    } catch (error) {
      addToast(HandleError(error, router), { toastClass: 'bg-danger', delay: 3000 })
    }
  }

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid>
        <PageBreadcrumb title="Employee Salary Update" />
      </Container>
      <Container fluid>
        <Row className="justify-content-center">
          <Col sm={6}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Update Salary</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3 form-group">
                    <FormLabel>Monthly Salary</FormLabel>
                    <FormControl type="number" {...register('monthly_salary')} />
                    {errors.monthly_salary && <p className="text-danger">{errors.monthly_salary.message}</p>}
                  </div>
                  <div className="mb-3 form-group">
                    <FormLabel>Working Days</FormLabel>
                    <FormControl type="number" {...register('working_days')} />
                    {errors.working_days && <p className="text-danger">{errors.working_days.message}</p>}
                  </div>
                  <div className="mb-3 form-group">
                    <FormLabel>Working Hours</FormLabel>
                    <FormControl type="number" {...register('working_hour')} />
                    {errors.working_hour && <p className="text-danger">{errors.working_hour.message}</p>}
                  </div>
                  <div className="mb-3 form-group">
                    <FormLabel>Over Time</FormLabel>
                    <FormControl type="number" {...register('over_time')} />
                    {errors.over_time && <p className="text-danger">{errors.over_time.message}</p>}
                  </div>
                  <div className="mb-3 form-group">
                    <FormLabel>Leave Days</FormLabel>
                    <FormControl type="number" {...register('leave_day')} />
                    {errors.leave_day && <p className="text-danger">{errors.leave_day.message}</p>}
                  </div>
                  <div className="d-grid">
                    <Button type="submit" disabled={formState.isSubmitting} className="btn-primary fw-semibold py-2">
                      {formState.isSubmitting ? 'Updating...' : 'Update Salary'}
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

export default Page
