import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { Alert, Autocomplete, Avatar, Button, CardHeader, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, ListItem, ListItemAvatar, ListItemText, Stack, styled, TextField } from '@mui/material';
import { Branch, DataUser, Department, UserSaved } from '../type/nacType';
import Swal from 'sweetalert2';
import dataConfig from '../config';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { GridColDef, GridActionsCellItem, GridCellParams, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import DataTable from "./DataTable"
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import CloseIcon from '@mui/icons-material/Close';
import DoneOutlineOutlinedIcon from '@mui/icons-material/DoneOutlineOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import client from '../lib/axios/interceptor';

const ValidationTextField = styled(TextField)(({ theme }) => ({
  width: '100%', // แทน fullWidth
  backgroundColor: 'rgb(248, 250, 252)', // แทน bgcolor
}));

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function Profile() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [users, setUsers] = React.useState<DataUser[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [search, setSearch] = React.useState<string>('');
  const [filteredRows, setFilteredRows] = React.useState<DataUser[]>([]);
  const [openAdd, setOpenAdd] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [department, setDepartment] = React.useState<Department[]>([]);
  const [userSaved, setUserSaved] = React.useState<UserSaved>({
    firstName: '',
    lastName: '',
    loginName: '',
    branchId: null,
    department: '',
    secId: '',
    positionId: '',
    empUpper: '',
    email: '',
    actived: true,
    password: ''
  })

  const User_Save = async () => {
    try {
      const res = await client.post('/User_Save', userSaved, { headers: dataConfig().header })
      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: `ทำรายการสำเร็จ`,
          showConfirmButton: false,
          timer: 1500
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  const fetuser = async () => {
    await client.get('/User_List', { headers: dataConfig().header })
      .then((res) => {
        setUsers(res.data)
        setFilteredRows(res.data)
        setLoading(false)
      })

    // Fetch department list
    await client.post('/Department_List', { branchid: parsedData.branchid }, { headers: dataConfig().header })
      .then((response) => {
        const newArray = response.data.data.filter((dep: { depid: number; }) => dep.depid > 14);
        setDepartment(newArray);
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
      });
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearch(value);

    // กรองข้อมูลตามชื่อหรือรหัสผู้ใช้
    const filtered = users.filter(
      (row) =>
        row.Name?.toLowerCase().includes(value) ||
        row.UserCode.toLowerCase().includes(value) ||
        row.DepCode.toLowerCase().includes(value) ||
        row.Position?.toLowerCase().includes(value) ||
        row.PositionCode?.toLowerCase().includes(value)
    );

    setFilteredRows(filtered.length === 0 ? users : filtered);
  };

  const handleChangeActive = async (params: GridRowParams<DataUser>) => {
    try {
      const response = await client.post(
        '/User_active',
        {
          userid: params.row.UserID,
          active: !params.row.Actived,
        },
        { headers: dataConfig().header }
      );
      // อัปเดตสถานะของผู้ใช้ใน state
      setUsers((prevUsers) =>
        prevUsers.map((row) =>
          row.UserID === params.row.UserID
            ? { ...row, Actived: !params.row.Actived }
            : { ...row }
        )
      );

      setFilteredRows((prevFiltered) =>
        prevFiltered.map((row) =>
          row.UserID === params.row.UserID
            ? { ...row, Actived: !params.row.Actived }
            : { ...row }
        )
      );
    } catch (error) {
      console.error("Error updating user active status:", error);
    }
  };


  const handleEditCell = (params: GridRowParams) => {
    const updatedRow = {
      firstName: params.row.fristName,
      lastName: params.row.lastName,
      loginName: params.row.UserCode,
      branchId: params.row.BranchID,
      department: params.row.DepCode,
      secId: params.row.seccode,
      positionId: params.row.Position,
      empUpper: params.row.EmpUpper,
      email: params.row.Email,
      actived: params.row.Actived,
      password: params.row.password
    };
    setUserSaved(updatedRow)
    setOpenAdd(true)
  };

  React.useEffect(() => {
    fetuser()
  }, [])

  const columns: GridColDef[] = [
    {
      field: 'UserID',
      headerName: '#',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => users.findIndex((row) => row.UserID === params.row.UserID) + 1,
    },
    {
      field: 'UserCode',
      headerName: 'User Profile',
      minWidth: 300,
      flex: 1,
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <ListItem alignItems="flex-start" disablePadding>
            <ListItemAvatar>
              <Avatar alt={params.row.UserCode} src={params.row.img_profile || ''} />
            </ListItemAvatar>
            <ListItemText
              primary={`${params.row.fristName} ${params.row.lastName} (${params.row.UserCode})`}
              secondary={
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'inline' }}
                >
                  {params.row.Email?.toLowerCase()}
                </Typography>
              }
            />
          </ListItem>
        )
      },
    },
    {
      field: 'Position',
      headerName: 'ตำแหน่ง',
      minWidth: 200,
      renderCell: (params) => `${params.row.Position} (${params.row.PositionCode})`
    },
    {
      field: 'DepCode',
      headerName: 'DEP/BRNACH',
      minWidth: 150,
      renderCell: (params) => {
        return (
          `${params.row.BranchID === 901 ? `(HO) ${params.row.DepCode}` : `(CO) สาขาที่: ${params.row.BranchID}`}`
        )
      }
    },
    {
      field: 'Actived',
      headerName: 'Staus',
      minWidth: 150,
      renderCell: (params) => {
        return (
          <Chip
            label={params.row.Actived ? 'Active' : 'UnActive'}
            // color={params.row.Actived ? 'success' : 'error'}
            sx={{
              color: params.row.Actived ? 'rgb(0, 200, 83)' : 'rgb(216, 67, 21)',
              bgcolor: params.row.Actived ? 'rgba(0, 200, 83,0.2)' : 'rgba(216, 67, 21,0.2)'

            }}
          />
        )
      }
    },
    {
      field: 'Actions', type: 'actions', headerName: 'actions', width: 120, headerAlign: 'center', align: 'center',
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<EditNoteOutlinedIcon />}
            label="saved"
            color="primary"
            onClick={() => handleEditCell(params)}
          />,
          <GridActionsCellItem
            icon={params.row.Actived === true ? <BlockOutlinedIcon /> : <DoneOutlineOutlinedIcon />}
            label={params.row.Actived === true ? "unactive" : "active"}
            color={params.row.Actived === true ? "error" : "success"}
            onClick={() => handleChangeActive(params)}
          />,
        ];
      },

    },
  ];


  return (
    <React.Fragment>
      <Card
        variant='outlined'
        sx={{
          width: '100%',
          maxWidth: '100vw', // จำกัดความกว้างให้พอดีกับหน้าจอ
        }}
      >
        <CardHeader
          subheader={
            <React.Fragment>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: '15px',
                  maxHeight: '15px'
                }}
              >
                <Stack>
                  <Button
                    variant="text"
                    endIcon={<PersonAddAlt1OutlinedIcon />}
                    size="small"
                    sx={{ textTransform: 'none' }}
                    onClick={() => {
                      setOpenAdd(true)
                      setUserSaved({
                        firstName: '',
                        lastName: '',
                        loginName: '',
                        branchId: null,
                        department: '',
                        secId: '',
                        positionId: '',
                        empUpper: '',
                        email: '',
                        actived: true,
                        password: ''
                      })
                    }}
                  >
                    Add
                  </Button>
                </Stack>
                <Stack>
                  <ValidationTextField
                    size="small" sx={{ backgroundColor: 'rgb(248, 250, 252)' }}
                    value={search}
                    onChange={handleSearchChange}
                    slotProps={{
                      input: {
                        startAdornment: <SearchOutlinedIcon />,
                      },
                    }}
                    placeholder="Search" />
                </Stack>
              </Stack>
            </React.Fragment>
          }
        />
        <Divider />
        {/* <Alert severity="warning" sx={{ mx: { xs: 2, md: 3 }, overflow: 'hidden', my: { xs: 1, md: 2 } }}>
          *หมายเหตุ MD (กรรมการผู้จัดการ){'>'}FM (ผู้จัดการสายงาน){'>'}DM (ผู้จัดการฝ่าย){'>'}SM (ผู้จัดการแผนก){'>'}SN (เจ้าหน้าที่อาวุโส){'>'}ST (เจ้าหน้าที่ทั่วไป)
        </Alert> */}
        <CardContent>
          <DataTable
            rows={filteredRows}
            columns={columns}
            loading={loading}
            users={users}
            isCellEditable={function (params: GridCellParams): boolean {
              throw new Error("Function not implemented.");
            }}
          />
        </CardContent>
      </Card>
      <BootstrapDialog
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        open={openAdd}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Add User
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenAdd(false)
          }}
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
          <Grid
            container
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Grid size={6}>
              <ValidationTextField
                name="loginName"
                size="small"
                label="UserCode"
                required
                value={userSaved.loginName}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value, // อัปเดตเฉพาะ field ที่กำลังเปลี่ยนแปลง
                  }));
                }}
              />
            </Grid>
            <Grid size={6}>
              <ValidationTextField
                name="password"
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={userSaved.password}
                required
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value, // อัปเดตเฉพาะ field ที่กำลังเปลี่ยนแปลง
                  }));
                }}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'hide the password' : 'display the password'
                        }
                        onClick={() => setShowPassword((show) => !show)}
                        onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                          event.preventDefault();
                        }}
                        onMouseUp={(event: React.MouseEvent<HTMLButtonElement>) => {
                          event.preventDefault();
                        }}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={6}>
              <ValidationTextField
                name="firstName"
                size="small"
                label="FristName"
                type="email"
                value={userSaved.firstName}
                required
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value, // อัปเดตเฉพาะ field ที่กำลังเปลี่ยนแปลง
                  }));
                }}
              />
            </Grid>
            <Grid size={6}>
              <ValidationTextField
                name="lastName"
                size="small"
                label="LastName"
                required
                value={userSaved.lastName}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value, // อัปเดตเฉพาะ field ที่กำลังเปลี่ยนแปลง
                  }));
                }}
              />
            </Grid>
            <Grid size={8}>
              <ValidationTextField
                name="email"
                size="small"
                label="Email"
                required
                value={userSaved.email}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value,
                  }));
                }}
              />
            </Grid>
            <Grid size={4}>
              <Autocomplete
                id="free-solo-2-demo"
                options={Array.from(new Set(users.map((option) => option.BranchID)))}
                value={userSaved.branchId}
                onChange={(event, value) => {
                  setUserSaved((prev) => ({
                    ...prev,
                    branchId: value || null, // ใช้ค่า `value` จาก Autocomplete
                  }));
                }}
                renderInput={(params) => (
                  <ValidationTextField
                    {...params}
                    required
                    name="branchId"
                    label="Branch"
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid size={4}>
              <Autocomplete
                id="free-solo-2-demo"
                options={department.map((option) => option.depcode)}
                value={userSaved.department}
                onChange={(event, value) => {
                  setUserSaved((prev) => ({
                    ...prev,
                    department: value || '', // ใช้ค่า `value` จาก Autocomplete
                  }));
                }}
                renderInput={(params) => (
                  <ValidationTextField
                    {...params}
                    required
                    name="department"
                    label="Department"
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid size={4}>
              <ValidationTextField
                name="secId"
                size="small"
                label="Section"
                required
                value={userSaved.secId}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setUserSaved((prev) => ({
                    ...prev,
                    [name]: value,
                  }));
                }}
              />
            </Grid>
            <Grid size={4}>
              <Autocomplete
                id="free-solo-2-demo"
                options={users.map((option) => option.UserCode)}
                value={userSaved.empUpper}
                onChange={(event, value) => {
                  setUserSaved((prev) => ({
                    ...prev,
                    empUpper: value || '', // ใช้ค่า `value` จาก Autocomplete
                  }));
                }}
                renderInput={(params) => (
                  <ValidationTextField
                    {...params}
                    required
                    name="empUpper"
                    label="Em Upper"
                    size="small"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            sx={{ textTransform: 'none' }}
            variant="outlined"
            onClick={User_Save}
          >
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </React.Fragment>
  );
}