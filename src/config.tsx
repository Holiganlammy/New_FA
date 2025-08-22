// const httpPTEC = 'http://10.15.100.227:32001/api' //main
const httpCloud = '/api'
const httpLocal = 'http://localhost:32001/api'

interface DataConfig {
  http: string;
  httpViewFile: string;
  headers: {
    [key: string]: string;
  };
  headerUploadFile: {
    [key: string]: string;
  };
}

export const dataConfig: DataConfig = {
  headers: {
    'Content-Type': `application/json; charset=utf-8`,
    'Accept': 'application/json'
  },
  headerUploadFile: {
    'Content-Type': `multipart/form-data`,
    'Accept': 'application/json'
  },
  http: httpCloud,
  httpViewFile: `http://localhost:33080`
}