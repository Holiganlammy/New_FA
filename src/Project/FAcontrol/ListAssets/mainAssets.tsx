import { GridActionsCellItem, GridCellParams, GridColDef } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { AssetRecord, UpdateDtlAssetParams, DataUser, Assets_TypeGroup } from '../../../type/nacType';
import { Typography, AppBar, Container, Toolbar, Autocomplete, TextField, Box, Dialog, styled, Button, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Card, Tab, Tabs, Backdrop, CircularProgress, CircularProgressProps, Stack } from "@mui/material";
import Swal from "sweetalert2";
import CloseIcon from '@mui/icons-material/Close';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid2';
import client from "../../../lib/axios/interceptor";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} color="inherit" />
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
          sx={{ color: 'white' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function ListNacPage() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [originalRows, setOriginalRows] = React.useState<AssetRecord[]>([]);
  const [rows, setRows] = React.useState<AssetRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [openDialogEdit, setOpenDialogEdit] = React.useState(false);
  const [rowEdit, setRowEdit] = React.useState<Partial<UpdateDtlAssetParams>>({});
  const [users, setUsers] = React.useState<DataUser[]>([]);
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);
  const [timer, setTimer] = React.useState<number>(0);


  const handleClickOpen = (params: AssetRecord) => {
    const updatedRow = {
      Code: params.Code ?? '',
      Name: params.Name ?? '',
      Asset_group: params.Asset_group ?? '',
      Group_name: params.Group_name ?? '',
      BranchID: typeof params.BranchID === 'string' || typeof params.BranchID === 'number' ? params.BranchID : '',
      OwnerCode: params.OwnerID ?? '',
      Details: params.Details ?? '',
      SerialNo: params.SerialNo ?? '',
      Price: typeof params.Price === 'string' || typeof params.Price === 'number' ? params.Price : '',
      ImagePath: typeof params.ImagePath === 'string' || typeof params.ImagePath === 'number' ? params.ImagePath : '',
      ImagePath_2: typeof params.ImagePath === 'string' || typeof params.ImagePath === 'number' ? params.ImagePath : '',
      Position: params.Position ?? '',
      UserCode: typeof parsedData.UserCode === 'string' ? parsedData.UserCode : '', // Ensure UserCode is a string
    };

    setRowEdit(updatedRow as Partial<UpdateDtlAssetParams>);  // Cast updatedRow to Partial<UpdateDtlAssetParams>
    setOpenDialogEdit(true);
  };

  const handleClose = () => {
    setOpenDialogEdit(false);
  }

  const handleCloseSaved = async () => {
    setOpenDialogEdit(false);
    const index = rows.findIndex((row) => row.Code === rowEdit.Code);
    const list = [...rows]
    list[index] = {
      ...list[index],
      Name: rowEdit.Name,
      SerialNo: rowEdit.SerialNo,
      Asset_group: rowEdit.Asset_group,
      Group_name: rowEdit.Group_name,
      OwnerID: rowEdit.OwnerCode,
      Position: rowEdit.Position,
      Details: rowEdit.Details,
      ImagePath: rowEdit.ImagePath,
      ImagePath_2: rowEdit.ImagePath_2,
    };
    setRows(list);
    try {
      const response = await client.post(
        `/UpdateDtlAsset`,
        rowEdit,
        { headers: dataConfig().header }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "อัปเดตรายการสำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
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
    }
  };

  // State สำหรับการกรองแต่ละฟิลด์
  const [filterRows, setFilterRows] = React.useState<Partial<AssetRecord>>({
    Code: undefined,
    Name: undefined,
    OwnerID: undefined,
    Asset_group: undefined,
    Group_name: undefined,
    Position: undefined,
  });

  const handleChangeFilterNAC = (newValue: string | number | undefined, id: string) => {
    setFilterRows(prevFilter => {
      const updatedFilter = { ...prevFilter, [id]: newValue };

      const filteredRows = originalRows.filter(res =>
        Object.entries(updatedFilter).every(([key, value]) =>
          value === undefined || value === null || res[key as keyof AssetRecord] === value
        )
      );

      const filterType = filteredRows.filter(res => res.typeCode === assets_TypeGroupSelect)
      setRows(filterType); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
      return updatedFilter;
    });
  };

  const columns: GridColDef[] = [
    { field: 'Code', headerName: 'รหัสทรัพย์สิน', width: 140, headerAlign: 'center', align: 'center', },
    { field: 'Name', headerName: 'ชื่อทรัพย์สิน', width: 250, headerAlign: 'center' },
    { field: 'SerialNo', headerName: 'SerialNo', headerAlign: 'center', width: 140, },
    { field: 'OwnerID', headerName: 'ผู้ถือครอง', width: 100, headerAlign: 'center', align: 'center', },
    { field: 'Position', headerName: 'Location NAC', width: 140, headerAlign: 'center', align: 'center', },
    { field: 'Asset_group', headerName: 'Asset Group', headerAlign: 'center', align: 'center', width: 140, },
    { field: 'Group_name', headerName: 'Group Name', headerAlign: 'center', align: 'left', width: 140, },
    { field: 'Details', headerName: 'รายละเอียด', headerAlign: 'center', flex: 1, },
    {
      field: 'Price', headerName: 'ราคาทุน', width: 120, headerAlign: 'center', align: 'right',
      renderCell: (params) => params.row.Price ? params.row.Price.toLocaleString('en-US') : 0,
    },
    {
      field: 'CreateDate', headerName: 'วันที่ขึ้นทะเบียน', width: 120, headerAlign: 'center', align: 'center',
      renderCell: (params) => dayjs(new Date(params.row.CreateDate)).format('DD/MM/YYYY'),
    },
    {
      field: 'Actions', type: 'actions', headerName: 'actions', width: 80, headerAlign: 'center', align: 'center',
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<SaveAsIcon />}
            label="Edit Row"
            disabled={!permission_menuID.includes(5)}
            onClick={() => handleClickOpen(params.row)}
            color="warning"
          />,
        ];
      },

    },
  ];

  const fetchData = async () => {
    setRows([]);
    setLoading(true)
    try {
      // Permission
      await client.post('/select_Permission_Menu_NAC', { Permission_TypeID: 1, userID: parsedData.userid }, { headers: dataConfig().header })
        .then(async responsePermission => {
          setPermission_menuID(responsePermission.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))
          // แสดง users ทั้งหมด
          await client.get('/User_List', { headers: dataConfig().header })
            .then((res) => {
              setUsers(res.data)
            })

          const resFetchAssets = await client.get('/FA_Control_Assets_TypeGroup', { headers: dataConfig().header })
          const resData: Assets_TypeGroup[] = resFetchAssets.data
          setAssets_TypeGroup(resData)
          setAssets_TypeGroupSelect(resData[0].typeCode)

          const response = await client.post(
            `/FA_Control_Fetch_Assets`,
            { usercode: parsedData.UserCode },
            { headers: dataConfig().header }
          );
          if (response.status === 200) {
            const permis = responsePermission.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID)
            const dataLog = permis.includes(5)
              ? response.data.filter((res: AssetRecord) => res.typeCode === resData[0].typeCode)
              : response.data.filter((res: AssetRecord) => res.typeCode === resData[0].typeCode && res.OwnerID === parsedData.UserCode)
            setLoading(false)
            setRows(dataLog);
            setOriginalRows(response.data)
            setTimer(0)
          } else {
            setLoading(false)
            setRows([]);
          }
        });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  React.useEffect(() => {
    setLoading(true)
    fetchData();
  }, [parsedData.UserCode, parsedData.userid]);

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
            ทะเบียนทรัพย์สินทั้งหมด
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ my: 2 }} maxWidth="xl">
        <Grid container spacing={2} sx={{ py: 1 }}>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Code || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Code')}
              options={rows ? Array.from(new Set(rows.map(res => res.Code).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Code" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Name || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Name')}
              options={rows ? Array.from(new Set(rows.map(res => res.Name).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Name" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.OwnerID || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'OwnerID')}
              options={rows ? Array.from(new Set(rows.map(res => res.OwnerID).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="OwnerCode" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Asset_group || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Asset_group')}
              options={rows ? Array.from(new Set(rows.map(res => res.Asset_group).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Asset_group" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Group_name || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Group_name')}
              options={rows ? Array.from(new Set(rows.map(res => res.Group_name).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Group_name" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Position || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Position')}
              options={rows ? Array.from(new Set(rows.map(res => res.Position).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Location" />}
            />
          </Grid>
        </Grid>
        <Grid justifyContent="flex-start" size={12} sx={{ mt: 2 }}>
          <Tabs
            // originalRows
            value={assets_TypeGroupSelect}
            onChange={(event: React.SyntheticEvent, newValue: string) => {
              const filter = { ...filterRows }
              const filteredRows = originalRows.filter(res =>
                Object.entries(filter).every(([key, value]) =>
                  value === undefined || value === null || res[key as keyof AssetRecord] === value
                )
              )
              const typeFil =
                permission_menuID.includes(5) ? filteredRows.filter(res => res.typeCode === newValue) :
                  filteredRows.filter(res => res.typeCode === newValue && res.OwnerID === parsedData.UserCode)
              setRows(typeFil); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
              setAssets_TypeGroupSelect(newValue);
            }}
          >
            {assets_TypeGroup.map((res) => (
              <Tab
                label={`${res.typeCode} (${res.typeName})`}
                value={res.typeCode}
                key={res.typeGroupID}
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Grid>
        <Grid justifyContent="center" alignItems="center" size={12}>
          <Card variant="outlined">
            <DataTable
              rows={rows}
              columns={columns}
              loading={loading}
              users={users}
              assets_TypeGroup={assets_TypeGroup}
              setTimer={setTimer}
              fetchData={fetchData}
              isCellEditable={function (params: GridCellParams): boolean {
                throw new Error("Function not implemented.");
              }}
            />
          </Card>
        </Grid>
        <Outlet />
      </Container>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={openDialogEdit}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          รหัสทรัพย์สิน {rowEdit?.Code}
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
              <TextField
                id="outlined-textarea"
                size="small"
                multiline
                fullWidth
                value={rowEdit?.Name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      Name: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="subtitle1">
                          Nmae :
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                size="small"
                multiline
                fullWidth
                value={rowEdit?.SerialNo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      SerialNo: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="subtitle1">
                          SerialNo :
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                size="small"
                multiline
                fullWidth
                value={rowEdit?.Asset_group}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      Asset_group: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="subtitle1">
                          Asset group :
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                size="small"
                multiline
                fullWidth
                value={rowEdit?.Group_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      Group_name: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="subtitle1">
                          Group name :
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <Autocomplete
                freeSolo
                id="free-solo-2-demo"
                options={users.map((option) => option.UserCode)}
                sx={{ width: '100%' }}
                onChange={(e, newValue) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      OwnerCode: newValue,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                value={String(rowEdit?.OwnerCode) || ''}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body1">
                              ผู้ถือครอง :
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                size="small"
                multiline
                fullWidth
                value={rowEdit?.Position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      Position: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="subtitle1">
                          Position :
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <TextField
                id="outlined-textarea"
                placeholder="Details"
                size="small"
                multiline
                fullWidth
                rows={4}
                value={rowEdit?.Details}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (rowEdit) {
                    const updatedRow =
                    {
                      ...rowEdit,
                      Code: rowEdit?.Code,
                      Details: e.target.value,
                    }
                    setRowEdit(updatedRow)
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus color="success"
            onClick={handleCloseSaved}
          >
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={timer > 0}
      >
        <Stack direction="row" spacing={3}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Loading is complete in...
          </Typography>
          <CircularProgressWithLabel value={timer} />
        </Stack>
      </Backdrop>
    </React.Fragment >
  );
}