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
import { appTitle } from '@/helpers'
import { jwtDecode } from 'jwt-decode'
import $ from 'jquery'
import { useToasts } from '@/components/helper/useToasts'
import Toaster from '@/components/helper/toaster'

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<HTMLTableElement>(null)
  const [dataTable, setDataTable] = useState<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toasts, addToast, removeToast } = useToasts()

  const token = useSelector((state: RootState) => state.auth.token)
  const tokenPayload = token ? jwtDecode<any>(token) : null
  const isAdmin = tokenPayload?.type === 'admin'

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

  useEffect(() => {
    document.title = `${appTitle} Employee Management`
  }, [])

  useEffect(() => {
    if (token && validateToken(token)) {
      fetchEmployees()
    }
  }, [token])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/employee-management`, { 
        method: 'GET', 
        headers 
      })
      
      if (response.status === 401) {
        await handleTokenExpired()
        return
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      const filteredEmployees = data.filter((emp: any) => emp.type !== 'admin')
      
      setEmployees(filteredEmployees)

    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        await handleTokenExpired()
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (employees.length > 0 && table.current && !dataTable) {
      const dt = $(table.current).DataTable({
        responsive: true,
        serverSide: false,
        processing: true,
        data: employees,
        destroy: true,
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
            data: null,
            orderable: false,
            searchable: false,
            render: function (data: any, type: any, row: any) {
              const htmlString = `
                <div class="d-flex gap-2">
                  <button type="button" data-id="${row.id}" class="btn btn-sm btn-soft-primary btn-edit">Edit</button>
                  <button type="button" data-id="${row.id}" class="btn btn-sm btn-soft-danger btn-delete">Delete</button>
                  <button type="button" data-id="${row.id}" class="btn btn-sm btn-soft-info btn-view">View</button>
                </div>
              `;
              return htmlString;
            },
          },
        ],
        drawCallback: function () {
          $(this.api().table().body()).find('.btn-edit, .btn-delete, .btn-view').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const id = $(this).data('id');
            const buttonType = $(this).hasClass('btn-edit') ? 'edit' : 
                             $(this).hasClass('btn-delete') ? 'delete' : 'view';
            
            handleTableButtonClick(id, buttonType);
          });
        }
      })
      setDataTable(dt)
    }
  }, [employees, dataTable])

 
  const handleTableButtonClick = async (id: string, type: 'edit' | 'delete' | 'view') => {
    console.log('🎯 Button clicked with ID:', id, 'Type:', type);

    if (!token || !validateToken(token)) {
      await handleTokenExpired()
      return
    }

    if (!isAdmin) {
      await Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You are not admin. Only admin can access this functionality.',
      })
      return
    }

    if (type === 'delete') {
      await handleDelete(id)
    } else if (type === 'view') {
      router.push(`/employee/view/${id}`)
    } else if (type === 'edit') {
      console.log('🚀 Navigating to edit page with ID:', id)
      router.push(`/employee/edit/${id}`)
    }
  }

  useEffect(() => {
    if (dataTable && employees.length > 0) {
      dataTable.clear()
      dataTable.rows.add(employees)
      dataTable.draw()
    }
  }, [employees, dataTable])

  const handleDelete = async (id: string) => {
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
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }

        const response = await fetch(`${API_URL}/employee-management/${id}`, {
          method: 'DELETE',
          headers,
        })

        if (response.status === 401) {
          await handleTokenExpired()
          return
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        setEmployees(prev => prev.filter(emp => emp.id !== id))
        
        addToast('Employee deleted successfully', { toastClass: 'bg-success', delay: 3000 })
        
      } catch (error) {
        addToast('Failed to delete employee', { toastClass: 'bg-danger', delay: 3000 })
        fetchEmployees()
      }
    }
  }

  useEffect(() => {
    return () => {
      if (dataTable && $.fn.DataTable.isDataTable(table.current)) {
        dataTable.destroy(true)
        setDataTable(null)
      }
    }
  }, [dataTable])

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <ComponentCard title="Employee List">
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center p-4">
            <p>No employees found.</p>
          </div>
        ) : (
          <table
            ref={table}
            className="table table-striped dt-responsive align-middle mb-0 w-100"
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
          </table>
        )}
      </ComponentCard>
    </Fragment>
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
  return <PageContent />
}

export default Page
