'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row, Button } from 'react-bootstrap'

import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'

import ReactDOMServer from 'react-dom/server'
import {
  TbChevronLeft,
  TbChevronRight,
  TbChevronsLeft,
  TbChevronsRight,
} from 'react-icons/tb'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import { jwtDecode } from 'jwt-decode'

import { setToken, clearToken } from '@/store/authSlice'
import { RootState } from '@/store'
import ProtectedRoute from '@/components/ProtectedRoute'
import { appTitle } from '@/helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'


const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  } catch (error) {
    return false
  }
}


const EmployeeDetailsCard = ({ 
  employeeId, 
  token, 
  onTokenExpired 
}: { 
  employeeId: string
  token: string | null
  onTokenExpired: () => Promise<void>
}) => {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    document.title = `${appTitle}Salary Details`
  }, [])

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        if (!token || !validateToken(token)) {
          await onTokenExpired()
          return
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }

        const response = await fetch(`${API_URL}/employe-managment/${employeeId}`, {
          method: 'GET',
          headers
        })

        if (response.status === 401) {
          await onTokenExpired()
          return
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        if (data && data.data) {
          setEmployeeData(data.data)
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          await onTokenExpired()
        } else {
          console.error('Error fetching employee details:', error)
          Swal.fire('Error!', 'Failed to load employee details.', 'error')
        }
      } finally {
        setLoading(false)
      }
    }

    if (employeeId && token) {
      fetchEmployeeDetails()
    }
  }, [employeeId, token])

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading employee details...</p>
          </div>
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
          Back
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


const BasicTable = ({ 
  employeeId, 
  token, 
  onTokenExpired 
}: { 
  employeeId: string
  token: string | null
  onTokenExpired: () => Promise<void>
}) => {
  DataTable.use(DT)
  const table = useRef<any>(null)

  const options = {
    responsive: true,
    language: {
      paginate: {
        first: ReactDOMServer.renderToStaticMarkup(
          <TbChevronsLeft className="fs-lg" />,
        ),
        previous: ReactDOMServer.renderToStaticMarkup(
          <TbChevronLeft className="fs-lg" />,
        ),
        next: ReactDOMServer.renderToStaticMarkup(
          <TbChevronRight className="fs-lg" />,
        ),
        last: ReactDOMServer.renderToStaticMarkup(
          <TbChevronsRight className="fs-lg" />,
        ),
      },
      emptyTable: 'No salary records found',
      zeroRecords: 'No matching records found',
    },
    processing: true,
    serverSide: false,
    ajax: async (dtData: any, callback: (data: any) => void) => {
      try {
        if (!employeeId || !token || !validateToken(token)) {
          if (!validateToken(token || '')) {
            await onTokenExpired()
          }
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
          return
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }

        const response = await fetch(`${API_URL}/employee-salary/employee/${employeeId}`, {
          method: 'GET',
          headers
        })

        if (response.status === 401) {
          await onTokenExpired()
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
          return
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const apiData = await response.json()

        if (apiData && apiData.data) {
         
          const salaryData = apiData.data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )

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
        if (error instanceof Error && error.message.includes('401')) {
          await onTokenExpired()
        } else {
          console.error('Error fetching salary data:', error)
        }
        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
      }
    },
    order: [[3, 'desc']],
    columns: [
      { title: 'Monthly Salary', data: 'monthly_salary' },
      { title: 'Working Days', data: 'working_days' },
      { title: 'Working Hours', data: 'working_hour' },
      { title: 'Created At', data: 'createdAt' },
      { title: 'Updated At', data: 'updatedAt' },
    ],
  }

  return (
    <ComponentCard title="Salary Details">
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
  const [isLoading, setIsLoading] = useState(true)

  const token = useSelector((state: RootState) => state.auth.token)

  const handleTokenExpired = async () => {
    await Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      confirmButtonText: 'Login',
      allowOutsideClick: false,
    })
    
    dispatch(clearToken())
    localStorage.removeItem('user')
    router.push('/login')
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (token && validateToken(token)) {
        setIsLoading(false)
        return
      }

      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.token && validateToken(parsed.token)) {
          dispatch(setToken(parsed.token))
          setIsLoading(false)
          return
        }
      }

      await handleTokenExpired()
    }

    checkAuth()
  }, [dispatch, token])

  if (isLoading) {
    return (
      <Container fluid>
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </Container>
    )
  }

  return (
    <Fragment>
      <Container fluid>
        <PageBreadcrumb title="Employee Salary" subtitle="Employee List" subtitleLink="/employee" />
      </Container>

      <Container fluid>
        <Row className="justify-content-center">
          <Col sm={12}>
            {employeeId && (
              <EmployeeDetailsCard 
                employeeId={employeeId} 
                token={token}
                onTokenExpired={handleTokenExpired}
              />
            )}
            {employeeId && (
              <BasicTable 
                employeeId={employeeId} 
                token={token}
                onTokenExpired={handleTokenExpired}
              />
            )}
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

// 🔹 Protected Page Wrapper
const Page = () => {
  return (
    <ProtectedRoute>
      <EmployeeSalaryPage />
    </ProtectedRoute>
  )
}

export default Page