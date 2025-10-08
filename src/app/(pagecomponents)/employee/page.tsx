'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row } from 'react-bootstrap'

import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'

import ReactDOMServer from 'react-dom/server'
import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight } from 'react-icons/tb'
import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setToken, clearToken } from '@/store/authSlice'
import { jwtDecode } from 'jwt-decode' 
import { delete_ } from '@/lib/requests'
import ProtectedRoute from '@/components/ProtectedRoute' 

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  const [isTokenValid, setIsTokenValid] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])

 
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.token) {
        dispatch(setToken(parsed.token))
      
        try {
          const decoded: any = jwtDecode(parsed.token)
          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            console.log('Token expired')
            setIsTokenValid(false)
            handleTokenExpired()
          }
        } catch (error) {
          console.error('Invalid token:', error)
          setIsTokenValid(false)
        }
      }
    }
  }, [dispatch])

  const token = useSelector((state: RootState) => state.auth.token)
  const tokenPayload = token ? jwtDecode<any>(token) : null
  const isAdmin = tokenPayload?.type === 'admin'

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

  useEffect(() => {
    if (isTokenValid) {
      fetchEmployees()
    }
  }, [isTokenValid])

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...')
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/employe-managment`, {
        method: 'GET',
        headers,
      })

      if (response.status === 401) {
        setIsTokenValid(false)
        await handleTokenExpired()
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched employees:', data)
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleTokenExpired = async () => {
    await Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      confirmButtonText: 'Login',
    })
    
   
    dispatch(clearToken())
    localStorage.removeItem('user')
    router.push('/login')
  }

  const options = {
    responsive: true,
    serverSide: false,
    processing: true,
    data: employees, 
    language: {
      paginate: {
        first: ReactDOMServer.renderToStaticMarkup(<TbChevronsLeft className="fs-lg" />),
        previous: ReactDOMServer.renderToStaticMarkup(<TbChevronLeft className="fs-lg" />),
        next: ReactDOMServer.renderToStaticMarkup(<TbChevronRight className="fs-lg" />),
        last: ReactDOMServer.renderToStaticMarkup(<TbChevronsRight className="fs-lg" />),
      },
      emptyTable: 'No employees found',
      zeroRecords: 'No matching records found',
    },
    columns: [
      { title: 'Name', data: 'name' },
      { title: 'E-Mail Address', data: 'email_address' },
      { title: 'Type', data: 'type' },
      { title: 'Reference Number', data: 'reference_number' },
      { title: 'Reference Date', data: 'reference_date' },
      { title: 'Created At', data: 'createdAt' },
      { title: 'Updated At', data: 'updatedAt' },
      {
        title: 'Actions',
        data: 'id',
        orderable: false,
        searchable: false,
        render: function (data: string) {
          return `
            <div class="d-flex gap-2">
              <a href='/employee/edit/${data}' class="btn btn-sm btn-soft-primary btn-edit">Edit</a>
              <button type="button" data-id="${data}" class="btn btn-sm btn-soft-danger btn-delete">Delete</button>
              <button type="button" data-id="${data}" class="btn btn-sm btn-soft-info btn-view">View</button>
            </div>
          `
        },
      },
    ],
    drawCallback: function () {
     
    },
    initComplete: function () {
      console.log('DataTable initialized')
    }
  }

  useEffect(() => {
    const handleClick = async (e: any) => {
      const target = e.target

      
      if (!isTokenValid) {
        e.preventDefault()
        await handleTokenExpired()
        return
      }

      if (!isAdmin && (target.classList.contains('btn-edit') || target.classList.contains('btn-delete') || target.classList.contains('btn-view'))) {
        e.preventDefault()
        await Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'You are not admin. Only admin can access this functionality.',
        })
        return
      }

      if (isAdmin) {
        if (target.classList.contains('btn-delete')) handleDelete(e)
        if (target.classList.contains('btn-view')) handleView(e)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [isAdmin, isTokenValid, router])

  const handleDelete = async (e: any) => {
    if (!isTokenValid) {
      await handleTokenExpired()
      return
    }

    const id = e.target.getAttribute('data-id')
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${API_URL}/employe-managment/${id}`, {
          method: 'DELETE',
          headers,
        })

        if (response.status === 401) {
          setIsTokenValid(false)
          await handleTokenExpired()
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        Swal.fire('Deleted!', 'Employee has been deleted.', 'success').then(() => {
        
          fetchEmployees()
        })
      } catch (error) {
        Swal.fire('Error!', 'Failed to delete employee.', 'error')
      }
    }
  }

  const handleView = (e: any) => {
    if (!isTokenValid) {
      handleTokenExpired()
      return
    }

    const id = e.target.getAttribute('data-id')
    router.push(`/employee/view/${id}`)
  }

  return (
    <ComponentCard title="Employee List">
      {!isTokenValid && (
        <div className="alert alert-warning mb-3">
          <i className="mdi mdi-alert-circle-outline me-2"></i>
          Your session has expired. Please login again to continue.
        </div>
      )}
      
      {/* Simple table agar DataTable kaam na kare */}
      {employees.length === 0 ? (
        <div className="text-center p-4">
          <p>Loading employees...</p>
        </div>
      ) : (
        <DataTable
          ref={table}
          options={options}
          className="table table-striped dt-responsive align-middle mb-0"
        >
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>Name</th>
              <th>E-Mail Address</th>
              <th>Type</th>
              <th>Reference Number</th>
              <th>Reference Date</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      )}
    </ComponentCard>
  )
}

const PageContent = () => (
  <Fragment>
    <Container fluid className="px-2 px-sm-3">
      <PageBreadcrumb title="Employee List" />
      <Row className="justify-content-center mt-3">
        <Col xs={12}>
          <Card className="mb-3">
            <Card.Body className="p-3 p-sm-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <h5 className="card-title mb-1">Manage Employees</h5>
                  <p className="text-muted mb-0 small">Add, edit, or delete employees</p>
                </div>
                <Link href="/employee/add" className="btn btn-primary">
                  <i className="mdi mdi-plus me-1"></i>Add Employee
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12}>
          <BasicTable />
        </Col>
      </Row>
    </Container>
  </Fragment>
)

const Page = () => {
  return (
    <ProtectedRoute>
      <PageContent />
    </ProtectedRoute>
  )
}

export default Page