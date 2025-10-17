'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row, Button } from 'react-bootstrap'
import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import ReactDOMServer from 'react-dom/server'
import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight } from 'react-icons/tb'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import { jwtDecode } from 'jwt-decode'
import { setToken, clearToken } from '@/store/authSlice'
import { RootState } from '@/store'
import { appTitle } from '@/helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
let isShowingSessionAlert = false

class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
  }

  private async handleResponse(response: Response, onTokenExpired: () => Promise<void>) {
    if (response.status === 401) {
      await onTokenExpired()
      throw new Error('Session expired')
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  }

  async get(url: string, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    return this.handleResponse(response, onTokenExpired)
  }

  async post(url: string, data: any, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return this.handleResponse(response, onTokenExpired)
  }

  async put(url: string, data: any, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return this.handleResponse(response, onTokenExpired)
  }

  async delete(url: string, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    return this.handleResponse(response, onTokenExpired)
  }
}

export const apiClient = new ApiClient()

const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  } catch {
    return false
  }
}

const CategoryDetailsCard = ({
  categoryId,
  token,
  onTokenExpired,
}: {
  categoryId: string
  token: string | null
  onTokenExpired: () => Promise<void>
}) => {
  const [categoryData, setCategoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    document.title = `${appTitle}Category Details`
  }, [])

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        if (!token || !validateToken(token)) {
          await onTokenExpired()
          return
        }
        const data = await apiClient.get(`/categories/${categoryId}`, token, onTokenExpired)
        if (data && data.data) setCategoryData(data.data)
      } catch (error) {
        if (error instanceof Error && error.message.includes('Session expired')) return
        Swal.fire('Error!', 'Failed to load category details.', 'error')
      } finally {
        setLoading(false)
      }
    }
    if (categoryId && token) fetchCategoryDetails()
  }, [categoryId, token])

  if (loading)
    return (
      <Card className="mb-3">
        <Card.Body>
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading category details...</p>
          </div>
        </Card.Body>
      </Card>
    )

  if (!categoryData) return null

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Category Details</h5>
        <Button variant="primary" onClick={() => router.push('/categories')} className="d-flex align-items-center gap-2">
          Back
        </Button>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <p className="mb-2">
              <strong>Name:</strong> {categoryData.name}
            </p>
          </Col>
          <Col md={6}>
            <p className="mb-2">
              <strong>Created At:</strong> {categoryData.createdAt}
            </p>
            <p className="mb-2">
              <strong>Updated At:</strong> {categoryData.updatedAt}
            </p>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

const BasicTable = ({
  categoryId,
  token,
  onTokenExpired,
}: {
  categoryId: string
  token: string | null
  onTokenExpired: () => Promise<void>
}) => {
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
      emptyTable: 'No subcategories found',
      zeroRecords: 'No matching records found',
    },
    processing: true,
    serverSide: false,
    ajax: async (dtData: any, callback: (data: any) => void) => {
      try {
        if (!categoryId || !token || !validateToken(token)) {
          if (!validateToken(token || '')) await onTokenExpired()
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
          return
        }
        const apiData = await apiClient.get(`/subcategories/category/${categoryId}`, token, onTokenExpired)
        const subcategoriesData = apiData?.data || []
        if (Array.isArray(subcategoriesData)) {
          const sortedData = subcategoriesData.sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          callback({
            draw: 1,
            data: sortedData,
            recordsTotal: sortedData.length,
            recordsFiltered: sortedData.length,
          })
        } else {
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Session expired'))
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
        else callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
      }
    },
    order: [[3, 'desc']],
    columns: [
      { title: 'ID', data: 'id' },
      { title: 'Name', data: 'name' },
      { title: 'Category ID', data: 'category_id' },
      { title: 'Created At', data: 'createdAt' },
      { title: 'Updated At', data: 'updatedAt' },
    ],
  }

  return (
    <ComponentCard title="Subcategories">
      <DataTable ref={table} options={options} className="table table-striped dt-responsive align-middle mb-0">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category ID</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody></tbody>
      </DataTable>
    </ComponentCard>
  )
}

const CategorySubcategoriesPage = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const params = useParams()
  const categoryId = params?.id as string
  const [isLoading, setIsLoading] = useState(true)
  const token = useSelector((state: RootState) => state.auth.token)

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
      setTimeout(() => (isShowingSessionAlert = false), 1000)
    }
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

  if (isLoading)
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

  return (
    <Fragment>
      <Container fluid>
        <PageBreadcrumb title="Category Subcategories" subtitle="Categories List" subtitleLink="/categories" />
      </Container>
      <Container fluid>
        <Row className="justify-content-center">
          <Col sm={12}>
            {categoryId && (
              <CategoryDetailsCard categoryId={categoryId} token={token} onTokenExpired={handleTokenExpired} />
            )}
            {categoryId && <BasicTable categoryId={categoryId} token={token} onTokenExpired={handleTokenExpired} />}
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

export default CategorySubcategoriesPage
