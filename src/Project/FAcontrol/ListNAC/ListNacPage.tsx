import { GridActionsCellItem, GridCellParams, GridColDef, GridRenderCellParams, GridRowParams, useGridApiContext } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { ListNACHeaders, FilterListNACHeaders, NACDetailHistory, Assets_TypeGroup } from '../../../type/nacType';
import { Stack, Typography, AppBar, Container, Toolbar, Autocomplete, TextField, Box, FormControl, Select, SelectChangeEvent, CssBaseline, Card, Tab, Tabs } from "@mui/material";
import Swal from "sweetalert2";
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import client from "../../../lib/axios/interceptor";



// Helper function to determine background color based on `nac_status`
function getStatusColor(nac_status: number): string {
  const statusColors: Record<number, string> = {
    1: '#1E90FF',
    2: '#6495ED',
    3: '#FF69B4',
    4: '#00CED1',
    5: '#6A5ACD',
    6: '#008000',
    7: '#FFA500',
    8: '#F0E68C',
    11: '#F4A460',
    12: '#DDA0DD',
    13: '#6A5ACD',
    14: '#708090',
    15: '#6A5ACD',
    18: '#6A5ACD',
  };

  return statusColors[nac_status] ?? '#DC143C';
}

export default function ListNacPage() {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  // const checkUserWeb = localStorage.getItem('sucurity');
  const parsedData = data ? JSON.parse(data) : null;
  // const parsedUserWeb = checkUserWeb ? JSON.parse(checkUserWeb) : null;
  const [rows, setRows] = React.useState<ListNACHeaders[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [nac_status, setNac_status] = React.useState<{ nac_status_id: number; status_name: string; }[]>([]);
  const [originalRows, setOriginalRows] = React.useState<ListNACHeaders[]>([]);
  const [typeGroup, setTypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [typeString, setTypeString] = React.useState<string | null>('');
  const [filterNAC, setFilterNAC] = React.useState<Partial<ListNACHeaders>>({
    nac_code: undefined,
    name: undefined,
    source_userid: undefined,
    des_userid: undefined,
    status_name: undefined,
  });

  const permission = localStorage.getItem('permission_MenuID');
  const parsedPermission = permission ? JSON.parse(permission) : null;

  function SelectEditInputCell(props: Readonly<GridRenderCellParams>) {
    const { id, value, field, row } = props;
    const nac_code: string = row.nac_code;
    const foundStatus = nac_status.find(res => res.status_name === value);
    const currentValue: string = foundStatus ? foundStatus.nac_status_id.toString() : ""; // กำหนดค่า default หากไม่พบ
    const apiRef = useGridApiContext();
    const handleChange = async (event: SelectChangeEvent) => {
      const statusid: number = parseInt(event.target.value);
      const statusName: string = nac_status.find(res => Number(res.nac_status_id) === statusid)?.status_name ?? 'default status';

      const changeStatus = await client.post(
        `/FA_control_updateStatus`,
        { usercode: parsedData.UserCode, nac_code: nac_code, nac_status: statusid },
        { headers: dataConfig().header }
      );
      if (changeStatus.status === 200) {
        // อัพเดตค่าใน grid
        await apiRef.current.setEditCellValue({ id, field, value: statusName });
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.nac_code === nac_code ? { ...row, status_name: statusName, nac_status: statusid } : row
          )
        );
        setOriginalRows((prevRows) =>
          prevRows.map((row) =>
            row.nac_code === nac_code ? { ...row, status_name: statusName, nac_status: statusid } : row
          )
        );
        apiRef.current.stopCellEditMode({ id, field });
      } else {
        Swal.fire({
          title: `ไม่สามารถลบรายการได้`,
          icon: "warning",
          showConfirmButton: false,
          timer: 1500,
        })
      }
    };

    return (
      <FormControl sx={{ m: 1, maxHeight: 40, width: '100%' }} size="small">
        <Select
          value={currentValue}
          onChange={handleChange}
          native
          autoFocus
          sx={{
            height: 30,
            fontSize: '0.8rem',
          }}
        >
          {nac_status && nac_status.map(res => (
            <option key={res.nac_status_id} value={res.nac_status_id ?? 0}>
              {res.status_name}
            </option>
          ))}
        </Select>
      </FormControl>
    );
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderSelectEditInputCell: GridColDef['renderCell'] = (params: GridRenderCellParams) => {
    return <SelectEditInputCell {...params} />;
  };

  const columns: GridColDef[] = [
    {
      field: 'nac_code',
      headerName: 'เลขที่เอกสาร',
      width: 170,
      renderCell: (params) => {
        return (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <Stack>{params.row.nac_code}</Stack>
            <Stack>
              {params.row.source_approve_userid || params.row.verify_by_userid || params.row.nac_status === 3 ? (
                <CheckCircleIcon
                  sx={{ fontSize: '0.9rem' }}
                  color={params.row.source_approve_userid ? 'success' : 'primary'}
                />
              ) : params.row.nac_status === 2 ? (
                <ErrorIcon sx={{ fontSize: '0.9rem' }} color="warning" />
              ) : null}
            </Stack>
          </Stack>
        );
      },
    },
    {
      field: 'name',
      headerName: 'หัวข้อรายการ',
      minWidth: 170,
      flex: 1,
    },
    {
      field: 'create_date',
      headerName: 'วันที่สร้างเอกสาร',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => dayjs(new Date(params.row.create_date)).format('DD/MM/YYYY HH:mm'),
    },
    {
      field: 'create_by',
      headerName: 'ผู้สร้างรายการ',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (params.row.create_by ? params.row.create_by : '-'),
    },
    {
      field: 'source_userid',
      headerName: 'ผู้ส่ง',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (params.row.source_userid ? params.row.source_userid : '-'),
    },
    {
      field: 'des_userid',
      headerName: 'ผู้รับ',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (params.row.des_userid ? params.row.des_userid : '-'),
    },
    {
      field: 'status_name',
      headerName: 'สถานะรายการ',
      minWidth: 200,
      headerAlign: 'center',
      editable: parsedPermission.includes(10),
      renderEditCell: renderSelectEditInputCell,
      renderCell: (params) => {
        return (
          <Chip
            size="small"
            label={params.row.status_name} sx={{
              width: '100%',
              textAlign: 'center',
              color: 'white',
              backgroundColor: getStatusColor(params.row.nac_status),
            }}
          />
        );
      },
    },
    {
      field: 'userid_approver',
      headerName: 'ผู้ตรวจสอบ/อนุมัติ',
      align: 'center',
      headerAlign: 'center',
      width: 150,
      renderCell: (params) => {
        return (
          <>
            {params.row.nac_status === 4 || params.row.nac_status === 14
              ? params.row.des_userid
              : params.row.nac_status === 12
                ? params.row.source_userid
                : params.row.userid_approver}
          </>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Action',
      width: 160,
      disableExport: true,
      headerAlign: 'center',
      align: 'center',
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<ArticleIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => handleEditClick(params)} // Pass params to the function
            color="warning"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />} // Example for a Delete icon
            label="Delete"
            disabled={[0, 17].includes(params.row.nac_status)}
            onClick={(event) => {
              // Define common properties for Swal
              const swalConfig = {
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
              };

              // Check conditions for disallowing deletion
              if (
                (
                  // parsedUserWeb === 'admin' && 
                  [6, 17].includes(params.row.nac_status) && params.row.source_approve_userid) ||
                (pathname === "/NAC_OPERATOR" && (parsedData.UserCode === params.row.create_by || parsedData.UserCode !== params.row.create_by) && params.row.source_approve_userid)
              ) {
                Swal.fire({
                  icon: "error",
                  title: `ไม่สามารถลบรายการนี้ได้`,
                  showConfirmButton: false,
                  timer: 1500
                });
                return;
              }

              // Handle deletion confirmation for "/NAC_OPERATOR"
              if (pathname === "/NAC_OPERATOR") {
                Swal.fire({
                  ...swalConfig,
                  title: `กดปุ่มยืนยันเพื่อลบรายการ ${params.row.nac_code}`,
                  icon: "warning",
                  confirmButtonText: "ยืนยัน"
                }).then((result) => {
                  if (result.isConfirmed) {
                    dropNAC(params.row.nac_code);
                  }
                });
                return;
              }

              // Handle warning for approved items in "/NAC_ROW"
              if (pathname === "/NAC_ROW" && params.row.source_approve_userid) {
                Swal.fire({
                  ...swalConfig,
                  icon: "warning",
                  title: `รายการนี้ผ่านการอนุมัติแล้ว`
                });
                return;
              }

              // Handle deletion confirmation for unapproved items in "/NAC_ROW"
              if (pathname === "/NAC_ROW" && !params.row.source_approve_userid && params.row.create_by === parsedData.UserCode) {
                Swal.fire({
                  ...swalConfig,
                  title: `กดปุ่มยืนยันเพื่อลบรายการ ${params.row.nac_code}`,
                  icon: "warning",
                  confirmButtonText: "ยืนยัน"
                }).then((result) => {
                  if (result.isConfirmed) {
                    dropNAC(params.row.nac_code);
                  }
                });
                return;
              }
            }}
            color="error"
          />,
        ];
      },
    },
  ];

  const handleEditClick = (params: GridRowParams<ListNACHeaders>) => {
    const newPageValue = localStorage.getItem('pagination') || 1; // Example for getting page value
    localStorage.setItem('pagination_user', newPageValue.toString());
    localStorage.removeItem("pagination");

    localStorage.setItem('NacCode', JSON.stringify({
      nac_code: params.row.nac_code,
      nac_status: params.row.nac_status
    }));
    navigate(`/NAC_CREATE?id=${params.row.workflowtypeid}?nac_code=${params.row.nac_code}`);
  };

  const dropNAC = async (nac_code: string) => {
    const url: string = pathname === "/NAC_ROW" ? '/FA_Control_Select_MyNAC' : '/FA_Control_Select_MyNAC_Approve'
    try {
      const response = await client.post(
        '/store_FA_control_drop_NAC',
        { usercode: parsedData.UserCode, nac_code: nac_code },
        { headers: dataConfig().header }
      );

      if (response.status === 200) {
        const responseAfterDrop = await client.post(
           url,
          { usercode: parsedData.UserCode },
          { headers: dataConfig().header }
        );
        if (responseAfterDrop.status === 200) {
          Swal.fire({
            icon: "success",
            title: `ยกเลิกรายการสำเร็จ`,
            showConfirmButton: false,
            timer: 1500
          })
          fetchData();
        }
      } else {
        setRows([]);
        setOriginalRows([]);
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }


  const fetchData = async () => {
    setLoading(true)
    setRows([]);
    setOriginalRows([]);
    const url: string = pathname === "/NAC_ROW" ? '/FA_Control_Select_MyNAC' : '/FA_Control_Select_MyNAC_Approve'
    // Fetch NAC data and filter data from localStorage
    try {
      const resFetchAssets = await client.get('/FA_Control_Assets_TypeGroup', { headers: dataConfig().header })
      const resData: Assets_TypeGroup[] = resFetchAssets.data
      setTypeGroup(resData)
      setTypeString(resData[0].typeCode)

      const response = await client.post(
        url,
        { usercode: parsedData.UserCode },
        { headers: dataConfig().header }
      );

      const dataStatus = await client.get(
        `/FA_Control_ListStatus`,
        { headers: dataConfig().header }
      );

      if (dataStatus.status === 200) {
        setNac_status(dataStatus.data);
      }

      if (response.status === 200) {
        const allData = response.data.data;
        const typeCode = resData[0]?.typeCode; // ป้องกัน error กรณี resData ว่าง

        if (!typeCode) {
          setRows([]);
          setOriginalRows([]);
          setLoading(false);
          return;
        }

        const filteredByType = allData.filter((res: ListNACHeaders) => res.TypeCode === typeCode);

        setOriginalRows(allData); // เก็บข้อมูลต้นฉบับก่อน
        setRows(filteredByType); // เซ็ตข้อมูลที่ถูกกรองตาม TypeCode
        setLoading(false);

        // โหลดค่าที่เคยกรองไว้จาก localStorage
        const savedFilter = localStorage.getItem("filterNAC");
        if (savedFilter) {
          const parsedFilter = JSON.parse(savedFilter);
          setFilterNAC(parsedFilter);

          // กรองข้อมูลตาม filter ที่บันทึกไว้
          const finalFilteredRows = filteredByType.filter((res: ListNACHeaders) =>
            Object.entries(parsedFilter).every(([key, value]) =>
              value === undefined || value === null || res[key as keyof ListNACHeaders] === value
            )
          );

          setRows(finalFilteredRows); // อัปเดต rows ที่ถูกกรองตาม filter ที่บันทึกไว้
        }
      } else {
        setRows([]);
        setOriginalRows([]);
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [parsedData.UserCode, pathname]);

  const searchFilterByKey = (newValue: String | null | undefined, id: keyof ListNACHeaders, reason: any) => {
    setFilterNAC(prevFilter => {
      const updatedFilter = { ...prevFilter, [id]: newValue };

      // บันทึกค่า filter ลงใน localStorage
      localStorage.setItem("filterNAC", JSON.stringify(updatedFilter));

      const filteredRows = originalRows.filter(res =>
        Object.entries(updatedFilter).every(([key, value]) =>
          value === undefined || value === null || res[key as keyof ListNACHeaders] === value
        )
      );

      const filterType = filteredRows.filter(res => res.TypeCode === typeString)
      setRows(filterType); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
      return updatedFilter;
    });
  };

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
            สถานะรายการ NAC
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }} // Stacks vertically on smaller screens, horizontally on larger
          spacing={2} // Controls spacing between components
          justifyContent="center"
          alignItems="flex-start"
        >
          {/* NAC Code Autocomplete */}
          <Autocomplete
            autoHighlight
            disablePortal
            id="autocomplete-nac-code"
            size="small"
            sx={{ flexGrow: 1, padding: 1 }}
            value={filterNAC.nac_code || ''} // Ensure value is controlled, fallback to empty string
            onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'nac_code', reason)}
            options={rows ? Array.from(new Set(rows.map(res => res.nac_code).filter(x => !!x))) : []}
            renderInput={(params) => <TextField {...params} label="เลขที่ NAC" />} // Input with label
          />
          {/* NAC Name Autocomplete */}
          <Autocomplete
            autoHighlight
            disablePortal
            id="autocomplete-nac-name"
            size="small"
            sx={{ flexGrow: 1, padding: 1 }}
            value={filterNAC.name || ''} // Ensure value is controlled, fallback to empty string
            onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'name', reason)}
            options={rows ? Array.from(new Set(rows.map(res => res.name).filter(x => !!x))) : []}
            renderInput={(params) => <TextField {...params} label="หัวข้อรายการ" />} // Input with label
          />
          {/* Source User ID Autocomplete */}
          <Autocomplete
            autoHighlight
            disablePortal
            id="autocomplete-source-userid"
            size="small"
            sx={{ flexGrow: 1, padding: 1 }}
            value={filterNAC.source_userid || ''} // Ensure value is controlled, fallback to empty string
            onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'source_userid', reason)}
            options={rows ? Array.from(new Set(rows.map(res => res.source_userid).filter(x => !!x))) : []}
            renderInput={(params) => <TextField {...params} label="ผู้ส่งมอบ" />} // Input with label
          />
          {/* Des User ID Autocomplete */}
          <Autocomplete
            autoHighlight
            disablePortal
            id="autocomplete-des-userid"
            size="small"
            sx={{ flexGrow: 1, padding: 1 }}
            value={filterNAC.des_userid || ''} // Ensure value is controlled, fallback to empty string
            onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'des_userid', reason)}
            options={rows ? Array.from(new Set(rows.map(res => res.des_userid).filter(x => !!x))) : []}
            renderInput={(params) => <TextField {...params} label="ผู้รับมอบ" />} // Input with label
          />
          {/* Status Name Autocomplete */}
          <Autocomplete
            autoHighlight
            disablePortal
            id="autocomplete-status-name"
            size="small"
            sx={{ flexGrow: 1, padding: 1 }}
            value={filterNAC.status_name || ''} // Ensure value is controlled, fallback to empty string
            onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'status_name', reason)}
            options={rows ? Array.from(new Set(rows.map(res => res.status_name).filter(x => !!x))) : []}
            renderInput={(params) => <TextField {...params} label="สถานะ" />} // Input with label
          />
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ py: 1 }}
          justifyContent="flex-start"
          alignItems="flex-start"
          spacing={2}
        >
          <Chip icon={<ErrorIcon fontSize="small" color="warning" />} label="รอตรวจสอบ" />
          <Chip icon={<CheckCircleIcon fontSize="small" color="primary" />} label="ผ่านการตรวจสอบแล้ว" />
          <Chip icon={<CheckCircleIcon fontSize="small" color="success" />} label="ผ่านการอุนมัติแล้ว" />
        </Stack>
        <Grid container spacing={2} sx={{ py: 1 }}>
          <Grid justifyContent="flex-start" size={12} sx={{ mt: 2 }}>
            <Tabs
              // originalRows
              value={typeString}
              onChange={(event: React.SyntheticEvent, newValue: string) => {
                const filterOnChange = { ...filterNAC }
                const filteredRows = originalRows.filter(res =>
                  Object.entries(filterOnChange).every(([key, value]) =>
                    value === undefined || value === null || res[key as keyof ListNACHeaders] === value
                  )
                )
                const typeFil = filteredRows.filter(res => res.TypeCode === newValue)
                setRows(typeFil); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
                setTypeString(newValue);
              }}
            >
              {typeGroup.map((res) => (
                <Tab
                  label={`${res.typeCode} (${res.typeName})`}
                  value={res.typeCode}
                  key={res.typeGroupID}
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
          </Grid>
        </Grid>
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
    </React.Fragment >
  );
}