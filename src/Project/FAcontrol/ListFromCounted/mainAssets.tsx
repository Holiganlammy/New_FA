import { GridActionsCellItem, GridCellParams, GridColDef, GridRenderCellParams, useGridApiContext } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { CountAssetRow, PeriodDescription, Assets_TypeGroup } from '../../../type/nacType';
import { Stack, Typography, AppBar, Container, Toolbar, Autocomplete, TextField, Box, FormControl, Select, SelectChangeEvent, Dialog, DialogContent, DialogTitle, IconButton, Button, DialogActions, CssBaseline, Card, Tab, Tabs } from "@mui/material";
import FindInPageIcon from '@mui/icons-material/FindInPage'
import Chip from '@mui/material/Chip';
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Swal from "sweetalert2";
import client from "../../../lib/axios/interceptor";


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function ListNacPage() {

  const [openImage, setOpenImage] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string | null | undefined>('');
  const [currentImageType, setCurrentImageType] = React.useState<'ImagePath' | 'ImagePath_2'>('ImagePath'); // เพิ่มสำหรับระบุว่าแก้ไข image ไหน
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);

  const handleImageClick = (src: string | null | undefined, imageType: 'ImagePath' | 'ImagePath_2') => {
    setImageSrc(src);
    setCurrentImageType(imageType); // เก็บประเภทของ image ที่กำลังดู
    setOpenImage(true);
  };

  const handleCloseImage = () => {
    setOpenImage(false);
    setImageSrc('');
  };

  // state Main
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<CountAssetRow[]>([]);
  const [optionDct, setOptionDct] = React.useState<PeriodDescription[]>([]);
  const [optionDctString, setOptionDctString] = React.useState<string | null>('');
  const [loading, setLoading] = React.useState<boolean>(true);


  // State สำหรับการกรองแต่ละฟิลด์
  const [originalRows, setOriginalRows] = React.useState<CountAssetRow[]>([]);
  const [filterRows, setFilterRows] = React.useState<Partial<CountAssetRow>>({
    Code: undefined,
    Name: undefined,
    UserID: undefined,
    Reference: undefined,
    Position: undefined,
  });

  const searchFilterByKey = (newValue: String | null | undefined, id: keyof CountAssetRow, reason: any) => {
    setFilterRows(prevFilter => {
      const updatedFilter = { ...prevFilter, [id]: newValue };

      const filteredRows = originalRows.filter(res =>
        Object.entries(updatedFilter).every(([key, value]) =>
          value === undefined || value === null || res[key as keyof CountAssetRow] === value
        )
      );

      const filterType = filteredRows.filter(res => res.typeCode === assets_TypeGroupSelect)
      setRows(filterType); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
      return updatedFilter;
    });
  };

  function SelectEditInputCellDetail(props: Readonly<GridRenderCellParams>) {
    const { id, value, field, row } = props;
    const statusAll = ['none', 'สภาพดี', 'ชำรุดรอซ้อม', 'รอตัดชำรุด', 'QR Code ไม่สมบูรณ์ (สภาพดี)', 'QR Code ไม่สมบูรณ์ (ชำรุดรอซ้อม)', 'QR Code ไม่สมบูรณ์ (รอตัดชำรุด)']
    let currentValue = value;
    const apiRef = useGridApiContext();

    const handleChange = async (event: SelectChangeEvent) => {
      const reference: string = event.target.value;
      const referenceName: string = reference ? statusAll.find(res => res === reference) || reference : currentValue;
      
      try {
        const response = await client.post(`/FA_Control_UpdateDetailCounted`, {
          roundid: optionDct && optionDctString
            ? optionDct.find(res => res.Description === optionDctString)?.PeriodID ?? 0
            : 0,
          code: row.Code,
          status: row.remarker === 'ยังไม่ได้ตรวจนับ' ? 0 : 1,
          comment: row.comment,
          reference: referenceName === 'none' ? null : referenceName,
          image_1: row.ImagePath,
          image_2: row.ImagePath_2,
          userid: parsedData.userid,
          UserBranch: parsedData.branchid
        }, { headers: dataConfig().header });
        
        if (response.status === 200) {
          await apiRef.current.setEditCellValue({ id, field, value: referenceName });
          
          // อัปเดตข้อมูลใน state
          const updateRowData = (prevRows: CountAssetRow[]) =>
            prevRows.map((prevRow) =>
              prevRow.Code === row.Code ? { 
                ...prevRow, 
                Reference: referenceName === 'none' ? null : referenceName,
                Date: dayjs(),
                UserID: parsedData.UserCode
              } : prevRow
            );
          
          setRows(updateRowData);
          setOriginalRows(updateRowData);
          
          // แสดง popup แจ้งเตือน
          Swal.fire({
            icon: 'success',
            title: 'บันทึกข้อมูลสำเร็จ',
            text: `อัปเดตสถานะครั้งนี้เป็น "${referenceName === 'none' ? 'ไม่ระบุ' : referenceName}" แล้ว`,
            showConfirmButton: false,
            timer: 1500
          });
          
          apiRef.current.stopCellEditMode({ id, field });
          
          // Refresh ข้อมูล
          await refreshTableData();
        }
      } catch (error) {
        console.error('Error updating reference:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          showConfirmButton: true
        });
      }
    };

    return (
      <FormControl sx={{ m: 1, maxHeight: 50 }} size="small">
        <Select
          value={currentValue}
          onChange={handleChange}
          native 
          autoFocus
        >
          {statusAll.map(res => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </Select>
      </FormControl>
    );
  }
  // Function สำหรับคำนวณ remarker status เหมือนกับ ufn_FA_Control_res_status
  const calculateRemarkerStatus = (
    status: boolean | number,
    userBranch: number | null,
    branchID: number | null,
    ownerID: string | null,
    userID: number | null,
    userCode: string
  ): string => {
    const statusBool = status === 1 || status === true;
    
    // ตรวจนับแล้ว: status = 1 และ conditions ตามใดตามหนึ่ง
    if (
      (statusBool && userBranch === branchID && ownerID === userCode && userID !== null) ||
      (statusBool && userBranch === branchID && ownerID === null && userID !== null) ||
      (statusBool && userBranch === null && branchID === null && userID === null)
    ) {
      return 'ตรวจนับแล้ว';
    }
    // ต่างสาขา: status = 1 และ OwnerID ≠ UserID และ UserID ไม่ null
    else if (statusBool && ownerID !== userCode && userID !== null) {
      return 'ต่างสาขา';
    }
    // ยังไม่ได้ตรวจนับ: status = 0
    else if (!statusBool) {
      return 'ยังไม่ได้ตรวจนับ';
    }
    
    return 'ยังไม่ได้ตรวจนับ'; // default
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderSelectEditInputCellDetail: GridColDef['renderCell'] = (params: GridRenderCellParams) => {
    return <SelectEditInputCellDetail {...params} />;
  };

  function SelectEditInputCell(props: Readonly<GridRenderCellParams>) {
    const { id, value, field, row } = props;
    const statusAll = ['ตรวจนับแล้ว', 'ยังไม่ได้ตรวจนับ', 'ต่างสาขา']
    let currentValue = value;
    const apiRef = useGridApiContext();

    const handleChange = async (event: SelectChangeEvent) => {
      const status: string = event.target.value;
      const statusName: string = status ? statusAll.find(res => res === status) || status : currentValue;
      
      try {
        const newStatus = statusName === 'ยังไม่ได้ตรวจนับ' ? 0 : 1;
        
        const response = await client.post(`/FA_Control_UpdateDetailCounted`, {
          roundid: optionDct && optionDctString
            ? optionDct.find(res => res.Description === optionDctString)?.PeriodID ?? 0
            : 0,
          code: row.Code,
          status: newStatus,
          comment: row.comment,
          reference: row.Reference,
          image_1: row.ImagePath,
          image_2: row.ImagePath_2,
          userid: parsedData.userid,
          UserBranch: parsedData.branchid
        }, { headers: dataConfig().header });
        
        if (response.status === 200) {
          // คำนวณ remarker ใหม่ตามเงื่อนไขที่ถูกต้อง
          const calculatedRemarker = calculateRemarkerStatus(
            newStatus,
            parsedData.branchid, // ใช้ UserBranch จาก parsedData
            row.BranchID,
            row.OwnerID,
            parsedData.userid,
            parsedData.UserCode
          );
          
          // อัปเดตค่าใน DataGrid
          await apiRef.current.setEditCellValue({ id, field, value: calculatedRemarker });
          
          // อัปเดตข้อมูลใน state
          const updateRowData = (prevRows: CountAssetRow[]) =>
            prevRows.map((prevRow) =>
              prevRow.Code === row.Code ? { 
                ...prevRow, 
                remarker: calculatedRemarker, // ใช้ค่าที่คำนวณใหม่
                Date: dayjs(),
                UserID: parsedData.UserCode,
                Status: newStatus
              } : prevRow
            );
          
          setRows(updateRowData);
          setOriginalRows(updateRowData);
          
          // แสดง popup แจ้งเตือน
          Swal.fire({
            icon: 'success',
            title: 'บันทึกข้อมูลสำเร็จ',
            text: `อัปเดตสถานะเป็น "${calculatedRemarker}" แล้ว`,
            showConfirmButton: false,
            timer: 1500
          });
          
          // หยุดการแก้ไข
          apiRef.current.stopCellEditMode({ id, field });
          
          // Refresh ข้อมูลจาก API เพื่อให้แน่ใจว่าข้อมูลเป็นปัจจุบัน
          await refreshTableData();
          
        }
      } catch (error) {
        console.error('Error updating status:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          showConfirmButton: true
        });
      }
    };

    return (
      <FormControl sx={{ m: 1, maxHeight: 50 }} size="small">
        <Select
          value={currentValue}
          onChange={handleChange}
          native 
          autoFocus
        >
          {statusAll.map(res => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </Select>
      </FormControl>
    );
  }
  const refreshTableData = async () => {
    if (!optionDctString) return;
    
    try {
      const resData = await client.post(
        `/FA_Control_Report_All_Counted_by_Description`,
        { Description: optionDctString },
        { headers: dataConfig().header }
      );

      if (resData.status === 200) {
        setOriginalRows(resData.data);
        
        // กรองข้อมูลตามเงื่อนไขปัจจุบัน
        const filteredRows = resData.data.filter((res: CountAssetRow) =>
          Object.entries(filterRows).every(([key, value]) =>
            value === undefined || value === null || res[key as keyof CountAssetRow] === value
          )
        );
        
        const filterType = permission_menuID.includes(5) 
          ? filteredRows.filter((res: CountAssetRow) => res.typeCode === assets_TypeGroupSelect)
          : filteredRows.filter((res: CountAssetRow) => res.typeCode === assets_TypeGroupSelect && res.OwnerID === parsedData.UserCode);
        
        setRows(filterType);
      }
    } catch (error) {
      console.error('Error refreshing table data:', error);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderSelectEditInputCell: GridColDef['renderCell'] = (params: GridRenderCellParams) => {
    return <SelectEditInputCell {...params} />;
  };

  function EditInputCell(props: Readonly<GridRenderCellParams>) {
    const { id, value, field, row } = props;
    const case_code: string = row.case_code;
    const [currentValue, setCurrentValue] = React.useState(value ? value.toString() : '');
    const apiRef = useGridApiContext();

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const text: string = event.target.value;
      setCurrentValue(text);
      await apiRef.current.setEditCellValue({ id, field, value: text });
    };

    const handleBlurEndEdit = async () => {
      try {
        const response = await client.post(`/FA_Control_UpdateDetailCounted`, {
          roundid: optionDct && optionDctString
            ? optionDct.find(res => res.Description === optionDctString)?.PeriodID ?? 0
            : 0,
          code: row.Code,
          status: row.remarker === 'ยังไม่ได้ตรวจนับ' ? 0 : 1,
          comment: currentValue,
          reference: row.Reference,
          image_1: row.ImagePath,
          image_2: row.ImagePath_2,
          userid: parsedData.userid,
          UserBranch: parsedData.branchid
        }, { headers: dataConfig().header });
        
        if (response.status === 200) {
          await apiRef.current.setEditCellValue({ id, field, value: currentValue });
          
          // อัปเดตข้อมูลใน state
          const updateRowData = (prevRows: CountAssetRow[]) =>
            prevRows.map((prevRow) =>
              prevRow.Code === row.Code ? { 
                ...prevRow, 
                comment: currentValue,
                Date: dayjs(),
                UserID: parsedData.UserCode
              } : prevRow
            );
          
          setRows(updateRowData);
          setOriginalRows(updateRowData);
          
          // แสดง popup แจ้งเตือน
          Swal.fire({
            icon: 'success',
            title: 'บันทึกข้อมูลสำเร็จ',
            text: 'อัปเดตความคิดเห็นแล้ว',
            showConfirmButton: false,
            timer: 1500
          });
          
          apiRef.current.stopCellEditMode({ id, field });
          
          // Refresh ข้อมูล
          await refreshTableData();
        }
      } catch (error) {
        console.error('Error occurred while updating:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          showConfirmButton: true
        });
      }
    }

    return (
      <FormControl sx={{ m: 1, maxHeight: 50 }} size="small">
        <TextField
          id={case_code}
          variant="outlined"
          key={case_code}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlurEndEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlurEndEdit();
            }
          }}
          multiline
          minRows={1}
          sx={{
            '& .MuiInputBase-root': {
              height: 'auto',
            }
          }}
        />
      </FormControl>
    );
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderEditInputCell: GridColDef['renderCell'] = (params: GridRenderCellParams) => {
    return <EditInputCell {...params} />;
  };

  const columns: GridColDef[] = [
    { field: 'Code', headerName: 'รหัสทรัพย์สิน', width: 150, headerAlign: 'center', align: 'center', },
    { field: 'Name', headerName: 'ชื่อทรัพย์สิน', width: 180, headerAlign: 'center' },
    { field: 'SerialNo', headerName: 'SerialNo', headerAlign: 'center', flex: 1, },
    { field: 'OwnerID', headerName: 'ผู้ถือครอง', width: 100, headerAlign: 'center', align: 'center', },
    // { field: 'Position', headerName: 'Location NAC', width: 100, headerAlign: 'center', align: 'center', },
    {
      field: 'Date', headerName: 'วันที่ตรวจนับ', width: 150, headerAlign: 'center', align: 'center',
      renderCell: (params) => params.row.Date ? dayjs(new Date(params.row.Date)).format('DD/MM/YYYY') : '',
    },
    {
      field: 'EndDate_Success', headerName: 'วันที่ทำ NAC ล่าสุด', width: 150, headerAlign: 'center', align: 'center',
      renderCell: (params) => params.row.EndDate_Success ? dayjs(new Date(params.row.EndDate_Success)).format('DD/MM/YYYY') : '',
    },
    { field: 'UserID', headerName: 'ผู้ตรวจ', width: 100, headerAlign: 'center', align: 'center', },
    { field: 'detail', headerName: 'สถานะล่าสุด', headerAlign: 'center', flex: 1, align: 'center', },
    {
      field: 'Reference', headerName: 'สถานะครั้งนี้', headerAlign: 'center', flex: 1, align: 'center',
      renderCell: (params) => params.row.Reference ? params.row.Reference : 'none',
      renderEditCell: renderSelectEditInputCellDetail,
      editable: true,
    },
    {
      field: 'comment', headerName: 'Comment', headerAlign: 'center', flex: 1,
      editable: true,
      renderEditCell: renderEditInputCell,

    },
    {
      field: 'remarker', headerName: 'ผลการตรวจนับ', width: 150, headerAlign: 'center', align: 'center',
      renderCell: (params) =>
        <Chip
          label={params.row.remarker}
          color={params.row.remarker === 'ตรวจนับแล้ว' ? 'success' : params.row.remarker === 'ยังไม่ได้ตรวจนับ' ? 'error' : 'warning'}
        />,
      renderEditCell: renderSelectEditInputCell,
      editable: true,
    },
    {
      field: 'actions', type: 'actions', width: 80, headerName: 'Img',
      cellClassName: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          key={`${params.row.Code}_img1`}
          onClick={() => handleImageClick(params.row.ImagePath, 'ImagePath')}
          icon={<FindInPageIcon />}
          label="Image 1"
          showInMenu
        />,
        <GridActionsCellItem
          key={`${params.row.Code}_img2`}
          onClick={() => handleImageClick(params.row.ImagePath_2, 'ImagePath_2')}
          icon={<FindInPageIcon />}
          label="Image 2"
          showInMenu
        />,
      ],
    },
  ];

  const handleChange = async (newValue: string | null) => {
    setLoading(true);
    setOptionDctString(newValue);

    if (newValue) {
      try {
        const resData = await client.post(
          `/FA_Control_Report_All_Counted_by_Description`,
          { Description: newValue },
          { headers: dataConfig().header }
        );

        if (resData.status === 200) {
          setRows(resData.data);
          setOriginalRows(resData.data);
        } else {
          setRows([]);
          setOriginalRows([]);
        }
      } catch (error) {
        setRows([]);
        setOriginalRows([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setRows([]);
      setOriginalRows([]);
    }
  };

  React.useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const response = await client.post(
          `/FA_Control_Report_All_Counted_by_Description`,
          { Description: '' },
          { headers: dataConfig().header }
        );

        const resFetchAssets = await client.get(`/FA_Control_Assets_TypeGroup`, { headers: dataConfig().header })
        const resData: Assets_TypeGroup[] = resFetchAssets.data
        setAssets_TypeGroup(resData)
        setAssets_TypeGroupSelect(resData[0].typeCode)

        const permiss = await client.post(`/select_Permission_Menu_NAC`, { Permission_TypeID: 1, userID: parsedData.userid }, { headers: dataConfig().header })
        setPermission_menuID(permiss.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))

        if (response.status === 200) {
          setLoading(false)
          setOptionDct(response.data);
        } else {
          setLoading(false)
          setRows([]);
          setOriginalRows([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [parsedData.UserCode, pathname]);

  const handleUploadFile_1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const allowedImageExtensions = ['jpg', 'png', 'gif', 'xbm', 'tif', 'pjp', 'svgz', 'jpeg', 'jfif', 'bmp', 'webp', 'svg'];

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get file extension

      if (fileExtension && allowedImageExtensions.includes(fileExtension)) {
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        try {
          const response = await client.post(
            `/check_files_NewNAC`,
            formData_1,
            { headers: dataConfig().headerUploadFile }
          );

          const list = [...rows];
          // หา row ที่กำลังแก้ไข
          const index = rows.findIndex(res => 
            res.ImagePath === imageSrc || res.ImagePath_2 === imageSrc
          );
          
          if (index !== -1) {
            const newImageUrl = `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`;
            
            // อัปเดตเฉพาะ image ที่เลือกไว้
            if (currentImageType === 'ImagePath') {
              list[index].ImagePath = newImageUrl;
            } else {
              list[index].ImagePath_2 = newImageUrl;
            }
            
            try {
              await client.post(`/FA_Control_UpdateDetailCounted`, {
                roundid: optionDct && optionDctString
                  ? optionDct.find(res => res.Description === optionDctString)?.PeriodID ?? 0
                  : 0,
                code: list[index].Code,
                status: list[index].remarker === 'ยังไม่ได้ตรวจนับ' ? 0 : 1,
                comment: list[index].comment,
                reference: list[index].Reference,
                image_1: list[index].ImagePath,
                image_2: list[index].ImagePath_2,
                userid: parsedData.userid,
                UserBranch: parsedData.branchid
              }, { headers: dataConfig().header });
              
              setRows(list);
              setOriginalRows(list);
              setImageSrc(newImageUrl);
              
            } catch (e) {
              console.error(e);
            }
          } else {
            console.error(`Index ไม่พบใน rows.`);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: 'ไฟล์ประเภทนี้ไม่ได้รับอนุญาติให้ใช้งานในระบบ \nใช้ได้เฉพาะ .csv, .xls, .txt, .ppt, .doc, .pdf, .jpg, .png, .gif',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
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
            รายงานการตรวจนับทรัพย์สินทุกรอบ
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
        <Grid container spacing={2} sx={{ py: 1 }}>
          <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={optionDctString}
              onChange={(e, newValue) => handleChange(newValue)}
              options={optionDct.map((option) => option.Description)}
              renderInput={(params) => <TextField {...params} label="ค้นหาคำอธิบาย..." />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.Code || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'Code', reason)}
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
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'Name', reason)}
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
              value={filterRows.Reference || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'Reference', reason)}
              options={rows ? Array.from(new Set(rows.map(res => res.Reference).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="สถานะครั้งนี้" />}
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
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'Position', reason)}
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
              const filterOnChange = { ...filterRows }
              const filteredRows = originalRows.filter(res =>
                Object.entries(filterOnChange).every(([key, value]) =>
                  value === undefined || value === null || res[key as keyof CountAssetRow] === value
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
        <BootstrapDialog
          open={openImage}
          onClose={handleCloseImage}
          fullWidth
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
            {rows.find(res => res.ImagePath === imageSrc || res.ImagePath_2 === imageSrc)?.Code} ({rows.find(res => res.ImagePath === imageSrc || res.ImagePath_2 === imageSrc)?.Name})
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              กำลังแก้ไข: {currentImageType === 'ImagePath' ? 'Image 1' : 'Image 2'}
            </Typography>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleCloseImage}
            sx={(theme) => ({
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent style={{ textAlign: 'center' }} dividers>
            <Stack
              direction="column"
              spacing={2}
              sx={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={imageSrc || ''}
                alt={imageSrc || ''}
                style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '60vh' }}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
                }}
              />
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                sx={{ maxWidth: '400px' }}
                startIcon={<CloudUploadIcon />}
              >
                Upload {currentImageType === 'ImagePath' ? 'Image 1' : 'Image 2'}
                <input hidden type="file" name='file' accept='image/*'
                  onChange={handleUploadFile_1}
                />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleCloseImage}>
              Save changes
            </Button>
          </DialogActions>
        </BootstrapDialog>
        <Outlet />
      </Container>
    </React.Fragment >
  );
}