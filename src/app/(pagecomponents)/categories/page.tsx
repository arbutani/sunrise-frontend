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
  const [categories, setCategories] = useState<any[]>([])
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
    document.title = `${appTitle} Categories Management`
  }, [])

  useEffect(() => {
    if (token && validateToken(token)) {
      fetchCategories()
    }
  }, [token])

  const fetchCategories = async () => {
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

      const response = await fetch(`${API_URL}/categories`, { 
        method: 'GET', 
        headers 
      })
      
      if (response.status === 401) {
        await handleTokenExpired()
        return
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setCategories(data)

    } catch (error) {
      console.error('Error fetching categories:', error)
      if (error instanceof Error && error.message.includes('401')) {
        await handleTokenExpired()
      } else {
        addToast('Failed to fetch categories', { toastClass: 'bg-danger', delay: 3000 })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (categories.length > 0 && table.current && !dataTable) {
      const dt = $(table.current).DataTable({
        responsive: true,
        serverSide: false,
        processing: true,
        data: categories,
        destroy: true,
        language: {
          paginate: {
            first: ReactDOMServer.renderToStaticMarkup(<TbChevronsLeft className="fs-lg" />),
            previous: ReactDOMServer.renderToStaticMarkup(<TbChevronLeft className="fs-lg" />),
            next: ReactDOMServer.renderToStaticMarkup(<TbChevronRight className="fs-lg" />),
            last: ReactDOMServer.renderToStaticMarkup(<TbChevronsRight className="fs-lg" />),
          },
          emptyTable: 'No categories found',
          zeroRecords: 'No matching records found',
        },
        columns: [
          { title: 'Name', data: 'name' },
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
  }, [categories, dataTable])

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
      router.push(`/categories/view/${id}`)
    } else if (type === 'edit') {
      console.log('🚀 Navigating to edit page with ID:', id)
      router.push(`/categories/edit/${id}`)
    }
  }

  useEffect(() => {
    if (dataTable && categories.length > 0) {
      dataTable.clear()
      dataTable.rows.add(categories)
      dataTable.draw()
    }
  }, [categories, dataTable])

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

        const response = await fetch(`${API_URL}/categories/${id}`, {
          method: 'DELETE',
          headers,
        })

        if (response.status === 401) {
          await handleTokenExpired()
          return
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        setCategories(prev => prev.filter(cat => cat.id !== id))
        
        addToast('Category deleted successfully', { toastClass: 'bg-success', delay: 3000 })
        
      } catch (error) {
        addToast('Failed to delete category', { toastClass: 'bg-danger', delay: 3000 })
        fetchCategories()
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
      <ComponentCard title="Categories List">
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center p-4">
            <p>No categories found.</p>
          </div>
        ) : (
          <table
            ref={table}
            className="table table-striped dt-responsive align-middle mb-0 w-100"
          >
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th>Name</th>
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
      <PageBreadcrumb title="Categories List" />
      <Row className="justify-content-center mt-3">
        <Col xs={12}>
          <Card className="mb-3">
            <Card.Body className="p-3 p-sm-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <h5 className="card-title mb-1">Manage Categories</h5>
                  <p className="text-muted mb-0 small">Add, edit, or delete categories</p>
                </div>
                <Link href="/categories/add" className="btn btn-primary">
                  <i className="mdi mdi-plus me-1"></i>Add Category
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