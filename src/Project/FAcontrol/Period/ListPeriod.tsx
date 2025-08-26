import { GridActionsCellItem, GridCellParams, GridColDef, GridRenderCellParams } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { Period } from '../../../type/nacType';
import { Typography, AppBar, Container, Toolbar, TextField, Dialog, styled, Button, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, CssBaseline, Card } from "@mui/material";
import Swal from "sweetalert2";
import DeleteIcon from '@mui/icons-material/Delete';
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import { LocalizationProvider, DateTimePicker, renderDigitalClockTimeView, } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid2';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import client from "../../../lib/axios/interceptor";


dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function ListNacPage() {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<Period[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [openDialogEdit, setOpenDialogEdit] = React.useState(false);
  const [rowEdit, setRowEdit] = React.useState<Partial<Period>>({});

  const handleClickOpen = (params: Period) => {
    setOpenDialogEdit(true);
    setRowEdit(params);  // เก็บข้อมูล row ที่ถูกเลือก
  };

  const handleClose = () => {
    setOpenDialogEdit(false);
  }

  const handleCloseSaved = async () => {
    setOpenDialogEdit(false);
    try {
      const response = await client.post(
        `/update_period`,
        rowEdit,
        { headers: dataConfig().header }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "อัปเดตรายการสำเร็จ",
          showConfirmButton: false,
          timer: 1500
        }).then(() => fetchData())
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      Swal.fire({
        icon: "success",
        title: `อัปเดตรายการสำเร็จ`,
        showConfirmButton: false,
        timer: 1500
      });
      setOpenDialogEdit(true);
    }
  };

  const columns: GridColDef[] = [
    { field: 'PeriodID', headerName: 'Period ID', width: 100, headerAlign: 'center', align: 'center', },
    { field: 'Description', headerName: 'Title', flex: 1, headerAlign: 'left', align: 'left', },
    {
      field: 'BeginDate', headerName: 'วันที่เริ่มต้น', width: 230, headerAlign: 'center', align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <span>
            {dayjs(new Date(params.row.BeginDate)).format('DD/MM/YYYY HH:mm')}
          </span>
        );
      },
    },
    {
      field: 'EndDate', headerName: 'วันที่สิ้นสุด', width: 230, headerAlign: 'center', align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <span>
            {dayjs(new Date(params.row.EndDate)).format('DD/MM/YYYY HH:mm')}
          </span>
        );
      },
    },
    {
      field: 'BranchID', headerName: 'หน่วยงาน', width: 100, headerAlign: 'center', align: 'center',
      renderCell: (params) => params.row.BranchID === 901 ? "HO" : "CO",
    },
    {
      field: 'personID', headerName: 'Location NAC', width: 150, headerAlign: 'center', align: 'center',
      renderCell: (params) => {
        const { BranchID, personID, DepCode, Code } = params.row;
        if (BranchID === 901) {
          if (personID && DepCode) {
            return personID;
          } else if (DepCode && !personID) {
            return DepCode;
          }
        }
        if (BranchID !== 901 && !DepCode && !personID) {
          return Code;
        }
        return '';
      },
    },
    {
      field: 'status',
      headerName: 'สถานะ',
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const isClosed = dayjs(params.row.EndDate).isBefore(dayjs());
        const statusText = isClosed ? 'ปิดการใช้งานแล้ว' : 'เปิดการใช้งาน';
        const statusColor = isClosed ? 'red' : 'green';
        return (
          <span style={{ color: statusColor }}>
            {statusText}
          </span>
        );
      },
    },
    {
      field: 'Actions', type: 'actions', headerName: 'actions', width: 150, headerAlign: 'center', align: 'center',
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<SaveAsIcon />}
            label="Edit Row"
            onClick={() => handleClickOpen(params.row)}
            color="warning"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => delete_period(params.row)}
            color="error"
          />,
        ];
      },

    },
  ];

  const fetchData = React.useCallback(async () => {
    try {
      const response = await client.post(
        `/FA_Control_Fetch_Branch_Period`,
        { usercode: parsedData.UserCode },
        { headers: dataConfig().header }
      );

      if (response.status === 200) {
        setRows(response.data.data);
        setLoading(false)
      } else {
        setRows([]);
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [parsedData.UserCode]);

  const delete_period = async (params: Period) => {
    Swal.fire({
      title: "Do you want to delete this peroid?",
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: `Yes`
    }).then(async (result) => {
      if (result.isConfirmed) {
        await client.post(
          `/delete_period`,
          { PeriodID: params?.PeriodID },
          { headers: dataConfig().header }
        ).then(() => fetchData());
      }
    });
  }

  React.useEffect(() => {
    setLoading(true)
    setRows([]);
    // Fetch NAC data and filter data from localStorage
    fetchData();
  }, [fetchData]);

  return (
    <React.Fragment>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          position: 'relative',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Toolbar>
          <Typography variant="subtitle1" color="inherit">
            รายการรอบตรวจนับทั้งหมด
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline enableColorScheme />
      <Container
        component="main"
        sx={{
          my: 2,
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        }}
        maxWidth="xl"
      >
        <Card variant="outlined">
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            isCellEditable={function (params: GridCellParams): boolean {
              throw new Error("Function not implemented.");
            }}
          />
        </Card>
        <Outlet />
      </Container>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={openDialogEdit}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          การแก้ไข Period (#{rowEdit?.PeriodID})
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  name='txtCreateDate'
                  format="DD/MM/YYYY HH:mm"
                  views={['year', 'month', 'day', 'hours']}
                  value={rowEdit?.BeginDate ? dayjs(rowEdit.BeginDate) : null}
                  viewRenderers={{
                    hours: renderDigitalClockTimeView,
                    seconds: null,
                  }}
                  onChange={(newValue) => {
                    if (rowEdit) {
                      const updatedRow =
                      {
                        ...rowEdit,
                        PeriodID: rowEdit?.PeriodID,
                        BeginDate: newValue ? dayjs(newValue.toDate()) : dayjs.tz(new Date(), "Asia/Bangkok"),
                      }
                      setRowEdit(updatedRow)
                    }
                  }}
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      sx: {
                        width: '100%',
                        '& .MuiInputBase-root': {
                          height: '40px', // Adjust height to match small size
                        },
                        '& .MuiInputBase-input': {
                          padding: '8.5px 14px', // Adjust padding to match small size
                        },
                      },
                      inputProps: {
                        placeholder: 'วันที่เริ่มต้น', // Set placeholder here
                      },
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="subtitle1">
                              วันที่เริ่มต้น :
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                  ampm={false}
                />
              </LocalizationProvider>
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  name='txtCreateDate'
                  format="DD/MM/YYYY HH:mm"
                  views={['year', 'month', 'day', 'hours']}
                  value={rowEdit?.EndDate ? dayjs(rowEdit.EndDate) : null}
                  viewRenderers={{
                    hours: renderDigitalClockTimeView,
                    seconds: null,
                  }}
                  onChange={(newValue) => {
                    if (rowEdit) {
                      const updatedRow =
                      {
                        ...rowEdit,
                        PeriodID: rowEdit?.PeriodID,
                        EndDate: newValue ? dayjs(newValue.toDate()) : dayjs.tz(new Date(), "Asia/Bangkok"),
                      }
                      setRowEdit(updatedRow)
                    }
                  }}
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      sx: {
                        width: '100%',
                        '& .MuiInputBase-root': {
                          height: '40px', // Adjust height to match small size
                        },
                        '& .MuiInputBase-input': {
                          padding: '8.5px 14px', // Adjust padding to match small size
                        },
                      },
                      inputProps: {
                        placeholder: 'วันที่เริ่มต้น', // Set placeholder here
                      },
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="subtitle1">
                              วันที่สิ้นสุด :
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                  ampm={false}
                />
              </LocalizationProvider>
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                placeholder="Placeholder"
                size="small"
                multiline
                fullWidth
                rows={4}
                value={rowEdit?.Description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      PeriodID: rowEdit?.PeriodID,
                      Description: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus color="success" onClick={handleCloseSaved}>
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </React.Fragment>
  );
}