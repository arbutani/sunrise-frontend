'use client'
import Loader from '@/components/Loader'
import { useLayoutContext } from '@/context/useLayoutContext'
import VerticalLayout from '@/layouts/VerticalLayout'
import { ChildrenType } from '@/types'
import { Fragment, useEffect, useState } from 'react'

const MainLayout = ({ children }: ChildrenType) => {
  const { orientation } = useLayoutContext()

  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return <Loader height="100vh" />

  return (
    <Fragment>
    <VerticalLayout>{children}</VerticalLayout>
    </Fragment>
  )
}

export default MainLayout
