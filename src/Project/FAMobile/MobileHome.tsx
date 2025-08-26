import * as React from "react";
import { Box, Stack, Card, CardHeader, Avatar, Typography, AppBar, Toolbar, IconButton, Container, Dialog, Button, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { red } from "@mui/material/colors";
import QrCodeIcon from "@mui/icons-material/QrCode";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CropFreeIcon from "@mui/icons-material/CropFree";
import { BrowserQRCodeReader } from "@zxing/browser";
import ScanVerifly from './PageOne/VeriflyCode/ScanVerifly';
import QRCodeScanner from './PageOne/VeriflyCode/QRCodeScanner';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import Fade from '@mui/material/Fade';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import NavBarMobile from './NavMain/NavbarMobile'
import dataConfig from "../../config";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import client from "../../lib/axios/interceptor";

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

interface PerBranch {
  BranchID: number;
  Name: string;
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

const cards = [
  {
    id: 1,
    title: "ตรวจนับทรัพย์สิน",
    description: "Go to Count Assets.",
    icon: <QrCodeIcon />,
  },
  {
    id: 2,
    title: "ทรัพย์สินทั้งหมดของฉัน",
    description: "View My Assets.",
    icon: <EventNoteIcon />,
  },
  {
    id: 3,
    title: "ตรวจสอบคิวอาร์โค้ด",
    description: "Verify QR Code.",
    icon: <CropFreeIcon />,
  },
];

export default function RecipeReviewCard(props: Props) {
  const navigate = useNavigate();
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [qrData, setQrData] = React.useState<string>("");
  const [perBranch, setPerBranch] = React.useState<PerBranch[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [branchSelect, setBranchSelect] = React.useState('');
  const [scannedCode, setScannedCode] = React.useState<string | null>(null);


  const handleClickOpennDialog = () => {
    setOpenDialog(true);
  };

  const handleCardClick = (id: number) => {
    if (id === 3) {
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
                setQrData(result.getText());
              } else {
                Swal.fire({
                  icon: "warning",
                  title: `ไม่สามารถอ่าน QR Code ได้ กรุณาลองใหม่อีกครั้ง`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }
            })
            .catch(err => {
              Swal.fire({
                icon: "warning",
                title: `${err}`,
                showConfirmButton: false,
                timer: 1500
              })
            });
        }
      };

      fileInput.click();
    } else if (id === 2) {
      navigate('/MyAssets');
    } else if (id === 1) {
      handleClickOpennDialog()
    }
  };

  const fetchPermissionB = async () => {
    try {
      await client.post('/permission_branch', { 'userCode': parsedData.UserCode }, { headers: dataConfig().header })
        .then((res) => {
          setPerBranch(res.data.data);
        });
    } catch (e) {
      console.log(e)
    }
  }

  React.useEffect(() => {
    fetchPermissionB()
  }, [])

  const handleResult = (result: string) => {
    setScannedCode(result);
    alert(`QR Code: ${result}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ThemeProvider theme={darkTheme}>
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
        >
          <NavBarMobile />
          <Toolbar id="back-to-top-anchor" sx={{ backgroundColor: '#f5f5f5', color: 'black' }}>
            {qrData && (
              <IconButton
                onClick={() => {
                  navigate('/MobileHome');
                  setQrData("")
                }}
                sx={{ color: 'black' }}
              >
                <ArrowBackIosIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" color="inherit" component="div">
              หน้าแรก
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
          <QRCodeScanner onResult={handleResult} />
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
              {!qrData && cards.map((card, index) => (
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
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: red[500] }}>{card.icon}</Avatar>}
                    title={<Typography color="white">{card.title}</Typography>}
                    subheader={<Typography color="white">{card.description}</Typography>}
                  />
                </Card>
              ))}
            </Stack>
            {/* {qrData && (<ScanVerifly qrText={qrData} />)} */}
            <ScrollTop {...props}>
              <Fab size="small" aria-label="scroll back to top">
                <KeyboardArrowUpIcon />
              </Fab>
            </ScrollTop>
          </Box>
        </Container>
      </ThemeProvider>
      <BootstrapDialog
        onClose={() => {
          setOpenDialog(false);
        }}
        aria-labelledby="customized-dialog-title"
        open={openDialog}
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          เลือกสาขาที่ต้องการ
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenDialog(false);
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
          <FormControl sx={{ width: '100%' }} size="small">
            <Select
              value={branchSelect}
              onChange={(event: SelectChangeEvent) => {
                setBranchSelect(event.target.value);
              }}
            >
              {perBranch && perBranch.map((res, index) => (
                <MenuItem value={String(res.BranchID)} key={index}>{res.Name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              navigate("/MobilePageTwo", {
                state: { branchSelect }
              });
            }}
          >
            OK
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </Box>
  );
}
