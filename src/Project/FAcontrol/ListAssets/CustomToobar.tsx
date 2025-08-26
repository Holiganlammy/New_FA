
import React from "react";
import { DataGrid, GridToolbarContainer, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Button, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { AssetRecord, DataUser, Assets_TypeGroup } from '../../../type/nacType';
import { exportToExcel } from './ExportRow';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import * as XLSX from 'xlsx';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import Swal from "sweetalert2";
import dataConfig from "../../../config";
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import client from "../../../lib/axios/interceptor";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

interface DataTable {
  rows: AssetRecord[];
  users: DataUser[]
  assets_TypeGroup: Assets_TypeGroup[]
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  fetchData: () => Promise<void>;
}

const other = {
  autoHeight: true,
  showCellVerticalBorder: true,
  showColumnVerticalBorder: true,
  rowSelection: false,
};

interface AssetDataExcel {
  Code: string;
  Name: string;
  OwnerCode: string;
  Asset_group: string;
  Group_name: string;
  BranchID: string;
  SerialNo?: string;
  Price: number;
  CreateDate: string;
  CreateBy: string;
  Position: string;
  TypeGroup: string;
}

interface ColumnField {
  field: string;
  width?: number;
  flex?: number;
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function CustomToolbar({ rows, users, assets_TypeGroup, setTimer, fetchData }: Readonly<DataTable>) {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [openXlsx, setOpenXlsx] = React.useState(false);
  const [arraySubmit, setArraySubmit] = React.useState<number>(0)
  const [nameExcel, setNameExcel] = React.useState<String>('')
  const [field, setField] = React.useState<ColumnField[]>([]);
  const [dataFile, setDataFile] = React.useState<AssetDataExcel[]>([]);
  const [syncCheck, setSyncCheck] = React.useState<boolean>(true);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const fileSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = function (e: ProgressEvent<FileReader>) {
      if (!e.target?.result) return;

      const data = new Uint8Array(e.target.result as ArrayBuffer);
      const readedData = XLSX.read(data, { type: 'array', cellText: false, cellDates: true });

      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];

      /* Convert array to JSON */
      const columnsHeader: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'dd/mm/yyyy', rawNumbers: false });
      const dataParse = XLSX.utils.sheet_to_json<AssetDataExcel>(ws, {
        range: 1,
        header: columnsHeader[0] as string[],
        raw: false,
        dateNF: 'dd/mm/yyyy',
      });

      const col = columnsHeader[0] as string[];
      const arrayField: GridColDef[] = [];

      for (let i = 0; i < col.length; i++) {
        if (col[i] === 'BranchID' || col[i] === 'Position' || col[i] === 'TypeGroup') {
          arrayField.push({
            field: col[i],
            width: 80,
          });
        } else if (col[i] === 'Code' || col[i] === 'Name' || col[i] === 'Details') {
          arrayField.push({
            field: col[i],
            width: 160,
          });
        } else if (col[i] === 'CreateDate') {
          arrayField.push({
            field: col[i],
            width: 120,
            align: 'center',
          });
        } else if (col[i] === 'OwnerCode' || col[i] === 'Asset_group' || col[i] === 'Group_name') {
          arrayField.push({
            field: col[i],
            width: 100,
          });
        } else if (col[i] === 'Price') {
          arrayField.push({
            field: col[i],
            width: 120,
            align: 'right',
            renderCell: (params) => {
              const price = params.row.Price;
              return price ? Number(price).toLocaleString('en-US') : '0';
            },
          });
        }
      }

      if (columnsHeader[0].indexOf('Code') >= 0) {
        setField(arrayField);
        setDataFile(dataParse); // `dataParse` is now of type `AssetDataExcel[]`
        setNameExcel(file.name)
        setOpenXlsx(true);
      } else {
        Swal.fire({
          icon: "error",
          title: 'ไม่พบหัวข้อรหัสทรัพย์สิน (Code !)',
          showConfirmButton: false,
          timer: 1500
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const sync_data = () => {
    setOpenXlsx(false);

    // ค้นหา Code ที่ซ้ำกัน
    const duplicateCodes = rows
      .filter(row => dataFile.some(file => file.Code === row.Code))
      .map(row => row.Code);

    const duplicateUserCode = dataFile
      .filter(file => !users.some(user => file.OwnerCode === user.UserCode))
      .map(file => file.OwnerCode);

    const duplicateBrach = dataFile
      .filter(file => !users.some(user => Number(file.BranchID) === user.BranchID))
      .map(file => file.BranchID);

    const typeFill = dataFile
      .filter(file => !assets_TypeGroup.some(type => file.TypeGroup === type.typeCode))
      .map(file => file.TypeGroup);

    Swal.fire({
      title: "Verifying Information",
      html: "It will success in <b></b> milliseconds",
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
        const popup = Swal.getPopup();
        if (popup) {
          const timer = popup.querySelector("b");
          if (timer) {
            const interval = setInterval(() => {
              const timeLeft = Swal.getTimerLeft();
              if (timeLeft !== null) {
                timer.textContent = `${timeLeft}`;
              }
            }, 100);
            popup.addEventListener("close", () => clearInterval(interval));
          }
        }
      },
    }).then(() => {
      // ตรวจสอบเงื่อนไขและกำหนดค่าการแสดงผล
      if (duplicateCodes.length > 0 || duplicateUserCode.length > 0 || duplicateBrach.length > 0 || typeFill.length > 0) {
        const duplicateDetails = `
          ${duplicateCodes.length > 0 ? `<h3>Code เหล่านี้มีอยู่แล้วในทะเบียน</h3><ul>${duplicateCodes.map(code => `- ${code}<br/>`).join('')}</ul>` : ''}
          ${duplicateUserCode.length > 0 ? `<h3>ไม่พบ OwnerCode ในระบบ</h3><ul>${duplicateUserCode.map(userCode => `- ${userCode}<br/>`).join('')}</ul>` : ''}
          ${duplicateBrach.length > 0 ? `<h3>ไม่พบ BranchID ในระบบ</h3><ul>${duplicateBrach.map(branch => `- ${branch}<br/>`).join('')}</ul>` : ''}
          ${typeFill.length > 0 ? `<h3>ไม่พบ TypeGroup ในระบบ</h3><ul>${typeFill.map(type => `- ${type}<br/>`).join('')}</ul>` : ''}
        `;

        Swal.fire({
          icon: "warning",
          title: `พบปัญหาบางอย่างในข้อมูล`,
          html: duplicateDetails,
          showConfirmButton: true,
        }).then(() => setOpenXlsx(true));
      } else {
        Swal.fire({
          icon: "success",
          title: "ยินดีด้วย ไม่พบข้อมูลซ้ำซ้อน",
          showConfirmButton: false,
          timer: 3000,
        }).then(() => {
          setSyncCheck(false)
          setOpenXlsx(true)
        }
        );
      }
    });
  };


  const handleSubmitXlsx = async () => {
    try {
      setOpenXlsx(false);
      const resTAB = await client.post(
        `/FA_Control_BPC_Running_NO`,
        parsedData,
        { headers: dataConfig().header }
      );
      const keyID = resTAB.data[0]?.TAB;
      if (!keyID) throw new Error("Failed to retrieve keyID");
      const totalItems = dataFile.length;
      for (let i = 0; i < totalItems; i++) {
        setTimer(Math.floor(((i + 1) / totalItems) * 100))
        const body = {
          ...dataFile[i],
          UserCode: parsedData.UserCode,
          keyID,
        };

        const response = await client.post(
          `/FA_Control_New_Assets_Xlsx`,
          body,
          { headers: dataConfig().header }
        );

        if (response.data[0]?.res) {
          Swal.fire({
            icon: "error",
            title: response.data[0].res,
            showConfirmButton: false,
            timer: 1500,
          });
          return;
        }
        setArraySubmit(Math.floor(((i + 1) / totalItems) * 100));
        if (i === totalItems - 1) {
          setTimer(0)
          const finalBody = { count: totalItems, keyID };
          const finalResponse = await client.post(
            `/FA_Control_import_dataXLSX_toAssets`,
            finalBody,
            { headers: dataConfig().header }
          );
          const finalResponseMsg = finalResponse.data[0]?.response;
          if (finalResponseMsg === "ทำรายการสำเร็จ") {
            fetchData();
            // Swal.fire({
            //   icon: "success",
            //   title: "ทำรายการสำเร็จ",
            //   showConfirmButton: false,
            //   timer: 1500,
            // });
          } else {
            Swal.fire({
              icon: "error",
              title: finalResponseMsg || "Error occurred",
              showConfirmButton: false,
              timer: 1500,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการประมวลผล",
        showConfirmButton: true,
      });
    }
  };



  return (
    <React.Fragment>
      <Box component="main">
        <GridToolbarContainer >
          <Button
            size="small"
            color="primary"
            startIcon={<SystemUpdateAltIcon />}
            component="label"
            disabled={rows.length === 0}
          >
            <div>Import Data</div>
            <input hidden multiple type="file" onChange={fileSelected} />
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {rows && (
            <Button size="small" color="primary" startIcon={<SystemUpdateAltIcon />}
              onClick={() => exportToExcel(rows)}
              disabled={rows.length === 0}
            >
              Export
            </Button>
          )}
        </GridToolbarContainer>
        <Divider />
      </Box>
      <BootstrapDialog
        onClose={() => {
          setOpenXlsx(false);
        }}
        aria-labelledby="customized-dialog-title"
        open={openXlsx}
        fullWidth
        maxWidth='lg'
      >
        {
          !arraySubmit ?
            <DialogTitle>
              <Typography variant="subtitle1" gutterBottom>
                ต้องการอัปโหลดไฟล์ [{nameExcel}] ไปที่ข้อมูลหลักใช่หรือไม่ ?
              </Typography>
            </DialogTitle>
            :
            <DialogTitle>
              <Typography variant="subtitle1" gutterBottom>
                กำลังอัปโหลดข้อมูล กรุณาอย่าปิดหน้าจอนี้ !!
              </Typography>
            </DialogTitle>
        }
        <DialogContent>
          <Box sx={{ height: 480, width: '100%' }}>
            <DataGrid
              columns={field}
              rows={dataFile}
              getRowId={(row) => row.Code}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              slotProps={{
                filterPanel: {
                  filterFormProps: {
                    logicOperatorInputProps: {
                      size: 'small',
                    },
                    columnInputProps: {
                      size: 'small',
                      sx: { mt: 'auto' },
                    },
                    operatorInputProps: {
                      size: 'small',
                      sx: { mt: 'auto' },
                    },
                    valueInputProps: {
                      InputComponentProps: {
                        size: 'small',
                      },
                    },
                  },
                },
              }}
              // getRowHeight={() => 'auto'}
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
              }
              sx={(theme) => ({
                '--DataGrid-overlayHeight': '300px',
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '1px solid #303030',
                  color: '#f0f0f0',
                  backgroundColor: '#303030',
                  ...theme.applyStyles('light', {
                    borderRightColor: '#f0f0f0',
                  }),
                },
                '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                },
              })}
              density="compact"
              {...other}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" sx={{ textTransform: 'none', }} onClick={sync_data}>Sync Data</Button>
            <Button variant="outlined" sx={{ textTransform: 'none', }} color="success" onClick={handleSubmitXlsx} disabled={syncCheck}>Upload Data</Button>
            <Button variant="outlined" sx={{ textTransform: 'none', }} color="error" onClick={() => setOpenXlsx(false)}>Cancel</Button>
          </Stack>
        </DialogActions>
      </BootstrapDialog>
    </React.Fragment>
  );
}