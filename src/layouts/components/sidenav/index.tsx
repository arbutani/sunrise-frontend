'use client'
import logoDark from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import AppMenu from '@/layouts/components/sidenav/components/AppMenu'
import Image from 'next/image'
import Link from 'next/link'
import { TbMenu4, TbX } from 'react-icons/tb'

const Sidenav = () => {
  const { sidenav, hideBackdrop, changeSideNavSize } = useLayoutContext()

  const toggleSidebar = () => {
    changeSideNavSize(sidenav.size === 'on-hover-active' ? 'on-hover' : 'on-hover-active')
  }

  const closeSidebar = () => {
    const html = document.documentElement
    html.classList.toggle('sidebar-enable')
    hideBackdrop()
  }

  return (
    <div className="sidenav-menu">
      <Link href="/mainDeshbord" className="logo">
        <span className="logo logo-light">
          <span className="logo-lg">
            <Image src={logo} alt="logo"  width={94} height={22}/>
          </span>
          <span className="logo-sm">
            <Image src={logoSm} alt="small logo" width={20} height={22}/>
          </span>
        </span>

        <span className="logo logo-dark">
          <span className="logo-lg">
            <Image src={logoDark} alt="dark logo"  width={94} height={22}/>
          </span>
          <span className="logo-sm">
            <Image src={logoSm} alt="small logo" width={20} height={22}/>
          </span>
        </span>
      </Link>

      <button className="button-on-hover">
        <TbMenu4 onClick={toggleSidebar} className="fs-22 align-middle" />
      </button>

      <button className="button-close-offcanvas">
        <TbX onClick={closeSidebar} className="align-middle" />
      </button>

      <div id="sidenav" className="scrollbar">
      
        <AppMenu />
      </div>
    </div>
  )
}

export default Sidenav
