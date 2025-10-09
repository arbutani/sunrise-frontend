'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row, Button } from 'react-bootstrap'

import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'

import ReactDOMServer from 'react-dom/server'
import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight, TbArrowLeft } from 'react-icons/tb'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch } from 'react-redux'

import { setToken } from '@/store/authSlice'

import { get } from '@/lib/requests'
import ProtectedRoute from '@/components/ProtectedRoute' // ✅ ProtectedRoute import karo

const EmployeeDetailsCard = ({ employeeId }: { employeeId: string }) => {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await get(`employe-managment/${employeeId}`, true)
        if (response.data && response.data.data) {
          setEmployeeData(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching employee details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchEmployeeDetails()
    }
  }, [employeeId])

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <p className="text-center mb-0">Loading employee details...</p>
        </Card.Body>
      </Card>
    )
  }

  if (!employeeData) {
    return null
  }

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Employee Details</h5>
        <Button 
          variant="primary" 
          onClick={() => router.push('/employee')}
          className="d-flex align-items-center gap-2"
        >
          <TbArrowLeft className="fs-lg" />
          Back to Employees
        </Button>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <p className="mb-2">
              <strong>Name:</strong> {employeeData.name}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {employeeData.email_address}
            </p>
            <p className="mb-2">
              <strong>Type:</strong> {employeeData.type}
            </p>
          </Col>
          <Col md={6}>
            <p className="mb-2">
              <strong>Reference Number:</strong> {employeeData.reference_number}
            </p>
            <p className="mb-2">
              <strong>Reference Date:</strong> {employeeData.reference_date}
            </p>
            <p className="mb-2">
              <strong>Created At:</strong> {employeeData.createdAt}
            </p>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

const BasicTable = ({ employeeId }: { employeeId: string }) => {
  DataTable.use(DT)
  const table = useRef<any>(null)

  const options = {
    responsive: true,
    language: {
      paginate: {
        first: ReactDOMServer.renderToStaticMarkup(<TbChevronsLeft className="fs-lg" />),
        previous: ReactDOMServer.renderToStaticMarkup(<TbChevronLeft className="fs-lg" />),
        next: ReactDOMServer.renderToStaticMarkup(<TbChevronRight className="fs-lg" />),
        last: ReactDOMServer.renderToStaticMarkup(<TbChevronsRight className="fs-lg" />),
      },
    },
    processing: true,
    serverSide: false,
    ajax: async (dtData: any, callback: (data: any) => void) => {
      try {
        if (!employeeId) {
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
          return
        }
        const url = `employee-salary/employee/${employeeId}`
        const response = await get(url, true)
        const apiData = response.data
        if (apiData && apiData.data) {
          const salaryData = apiData.data
          callback({
            draw: 1,
            data: salaryData,
            recordsTotal: salaryData.length,
            recordsFiltered: salaryData.length,
          })
        } else {
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
        }
      } catch (error) {
        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
      }
    },
    columns: [
      { title: 'Monthly Salary', data: 'monthly_salary' },
      { title: 'Working Days', data: 'working_days' },
      { title: 'Working Hours', data: 'working_hour' },
      { title: 'Created At', data: 'createdAt' },
      { title: 'Updated At', data: 'updatedAt' },
    ],
  }

  return (
    <ComponentCard title="Employee Salary Records">
      <DataTable
        ref={table}
        options={options}
        className="table table-striped dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>Monthly Salary</th>
            <th>Working Days</th>
            <th>Working Hours</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody></tbody>
      </DataTable>
    </ComponentCard>
  )
}

const EmployeeSalaryPage = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const params = useParams()
  const employeeId = params?.id as string

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.token) {
        dispatch(setToken(parsed.token))
      }
    }
  }, [dispatch])

  return (
    <Fragment>
      <Container fluid>
        <PageBreadcrumb title="Employee Salary" />
      </Container>

      <Container fluid>
        <Row className="justify-content-center">
          <Col sm={12}>
            {employeeId && <EmployeeDetailsCard employeeId={employeeId} />}
            {employeeId && <BasicTable employeeId={employeeId} />}
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}


const Page = () => {
  return (
    <ProtectedRoute>
      <EmployeeSalaryPage />
    </ProtectedRoute>
  )
}

export default Page