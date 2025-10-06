'use client'

import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row } from 'react-bootstrap'

import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'

import ReactDOMServer from 'react-dom/server'
import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight } from 'react-icons/tb'
import { Fragment, useEffect, useRef } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setToken } from '@/store/authSlice'
import { jwtDecode } from 'jwt-decode' 
import { get, delete_ } from '@/lib/requests'
import ProtectedRoute from '@/components/ProtectedRoute' 

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()

  // ✅ Restore token from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.token) {
        dispatch(setToken(parsed.token))
      }
    }
  }, [dispatch])

  const token = useSelector((state: RootState) => state.auth.token)
  const tokenPayload = token ? jwtDecode<any>(token) : null
  const isAdmin = tokenPayload?.type === 'admin'

  const options = {
    responsive: true,
    serverSide: true,
    processing: true,
    language: {
      paginate: {
        first: ReactDOMServer.renderToStaticMarkup(<TbChevronsLeft className="fs-lg" />),
        previous: ReactDOMServer.renderToStaticMarkup(<TbChevronLeft className="fs-lg" />),
        next: ReactDOMServer.renderToStaticMarkup(<TbChevronRight className="fs-lg" />),
        last: ReactDOMServer.renderToStaticMarkup(<TbChevronsRight className="fs-lg" />),
      },
    },
    ajax: async (dtData: any, callback: (data: any) => void) => {
      try {
        const params = new URLSearchParams()
        params.append('start', dtData.start || '0')
        params.append('length', dtData.length || '10')
        params.append('draw', dtData.draw || '1')

        if (dtData.search?.value) {
          params.append('search[value]', dtData.search.value)
        }
        if (dtData.order?.length > 0) {
          dtData.order.forEach((order: any, index: number) => {
            params.append(`order[${index}][column]`, order.column)
            params.append(`order[${index}][dir]`, order.dir)
          })
        }

        const url = `employe-managment?${params.toString()}`
        const response = await get(url, true)
        const apiData = response.data

        const mappedData = apiData.data.map((item: any) => ({
          id: item.id,
          employee_name: item.employee_name,
          email_address: item.email_address,
          employee_salary: item.employee_salary,
          total_payable_salary: item.total_payable_salary,
        }))

        callback({
          draw: apiData.draw,
          data: mappedData,
          recordsTotal: apiData.recordsTotal,
          recordsFiltered: apiData.recordsFiltered,
        })
      } catch (error) {
        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 })
      }
    },
    columns: [
      { title: 'Name', data: 'employee_name' },
      { title: 'E-Mail Address', data: 'email_address' },
      { title: 'Salary', data: 'employee_salary' },
      { title: 'Payable Salary', data: 'total_payable_salary' },
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
  }

  useEffect(() => {
    const handleClick = async (e: any) => {
      const target = e.target

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
  }, [isAdmin, router])

  const handleDelete = async (e: any) => {
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
        await delete_(`employe-managment/${id}`)
        Swal.fire('Deleted!', 'Employee has been deleted.', 'success').then(() => {
          if (table.current) table.current.ajax.reload(null, false)
          else router.refresh()
        })
      } catch (error) {
        Swal.fire('Error!', 'Failed to delete employee.', 'error')
      }
    }
  }

  const handleView = (e: any) => {
    const id = e.target.getAttribute('data-id')
    router.push(`/employee/view/${id}`)
  }

  return (
    <ComponentCard title="Employee List">
      <DataTable
        ref={table}
        options={options}
        className="table table-striped dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>Name</th>
            <th>E-Mail Address</th>
            <th>Salary</th>
            <th>Payable Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
      </DataTable>
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