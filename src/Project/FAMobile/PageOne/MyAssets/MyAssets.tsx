import { GridCellParams, GridColDef } from "@mui/x-data-grid"
import React from "react";
import { Stack, Typography, AppBar, Toolbar, Box, CardContent, ImageList, Tab, Tabs, CircularProgress, IconButton, CardHeader, Container } from "@mui/material";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid2';
import ImageCell from "./ClickOpenImg";
import MuiCard from '@mui/material/Card';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import dataConfig from "../../../../config";
import { AssetRecord, Assets_TypeGroup } from "../../../../type/nacType";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Fade from '@mui/material/Fade';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import NavBarMobile from '../../NavMain/NavbarMobile'
import client from "../../../../lib/axios/interceptor";

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
  const theme = useTheme();
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<AssetRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);

  // State สำหรับการกรองแต่ละฟิลด์
  const [originalRows, setOriginalRows] = React.useState<AssetRecord[]>([]);
  const [filter, setFilter] = React.useState<string>("");

  const fetchData = async () => {
    try {
      if (parsedData) {
        const response = await client.post(
          `/FA_Control_Fetch_Assets`,
          { usercode: parsedData.UserCode },
          { headers: dataConfig().header }
        );

        const resFetchAssets = await client.get(
          `/FA_Control_Assets_TypeGroup`,
          { headers: dataConfig().header }
        );

        // Declare resData before using it
        const resData: Assets_TypeGroup[] = resFetchAssets.data;

        if (resData.length > 0 && response.data.length > 0) {
          const dataLog: AssetRecord[] = response.data.filter(
            (res: AssetRecord) => res.typeCode === resData[0].typeCode && res.OwnerID === parsedData.UserCode
          );
          setRows(dataLog);
          setOriginalRows(dataLog);
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


  React.useEffect(() => {
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
                navigate('/MobileHome');
              }}
              sx={{ color: 'black' }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="subtitle1" color="inherit" component="div">
              ทรัพย์สินทั้งหมดของฉัน
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
                const typeFil = originalRows.filter(res => res.typeCode === newValue && res.OwnerID === parsedData.UserCode)
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
            justifyContent: 'center', // จัดให้อยู่กึ่งกลางแนวตั้ง
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
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '40vh', // ให้มีพื้นที่พอสำหรับแสดง Loading
                width: '100%',
              }}
            >
              <CircularProgress color="inherit" />
            </Box>
          )}
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
                    />
                  </ImageList>
                  <CardContent>
                    <Typography variant="body1" color="white">SerialNo: {res.SerialNo || '-'}</Typography>
                    <Typography variant="body1" color="white">ผู้ถือครอง: {res.OwnerID} ({res.Position})</Typography>
                    <Typography variant="body1" color="white">Asset Group: {res.Asset_group || '-'}</Typography>
                    <Typography variant="body1" color="white">Group Name: {res.Group_name || '-'}</Typography>
                    <Typography variant="body1" color="white">สถานะปัจจุบัน: {res.Details}</Typography>
                    <Typography variant="body1" color="white">NAC STATUS: {res.nac_processing ? `ถูกใช้งานที่ ${res.nac_processing}` : '-'}</Typography>
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
    </Box>
  );
}