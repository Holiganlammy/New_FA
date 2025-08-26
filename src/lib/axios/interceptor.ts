import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
// import { getSession, signOut, useSession } from "next-auth/react";
import { Toast } from "../alert/toast";


const http = "http://localhost:32001/api";

export const error401 = () => {
    localStorage.clear();
    window.location.href = '/';
    window.location.reload();
}
export const error403 = () => {
  window.location.href = 'https://localhost:3000/home'
}


function handleError(err: any) {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 400) {
      // Safe access to nested properties with fallbacks
      const errorData = err.response.data;
      const message = errorData?.message || "Bad Request";
      
      // Handle error details safely
      let errorText = "Something went wrong.";
      if (errorData?.error) {
        const code = errorData.error.code || "ERROR";
        const path = errorData.error.path?.[0] || "unknown_field";
        errorText = `${code} : ${path}`;
      }

      Toast.fire({
        icon: "error",
        title: message,
        text: errorText
      });
    }
    else if (err.response?.status === 401) {
      error401();
    }
    else if (err.response?.status === 500) {
      Toast.fire({
        icon: "error",
        title: "Server Error",
        text: "Internal server error occurred. Please try again later."
      });
    }
    else if (err.response?.status) {
      // Handle other HTTP error codes
      Toast.fire({
        icon: "error", 
        title: `Error ${err.response.status}`,
        text: err.response.data?.message || "An error occurred"
      });
    }
    else {
      // Network error or no response
      Toast.fire({
        icon: "error",
        title: "Network Error",
        text: "Please check your internet connection and try again."
      });
    }
  } else {
    // Non-axios errors
    console.error("Non-axios error:", err);
    Toast.fire({
      icon: "error",
      title: "Unexpected Error", 
      text: "Something went wrong. Please try again."
    });
  }
}

const CancelToken = axios.CancelToken
const source = CancelToken.source()

// Configuration object for Axios
const baseConfig: AxiosRequestConfig = {
  baseURL: http,
  cancelToken: source.token,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
};

// Function to handle the request before it is sent
const baseRequest = async (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const baseResponse = (response: AxiosResponse) => {
  // console.groupCollapsed(`response: ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`);
  // console.groupCollapsed(`response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
  // console.log(response);
  // console.groupEnd();

  return response;
}
let client = axios.create(baseConfig);
client.interceptors.request.use(baseRequest, (error: any) => {

  handleError(error);
  //return error;
  return Promise.reject(error);
});

client.interceptors.response.use(baseResponse, (error: any) => {

  handleError(error);
  //return error;
  return Promise.reject(error);
});

export default client;
