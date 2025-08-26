import { GridCellParams, GridColDef } from "@mui/x-data-grid"
import React from "react";
import { Stack, Typography, AppBar, Toolbar, Box, CardContent, ImageList, Tab, Tabs, CircularProgress, IconButton, CardHeader, Container, CardActions, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router";
import dayjs from 'dayjs';
import ImageCell from "./ClickOpenImg";
import MuiCard from '@mui/material/Card';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import dataConfig from "../../../../config";
import { CountAssetRow, Assets_TypeGroup } from "../../../../type/nacType";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Fade from '@mui/material/Fade';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import NavBarMobile from '../../NavMain/NavbarMobile'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import { blue } from '@mui/material/colors';
import Swal from "sweetalert2";
import client from "../../../../lib/axios/interceptor";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children?: React.ReactElement<unknown>;
}

function ScrollTop(props: Props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (
      (event.target as HTMLDivElement).ownerDocument || document
    ).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
      });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Fade>
  );
}

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(1),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
  '&:hover': {
    border: `2px solid ${theme.palette.primary.main}`,
    // boxShadow: `0 2px 10px ${theme.palette.primary.main}33`,
  },
}));


export default function MyAssets(props: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const dataLocation = location.state;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<CountAssetRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);
  const [dialogFixed, setDialogFixed] = React.useState<boolean>(false);
  const fixText = 'QR Code ไม่สมบูรณ์';
  const dataFix = ['ไม่ได้ระบุสถานะ', 'สภาพดี', 'ชำรุดรอซ่อม', 'รอตัดขาย', 'รอตัดชำรุด', 'อื่น ๆ'];
  const dataNewAdd = [`${fixText} (ไม่ได้ระบุสถานะ)`, `${fixText} (สภาพดี)`, `${fixText} (ชำรุดรอซ่อม)`, `${fixText} (รอตัดขาย)`, `${fixText} (รอตัดชำรุด)`, `${fixText} (อื่น ๆ)`];
  const [choice, setChoice] = React.useState<CountAssetRow>({
    Code: '',
    Name: '',
    BranchID: 0,
    OwnerID: '',
    Position: '',
    Date: dayjs(Date.now()),
    EndDate_Success: dayjs(Date.now()),
    UserID: '',
    detail: '',
    Reference: '',
    comment: '',
    remarker: '',
    RoundID: '',
    RowID: 0,
    typeCode: '',
    ImagePath: '',
    ImagePath_2: '',
  });
  const [valueChoice, setValueChoice] = React.useState(choice && choice.Reference || 'ไม่ได้ระบุสถานะ');
  const [countChoice, setCountChoice] = React.useState('ตรวจนับแล้ว');




  // State สำหรับการกรองแต่ละฟิลด์
  const [originalRows, setOriginalRows] = React.useState<CountAssetRow[]>([]);

  const fetchData = async () => {
    try {
      if (parsedData) {
        const response = await client.post(
          `/FA_Control_Report_All_Counted_by_Description`,
          { Description: dataLocation?.Description },
          { headers: dataConfig().header }
        );

        const resFetchAssets = await client.get(
          `/FA_Control_Assets_TypeGroup`,
          { headers: dataConfig().header }
        );

        // Declare resData before using it
        const resData: Assets_TypeGroup[] = resFetchAssets.data;
        if (resData.length > 0 && response.data.length > 0) {
          const dataLog: CountAssetRow[] = response.data.filter(
            (res: CountAssetRow) => res.typeCode === resData[0].typeCode && (res.BranchID)?.toString() === dataLocation?.branchSelect
          );
          setRows(dataLog.filter((res: CountAssetRow) => res.remarker === 'ตรวจนับแล้ว' && res.typeCode === resData[0].typeCode));
          setOriginalRows(response.data.filter((res: CountAssetRow) => (res.BranchID)?.toString() === dataLocation?.branchSelect));
          setAssets_TypeGroup(resData);
          setAssets_TypeGroupSelect(resData[0].typeCode);
          setLoading(false);
        } else {
          setRows([]);
          setOriginalRows([]);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false); // Ensure loading is disabled in case of error
    }
  };

  const updateReferent = async (value: string) => {
    const response = await client.post(
      `/updateReference`,
      {
        "Reference": value,
        "Code": choice.Code,
        "RoundID": choice.RoundID,
        "UserID": parsedData.userid,
        "BranchID": choice.BranchID,
        "Date": dayjs(Date.now()),
      },
      { headers: dataConfig().header }
    );
    if (response) {
      setChoice((prev) => ({ ...prev, Reference: value }))
    } else {
      Swal.fire({
        icon: "warning",
        title: 'ไม่สามารถเปลี่ยนแปลงได้ ลองใหม่อีกครั้ง',
        showConfirmButton: false,
        timer: 1500
      }).then(() => setValueChoice('ยังไม่ได้ระบุสถานะ'));
    }
  }


  React.useEffect(() => {
    if (!dataLocation?.branchSelect) {
      navigate('/MobileHome');
    }
    fetchData();
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <div id="back-to-top-anchor" style={{ display: 'none' }} />
      <ThemeProvider theme={darkTheme}>
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
        >
          <NavBarMobile />
          <Toolbar sx={{ backgroundColor: '#f5f5f5', color: 'black' }}>
            <IconButton
              onClick={() => {
                navigate('/MobilePageTwoReportedRound', {
                  state: { branchSelect: `${dataLocation?.branchSelect}` }
                });
              }}
              sx={{ color: 'black' }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="subtitle1" color="inherit" component="div">
              รอบตรวจนับ (id: #{dataLocation?.PeriodID})
            </Typography>
          </Toolbar>
          <Toolbar>
            <Tabs
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              aria-label="full width tabs example"
              value={assets_TypeGroupSelect}
              onChange={(event: React.SyntheticEvent, newValue: string) => {
                const typeFil = originalRows.filter(res =>
                  res.typeCode === newValue && (res.BranchID)?.toString() === dataLocation?.branchSelect
                )
                setRows(typeFil); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
                setAssets_TypeGroupSelect(newValue);
              }}
            >
              {assets_TypeGroup.map((res) => (
                <Tab
                  label={`${res.typeCode}`}
                  value={res.typeCode}
                  key={res.typeGroupID}
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
          </Toolbar>
        </AppBar>
        <Container
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // จัดให้อยู่กึ่งกลางแนวตั้ง
            minHeight: '100vh', // ใช้ความสูงเต็มจอ
            alignItems: 'center',
            pt: { xs: 16, sm: 22 },
            pb: { xs: 8, sm: 12 },
          }}
        >
          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                minHeight: '40vh', // ให้มีพื้นที่พอสำหรับแสดง Loading
                width: '100%',
              }}
            >
              <CircularProgress color="inherit" />
            </Box>
          )}
          {!loading &&
            <FormControl>
              <FormLabel id="demo-radio-buttons-group-label">{choice && choice.Reference}</FormLabel>
              <RadioGroup
                row
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue={countChoice}
                name="radio-buttons-group"
                value={countChoice}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setCountChoice((event.target as HTMLInputElement).value);
                  const choiceCount = originalRows.filter(
                    res => res.remarker === (event.target as HTMLInputElement).value &&
                      (res.BranchID)?.toString() === dataLocation?.branchSelect &&
                      res.typeCode === assets_TypeGroupSelect
                  )
                  setRows(choiceCount); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
                }}
              >
                <FormControlLabel
                  value={`ตรวจนับแล้ว`}
                  control={<Radio sx={{ color: blue[800], '&.Mui-checked': { color: blue[600], }, }} />}
                  label={`counted. (${originalRows.filter(res => res.remarker === 'ตรวจนับแล้ว' && res.typeCode === assets_TypeGroupSelect).length})`}
                />
                <FormControlLabel
                  value={`ยังไม่ได้ตรวจนับ`}
                  control={<Radio sx={{ color: blue[800], '&.Mui-checked': { color: blue[600], }, }} />}
                  label={`uncount. (${originalRows.filter(res => res.remarker !== 'ตรวจนับแล้ว' && res.typeCode === assets_TypeGroupSelect).length})`}
                />
              </RadioGroup>
            </FormControl>
          }
          <Box
            sx={{
              width: "100%",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", width: '100vw', gap: 2 }}>
              {!loading && rows.length > 0 && rows.map((res, index) => (
                <Card
                  sx={{
                    width: '100%',
                    border: "1px solid #ddd", // เพิ่มขอบ
                    backgroundColor: "rgba(0,121,107,0.85)", // ใช้สีพื้นหลังของ Paper
                  }}
                  variant='outlined'
                  key={index}
                >
                  <CardHeader
                    title={<Typography variant="h6" component="div" color="white">{res.Code}</Typography>}
                    subheader={<Typography variant="body1" component="div" color="white">{res.Name}</Typography>}
                    action={
                      <Tooltip title="แก้ไขรายละเอียด">
                        <IconButton
                          aria-label="add to favorites"
                          onClick={() => {
                            setChoice(res)
                            setDialogFixed(true)
                          }}
                        >
                          <AutoFixHighIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <ImageList cols={2}>
                    <ImageCell
                      imagePath={res.ImagePath ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png'}
                      name={'Image 1'}
                      originalRows={originalRows}
                      rows={rows}
                      index={index}
                      fieldData={`ImagePath`}
                      setRows={setRows}
                      setOriginalRows={setOriginalRows}
                      fetchData={fetchData}
                    />
                    <ImageCell
                      imagePath={res.ImagePath_2 ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png'}
                      name={'Image '}
                      originalRows={originalRows}
                      rows={rows}
                      index={index}
                      fieldData={`ImagePath_2`}
                      setRows={setRows}
                      setOriginalRows={setOriginalRows}
                      fetchData={fetchData}
                    />
                  </ImageList>
                  <CardContent>
                    <Typography variant="body1" color="white">ผู้ถือครอง: {res.OwnerID} ({res.Position})</Typography>
                    <Typography variant="body1" color="white">ประเภท: {res.typeCode || '-'}</Typography>
                    <Typography variant="body1" color="white">สถานะปัจจุบัน: {res.detail || '-'}</Typography>
                    <Typography variant="body1" color="white">ผู้ตรวจนับ: {res.UserID || '-'}</Typography>
                    <Typography variant="body1" color="white">วันที่ตรวจนับ: {dayjs(res.Date).format('DD/MM/YYYY HH:mm')}</Typography>
                    <Typography variant="body1" color="white">สถานะครั้งนี้: {res.Reference || '-'}</Typography>
                    <Typography variant="body1" color="white">หมายเหตุ: {res.remarker || '-'}</Typography>
                  </CardContent>
                </Card>
              ))}
              <ScrollTop {...props}>
                <Fab size="small" aria-label="scroll back to top">
                  <KeyboardArrowUpIcon />
                </Fab>
              </ScrollTop>
            </Box>
          </Box>
          <Outlet />
        </Container>
      </ThemeProvider>
      <BootstrapDialog
        onClose={() => {
          setDialogFixed(false);
        }}
        aria-labelledby="customized-dialog-title"
        open={dialogFixed}
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          แก้ไขรายการ
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => {
            setDialogFixed(false);
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
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">{choice && choice.Reference}</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={valueChoice}
              name="radio-buttons-group"
              value={valueChoice}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setValueChoice((event.target as HTMLInputElement).value);
                updateReferent((event.target as HTMLInputElement).value);
              }}
            >
              {dataFix.map((dataFix, index) => (
                <FormControlLabel
                  key={index}
                  value={dataFix}
                  control={<Radio />}
                  label={dataFix}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              const indexRow = rows.findIndex(res => res.Code === choice.Code)
              const list = [...rows]
              list[indexRow]['Reference'] = valueChoice
              setRows(list)
              setDialogFixed(false)
            }}
          >
            OK
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </Box >
  );
}