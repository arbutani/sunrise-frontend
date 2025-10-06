'use client'
import { useLayoutContext } from '@/context/useLayoutContext'
import UserProfile from '@/layouts/components/topbar/components/UserProfile'
import Image from 'next/image'
import { Container } from 'react-bootstrap'
import { TbMenu4 } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

import logoDark from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'

const Topbar = () => {
  const { sidenav, changeSideNavSize, showBackdrop } = useLayoutContext()
  const router = useRouter()

  const toggleSideNav = () => {
    const html = document.documentElement
    const currentSize = html.getAttribute('data-sidenav-size')

    if (currentSize === 'offcanvas') {
      html.classList.toggle('sidebar-enable')
      showBackdrop()
    } else if (sidenav.size === 'compact') {
      changeSideNavSize(currentSize === 'compact' ? 'condensed' : 'compact', false)
    } else {
      changeSideNavSize(currentSize === 'condensed' ? 'default' : 'condensed')
    }
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Logo clicked → Navigating to /mainDashboard')
    router.push('/mainDashboard')
  }

  return (
    <header className="app-topbar">
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <a href="#" onClick={handleLogoClick} className="logo-light">
              <span className="logo-lg">
                <Image src={logo.src} alt="logo" width={94.3} height={22} />
              </span>
              <span className="logo-sm">
                <Image src={logoSm.src} alt="small logo" width={30.55} height={26} />
              </span>
            </a>

            <a href="#" onClick={handleLogoClick} className="logo-dark">
              <span className="logo-lg">
                <Image src={logoDark.src} alt="dark logo" width={94.3} height={22} />
              </span>
              <span className="logo-sm">
                <Image src={logoSm.src} alt="small logo" width={30.55} height={26} />
              </span>
            </a>
          </div>

          <button
            onClick={toggleSideNav}
            className="sidenav-toggle-button btn btn-default btn-icon"
          >
            <TbMenu4 className="fs-22" />
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <UserProfile />
        </div>
      </Container>
    </header>
  )
}

export default Topbar
