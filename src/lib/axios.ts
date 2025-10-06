import axios from "axios";
// Add force logout on 403
const axiosPrepare = axios.create({
  baseURL:
    process.env.NEXT_API_LOCAL_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    // "Content-Type": "multipart/form-data",
  },
  withCredentials: true,
});

// axiosPrepare.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.data && error.response.data.status === 403) {
//       try {
//         localStorage.removeItem('user');
//       } catch (e) { }
//       window.location.href = '/';
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosPrepare;
