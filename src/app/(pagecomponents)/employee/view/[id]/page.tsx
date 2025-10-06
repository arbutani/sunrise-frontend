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
import { useRouter, useParams } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setToken } from '@/store/authSlice'
import { jwtDecode } from 'jwt-decode'
import { get } from '@/lib/requests'

const BasicTable = () => {
  DataTable.use(DT)
  const table = useRef<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  const params = useParams()
  const employeeId = params?.id

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.token) {
        dispatch(setToken(parsed.token))
      }
    }
  }, [dispatch])

  const handleEditClick = (event: any) => {
    const button = event.target.closest('.btn-edit')
    if (button) {
      const id = button.getAttribute('data-id')
      if (id) {
        router.push(`/employee/view/${id}/edit`)
      }
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleEditClick)
    return () => {
      document.removeEventListener('click', handleEditClick)
    }
  }, [])

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
        const url = `employee-salary/${employeeId}`
        const response = await get(url, true)
        const apiData = response.data
        if (apiData && apiData.data) {
          const d = apiData.data
          callback({
            draw: 1,
            data: [d],
            recordsTotal: 1,
            recordsFiltered: 1,
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
      { title: 'Over Time', data: 'over_time' },
      { title: 'Leave Days', data: 'leave_day' },
      { title: 'Attempts Days', data: 'total_attempts_day' },
      { title: 'Payable Salary', data: 'total_payable_salary' },
      {
        title: 'Action',
        data: 'id',
        render: function (data: any, type: any, row: any) {
          return `
            <div class="d-flex gap-2">
                <button type="button" data-id="${employeeId}" class="btn-soft-primary btn-edit btn btn-primary">Edit</button>
            </div>
          `
        },
      },
    ],
  }

  return (
    <ComponentCard title="Employee Salary Details">
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
            <th>Over Time</th>
            <th>Leave Days</th>
            <th>Attempts Days</th>
            <th>Payable Salary</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </DataTable>
    </ComponentCard>
  )
}

const Page = () => {
  return (
    <Fragment>
      <Container fluid>
        <PageBreadcrumb title="Employee Salary" />
      </Container>

      <Container fluid>
        <Row className="justify-content-center">
          <Col sm={12}>
            <BasicTable />
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

export default Page
