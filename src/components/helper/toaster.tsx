import { ToastContainer } from "react-bootstrap";
import ToasterMessage from "./toasterMessge";

const Toaster = (params: any) => {
    const { toasts, addToast, removeToast } = params;
  
    return (
      <ToastContainer className="position-fixed top-0 end-0 p-3">
        {toasts.map((toast: any) => (
          <ToasterMessage
            key={toast.id}
            toastClass={toast.toastClass}
            message={toast.message}
            buttonClass={toast.buttonClass}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    );
}

export default Toaster;