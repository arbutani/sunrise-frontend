'use client'
import useToggle from '@/hooks/useToggle'
import { useEffect } from 'react'
import { Button, Toast, ToastBody, ToastContainer } from 'react-bootstrap'

const ToasterMessage = (params: any) => {
  const { message, toastClass, buttonClass, delay, onClose } = params
  const { isTrue: isOpenCustom1, setFalse: hideCustom1 } = useToggle(true)

  return (
    <Toast
      show={isOpenCustom1}
      onClose={() => {
        onClose()
        hideCustom1()
      }}
      delay={delay != null ? delay : 3000}
      autohide
      className={` align-items-center text-white ${toastClass != null && toastClass != '' ? toastClass : 'bg-danger'} border-0 mb-1`}>
      <div className="d-flex">
        <ToastBody>{message}</ToastBody>
        <Button
          onClick={hideCustom1}
          className={` btn-close ${buttonClass != null && buttonClass != '' ? buttonClass : 'btn-danger'} me-2 m-auto`}
          data-bs-dismiss="toast"
          aria-label="Close"
        />
      </div>
    </Toast>
  )
}

export default ToasterMessage
