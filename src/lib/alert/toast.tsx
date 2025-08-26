import Swal from "sweetalert2";

export const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const toastError = ((msgTitle: string) => {
  Toast.fire({
    icon: "error",
    title: msgTitle
  })
})

export const toastSuccess = ((msgTitle: string) => {
  Toast.fire({
    icon: "success",
    title: msgTitle
  })
})

export const toastWarning = ((msgTitle: string) => {
  Toast.fire({
    icon: "warning",
    title: msgTitle
  })
})

export const toastInfo = ((msgTitle: string) => {
  Toast.fire({
    icon: "info",
    title: msgTitle
  })
})