import * as React from "react";
import { Box, Stack, Card, Typography, AppBar, Toolbar, IconButton, Container, CardHeader, CardContent, Divider } from "@mui/material";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Fade from '@mui/material/Fade';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dataConfig from "../../../../config";
import NavBarMobile from '../../NavMain/NavbarMobile'
import { useLocation, useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import { BrowserQRCodeReader } from "@zxing/browser";
import Swal from "sweetalert2";
import client from "../../../../lib/axios/interceptor";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

interface PeriodData {
  PeriodID: string;
  BeginDate: string;
  EndDate: Dayjs;
  BranchID: Dayjs;
  DepCode: string | null;
  personID: string | null;
  Description: string;
  create_by: string;
}



interface Props {
  window?: () => Window;
  children?: React.ReactElement<unknown>;
}

function ScrollTop(props: Props) {
  const { children, window } = props;
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

export default function MainPageTow(props: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const dataLocation = location.state;
  const branchSelect = dataLocation?.branchSelect;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [round, setRound] = React.useState<PeriodData[]>([]);

  const fetchPermissionB = async () => {
    try {
      await client.post('/period_round',
        {
          BranchID: Number(dataLocation?.branchSelect) || null,
          depCode: parsedData.depcode || null,
          personID: parsedData.UserCode || null,
        }, { headers: dataConfig().header })
        .then((res) => {
          setRound(res.data);
        });
    } catch (e) {
      console.log(e)
    }
  }

  const startScan = (periodID: number) => {
    // แสดงตัวเลือกให้ผู้ใช้เลือกแหล่งที่มาของรูปภาพ
    const choice = window.confirm("คุณต้องการถ่ายรูปจากกล้องหรืออัปโหลดจากอุปกรณ์?\n\nกด 'ตกลง' เพื่อถ่ายรูป หรือ 'ยกเลิก' เพื่ออัปโหลด");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    if (choice) {
      fileInput.capture = "camera"; // เปิดกล้องถ่ายรูป
    }

    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // อ่าน QR Code จากรูปภาพ
        const reader = new BrowserQRCodeReader();
        reader.decodeFromImageUrl(URL.createObjectURL(file))
          .then(result => {
            if (result.getText()) {
              navigate("/ResultScan", {
                state: { Code: result.getText(), branchSelect: branchSelect, PeriodID: periodID }
              });
            } else {
              Swal.fire({
                icon: "warning",
                title: "ไม่สามารถอ่าน QR Code ได้ กรุณาลองใหม่อีกครั้ง",
                showConfirmButton: false,
                timer: 1500
              })
            }
          })
          .catch(err => {
            console.error("Error reading QR Code:", err);
            Swal.fire({
              icon: "warning",
              title: "ไม่สามารถอ่าน QR Code ได้ กรุณาลองใหม่อีกครั้ง",
              showConfirmButton: false,
              timer: 1500
            })
          });
      }
    };

    fileInput.click();
  }

  React.useEffect(() => {
    if (!dataLocation?.branchSelect) {
      navigate('/MobileHome');
    }
    fetchPermissionB()
  }, [])

  return (
    <Box sx={{ flexGrow: 1 }}>
      <div id="back-to-top-anchor" />
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
                navigate("/MobilePageTwo", {
                  state: { branchSelect }
                });
              }}
              sx={{ color: 'black' }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="subtitle1" color="inherit" component="div">
              เลือกรอบที่ต้องการ (2) (id: #{dataLocation?.branchSelect})
            </Typography>
          </Toolbar>
        </AppBar>
        <Container
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: { xs: 8, sm: 12 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Stack direction="column" spacing={2}>
              {round && round.map((res, index) => (
                <Card
                  key={index}
                  sx={{
                    width: "95vw",
                    backgroundColor: "rgba(0,121,107,1)",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "16px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0,121,107,0.85)",
                      transform: "scale(1.03)",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    },
                  }}
                  onClick={() => {
                    const now = dayjs();
                    const begin = dayjs(res.BeginDate);
                    const end = dayjs(res.EndDate);
                    if (!now.isBetween(begin, end, 'minute', '[]')) {
                      Swal.fire({
                        icon: "warning",
                        title: 'วันที่ปัจจุบันไม่ได้อยู่ในช่วงที่เปิดรอบตรวจนับนี้',
                        showConfirmButton: false,
                        timer: 1500
                      });
                    } else {
                      startScan(Number(res.PeriodID));
                    }
                  }}
                >
                  <CardContent>
                    <Typography color="white" variant="body1" sx={{ pb: 1 }}>{res.Description}</Typography>
                    <Divider />
                    <Typography color="white" variant="body2" sx={{ pt: 1 }}>
                      วันที่เริ่มต้น: {dayjs(res.BeginDate).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                    <Typography color="white" variant="body2">
                      วันที่สิ้นสุด: {dayjs(res.EndDate).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <ScrollTop {...props}>
              <Fab size="small" aria-label="scroll back to top">
                <KeyboardArrowUpIcon />
              </Fab>
            </ScrollTop>
          </Box>
        </Container>
      </ThemeProvider>
    </Box>
  );
}
