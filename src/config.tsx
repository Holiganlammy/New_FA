// // const httpPTEC = 'http://10.15.100.227:32001/api' //main
// // const httpCloud = '/api'
// const httpLocal = 'http://localhost:32001/api'

// interface DataConfig {
//   http: string;
//   httpViewFile: string;
//   headers: {
//     [key: string]: string;
//   };
//   headerUploadFile: {
//     [key: string]: string;
//   };
// }

// export const dataConfig: DataConfig = {
//   headers: {
//     'Content-Type': `application/json; charset=utf-8`,
//     'Accept': 'application/json'
//   },
//   headerUploadFile: {
//     'Content-Type': `multipart/form-data`,
//     'Accept': 'application/json'
//   },
//   http: httpLocal,
//   httpViewFile: `http://localhost:33080`
// }

const http = "http://localhost:32001/api";
const httpViewFile = `http://localhost:33080`;

function dataConfig(access_token?: string) {
  const headerDetail = access_token ? `Bearer ${access_token}` : null;

  return {
    header: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': headerDetail,
      'Accept': 'application/json',
    },
    headerUploadFile: {
      'Content-Type': 'multipart/form-data',
      'Authorization': headerDetail,
      'Accept': 'application/json'
    },
    http: http,
    httpViewFile: httpViewFile
  };
}

export default dataConfig;
