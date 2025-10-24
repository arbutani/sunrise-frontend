'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import ReactDOMServer from 'react-dom/server'
import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight } from 'react-icons/tb'
import { Fragment, useEffect, useRef, useState, useCallback } from 'react'
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

const parseCustomDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  const [datePart, timePart, period] = dateString.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let hours24 = hours;
  if (period === 'PM' && hours !== 12) {
    hours24 += 12;
  } else if (period === 'AM' && hours === 12) {
    hours24 = 0;
  }
  
  return new Date(year, month - 1, day, hours24, minutes);
};

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<HTMLTableElement>(null)
  const dataTableRef = useRef<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [hasFetchError, setHasFetchError] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toasts, addToast, removeToast } = useToasts()

  const token = useSelector((state: RootState) => state.auth.token)
  const tokenPayload = token ? jwtDecode<any>(token) : null
  const isAdmin = tokenPayload?.type === 'admin'

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
    document.title = `${appTitle} Admin Management`
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
  }, [dispatch, token, handleTokenExpired])

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true)
      setHasFetchError(false)
      if (!token || !validateToken(token)) {
        await handleTokenExpired()
        return
      }

      const data = await apiClient.get('/employee-management', token, handleTokenExpired)
      
      if (data.status === false) {
        setAdmins([])
      } else if (Array.isArray(data)) {
        const filteredAdmins = data.filter((emp: any) => emp.type === 'admin')
        setAdmins(filteredAdmins)
      } else if (data.data && Array.isArray(data.data)) {
        const filteredAdmins = data.data.filter((emp: any) => emp.type === 'admin')
        setAdmins(filteredAdmins)
      } else {
        setAdmins([])
      }
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        return
      }
      if (!error.message?.includes('404')) {
        setHasFetchError(true)
      } else {
        setAdmins([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [token, handleTokenExpired])

  useEffect(() => {
    if (token && validateToken(token)) {
      fetchAdmins()
    } else {
      setIsLoading(false)
    }
  }, [token, fetchAdmins])

  useEffect(() => {
    const handleFocus = async () => {
      if (token && validateToken(token)) {
        try {
          const data = await apiClient.get('/employee-management', token, handleTokenExpired)
          
          if (data.status === false) {
            setAdmins([])
          } else if (Array.isArray(data)) {
            const filteredAdmins = data.filter((emp: any) => emp.type === 'admin')
            setAdmins(filteredAdmins)
          } else if (data.data && Array.isArray(data.data)) {
            const filteredAdmins = data.data.filter((emp: any) => emp.type === 'admin')
            setAdmins(filteredAdmins)
          } else {
            setAdmins([])
          }
        } catch (error) {
          console.error('Error fetching admins on focus:', error)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [token, handleTokenExpired])

  const handleDelete = useCallback(async (id: string) => {
    if (!token || !validateToken(token)) {
      await handleTokenExpired()
      return
    }

    if (!isAdmin) {
      await Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only admin can delete other admins.',
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
        
        if (dataTableRef.current && table.current && $.fn.DataTable.isDataTable(table.current)) {
          try {
            dataTableRef.current.destroy()
            dataTableRef.current = null
          } catch (error) {
            console.error('Error destroying DataTable:', error)
          }
        }
        
        const updatedAdmins = admins.filter(admin => admin.id !== id)
        setAdmins(updatedAdmins)
        
        addToast('Admin deleted successfully', { toastClass: 'bg-success', delay: 3000 })
        
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('Session expired')) {
          return
        }
        addToast('Failed to delete admin', { toastClass: 'bg-danger', delay: 3000 })
        fetchAdmins()
      }
    }
  }, [token, handleTokenExpired, addToast, fetchAdmins, admins, isAdmin])

  const handleTableButtonClick = useCallback(async (id: string, type: 'delete') => {
    if (!isAdmin) {
      await Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only admin can delete other admins.',
      })
      return
    }

    if (type === 'delete') {
      await handleDelete(id)
    }
  }, [handleDelete, isAdmin])

  useEffect(() => {
    if (!table.current || admins.length === 0) {
      if (dataTableRef.current && table.current && $.fn.DataTable.isDataTable(table.current)) {
        try {
          dataTableRef.current.destroy()
          dataTableRef.current = null
        } catch (error) {
          console.error('Error destroying DataTable:', error)
        }
      }
      return
    }

    if (dataTableRef.current && $.fn.DataTable.isDataTable(table.current)) {
      try {
        dataTableRef.current.destroy()
      } catch (error) {
        console.error('Error destroying DataTable:', error)
      }
    }

    try {
      const dt = $(table.current).DataTable({
        responsive: true,
        serverSide: false,
        processing: true,
        data: admins,
        destroy: true,
        autoWidth: false,
        language: {
          paginate: {
            first: ReactDOMServer.renderToStaticMarkup(<TbChevronsLeft className="fs-lg" />),
            previous: ReactDOMServer.renderToStaticMarkup(<TbChevronLeft className="fs-lg" />),
            next: ReactDOMServer.renderToStaticMarkup(<TbChevronRight className="fs-lg" />),
            last: ReactDOMServer.renderToStaticMarkup(<TbChevronsRight className="fs-lg" />),
          },
          emptyTable: 'No admins found',
          zeroRecords: 'No matching records found',
        },
        columns: [
          { 
            title: 'Name', 
            data: 'name',
            width: '15%'
          },
          { 
            title: 'E-Mail Address', 
            data: 'email_address',
            width: '20%'
          },
          { 
            title: 'Type', 
            data: 'type',
            width: '10%'
          },
          { 
            title: 'Reference Number', 
            data: 'reference_number',
            width: '15%'
          },
          { 
            title: 'Reference Date', 
            data: 'reference_date',
            width: '10%'
          },
          { 
            title: 'Created At', 
            data: 'createdAt',
            width: '15%',
            render: (data: any) => {
              try {
                const date = parseCustomDate(data);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              } catch (error) {
                return 'Invalid Date';
              }
            }
          },
          { 
            title: 'Updated At', 
            data: 'updatedAt',
            width: '15%',
            render: (data: any) => {
              try {
                const date = parseCustomDate(data);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              } catch (error) {
                return 'Invalid Date';
              }
            }
          },
          {
            title: 'Actions',
            data: null,
            orderable: false,
            searchable: false,
            width: '10%',
            render: (data: any, type: any, row: any) => {
              return `
                <div class="d-flex gap-2">
                  <button type="button" data-id="${row.id}" class="btn btn-sm btn-soft-danger btn-delete">Delete</button>
                </div>
              `;
            },
          },
        ],
        drawCallback: function () {
          $('.btn-delete').off('click').on('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            const id = $(this).data('id')
            handleTableButtonClick(id, 'delete')
          })
        }
      })
      
      dataTableRef.current = dt
    } catch (error) {
      console.error('Error creating DataTable:', error)
    }
  }, [admins, handleTableButtonClick])

  useEffect(() => {
    return () => {
      if (dataTableRef.current && table.current && $.fn.DataTable.isDataTable(table.current)) {
        try {
          dataTableRef.current.destroy(true)
          dataTableRef.current = null
        } catch (error) {
          console.error('Error cleaning up DataTable:', error)
        }
      }
    }
  }, [])

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
      <ComponentCard title="Admin List">
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading admins...</p>
          </div>
        ) : hasFetchError ? (
          <div className="text-center p-4">
            <div className="text-danger mb-2">
              <i className="mdi mdi-alert-circle-outline fs-1"></i>
            </div>
            <p className="text-danger">Failed to load admins</p>
            <button 
              onClick={fetchAdmins} 
              className="btn btn-primary mt-2"
            >
              <i className="mdi mdi-reload me-1"></i>Try Again
            </button>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center p-4">
            <p>No admins found.</p>
            <Link href="/admin/add" className="btn btn-primary mt-2">
              <i className="mdi mdi-plus me-1"></i>Add First Admin
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
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
          </div>
        )}
      </ComponentCard>
    </Fragment>
  )
}

const PageContent = () => (
  <Fragment>
    <Container fluid className="px-2 px-sm-3">
      <PageBreadcrumb title="Admin List" />
      <Row className="justify-content-center mt-3">
        <Col xs={12}>
          <Card className="mb-3">
            <Card.Body className="p-3 p-sm-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <h5 className="card-title mb-1">Manage Admins</h5>
                  <p className="text-muted mb-0 small">Delete admins from system</p>
                </div>
                <Link href="/admin/add" className="btn btn-primary">
                  <i className="mdi mdi-plus me-1"></i>Add Admin
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

const Page = () => <PageContent />

export default Page