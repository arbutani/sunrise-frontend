import { removeUserData } from "./useUserLocalStorage";

const HandleError = (
    error: any,
    router: any
) => {
    if (
        error.response?.status === 401 ||
        error?.response?.data?.message === "Unauthorized"
    ) {
        removeUserData();
        router.replace("/");
        return "Unauthorized access, please login again";
    }
    // 404 error
    else if (error.response?.status === 404) {
        return error.response.data.message;
    } else if (error.response) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
            let errorMessage = "";
            message.map((item: any) => {
                errorMessage += item?.message + " ";
            });
            return errorMessage;
        } else {
            return message;
        }
    } else if (error.request) {
        return "Network error, please check your internet connection"
    } else {
        return "An unexpected error occurred, please try again later";
    }
    return error;
};

export {
    HandleError
}
