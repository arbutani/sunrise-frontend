'use client'

import { userDropdownItems } from '@/layouts/components/data'
import { Fragment, useEffect, useState } from 'react'
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { TbChevronDown } from 'react-icons/tb'
import { useDispatch } from 'react-redux'
import { clearToken } from '@/store/authSlice'
import { persistor } from '@/store'


const UserProfile = () => {
  const [username, setUsername] = useState('')
  const [mounted, setMounted] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUsername(payload.username || 'User')
      } catch (error) {
        console.error('Invalid token', error)
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      // 1. Redux state clear karo
      dispatch(clearToken())

      // 2. redux-persist ka storage clear karo
      await persistor.purge()

      // 3. LocalStorage ka fallback token bhi remove karo
      localStorage.removeItem('token')

      // 4. Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!mounted) return null

  return (
    <div className="topbar-item nav-user">
      <Dropdown align="end">
        <DropdownToggle as={'a'} className="topbar-link dropdown-toggle drop-arrow-none px-2">
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{username || 'User'}</h5>
            <TbChevronDown className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {userDropdownItems.map((item, idx) => (
            <Fragment key={idx}>
              {item.isHeader ? (
                <div className="dropdown-header noti-title">
                  <h6 className="text-overflow m-0">{item.label}</h6>
                </div>
              ) : item.isDivider ? (
                <DropdownDivider />
              ) : item.label && item.label.toLowerCase().replace(/\s+/g, ' ').includes('log out') ? (
                <DropdownItem
                  as="button"
                  onClick={handleLogout}
                  className={item.class}
                  type="button"
                >
                  {item.icon && <item.icon className="me-2 fs-17 align-middle" />}
                  <span className="align-middle">{item.label}</span>
                </DropdownItem>
              ) : (
                <DropdownItem as="a" href={item.url} className={item.class}>
                  {item.icon && <item.icon className="me-2 fs-17 align-middle" />}
                  <span className="align-middle">{item.label}</span>
                </DropdownItem>
              )}
            </Fragment>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default UserProfile
