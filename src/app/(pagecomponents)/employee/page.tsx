'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row, Spinner } from 'react-bootstrap'
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'


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

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<HTMLTableElement>(null)
  const [dataTable, setDataTable] = useState<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const { toasts, addToast, removeToast } = useToasts()

  const token = useSelector((state: RootState) => state.auth.token)
  const tokenPayload = token ? jwtDecode<any>(token) : null
  const isAdmin = tokenPayload?.type === 'admin'

  const handleTokenExpired = async () => {
   
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
  }

  useEffect(() => {
    document.title = `${appTitle} Employee Management`
  }, [])

 
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
        } catch (error) {
          console.error('Error parsing stored user data:', error)
        }
      }

      
      await handleTokenExpired()
    }

    checkAuth()
  }, [dispatch, token])

  useEffect(() => {
    if (token && validateToken(token)) {
      fetchEmployees()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      
      const data = await apiClient.get('/employee-management', token, handleTokenExpired)
      const filteredEmployees = data.filter((emp: any) => emp.type !== 'admin')
      setEmployees(filteredEmployees)
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        
        return
      }
      addToast('Failed to fetch employees', { toastClass: 'bg-danger', delay: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
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
        
        await apiClient.delete(`/employee-management/${id}`, token, handleTokenExpired)
        setEmployees(prev => prev.filter(emp => emp.id !== id))
        addToast('Employee deleted successfully', { toastClass: 'bg-success', delay: 3000 })
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('Session expired')) {
         
          return
        }
        addToast('Failed to delete employee', { toastClass: 'bg-danger', delay: 3000 })
        fetchEmployees()
      }
    }
  }

  const handleTableButtonClick = async (id: string, type: 'edit' | 'delete' | 'view') => {
    console.log('🎯 Button clicked with ID:', id, 'Type:', type);

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
          { 
            title: 'Reference Date', 
            data: 'reference_date',
            render: (data: any) => {
              if (!data) return '-'
              return new Date(data).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            }
          },
          { 
            title: 'Created At', 
            data: 'createdAt',
            render: (data: any) => {
              return new Date(data).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          },
          { 
            title: 'Updated At', 
            data: 'updatedAt',
            render: (data: any) => {
              return new Date(data).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          },
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

  useEffect(() => {
    if (dataTable && employees.length > 0) {
      dataTable.clear()
      dataTable.rows.add(employees)
      dataTable.draw()
    }
  }, [employees, dataTable])

  useEffect(() => {
    return () => {
      if (dataTable && $.fn.DataTable.isDataTable(table.current)) {
        dataTable.destroy(true)
        setDataTable(null)
      }
    }
  }, [dataTable])

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
            <Link href="/employee/add" className="btn btn-primary mt-2">
              <i className="mdi mdi-plus me-1"></i>Add First Employee
            </Link>
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