import * as React from 'react';
import Box from "@mui/material/Box";
import dataConfig from "../../../../config";
import { styled, createTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { AppBar, ImageList, ImageListItem, Stack, Toolbar, Dialog, DialogContent, Container, ThemeProvider, Tooltip, Button, DialogActions, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import { Dayjs } from 'dayjs'; // Import Dayjs
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import { Outlet, useLocation, useNavigate } from "react-router";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import NavBarMobile from '../../NavMain/NavbarMobile'
import { CountAssetRow } from '../../../../type/nacType';
import Swal from 'sweetalert2';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { BrowserQRCodeReader } from '@zxing/browser';
import client from '../../../../lib/axios/interceptor';

const convertToJPG = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const jpgFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve(jpgFile);
            } else {
              reject(new Error("Failed to convert image to JPG"));
            }
          },
          "image/jpeg",
          0.9 // คุณภาพของ JPG (0.9 = 90%)
        );
      };
    };

    reader.onerror = (error) => reject(error);
  });
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));


dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

export default function ScanVerifly() {
  const location = useLocation();
  const navigate = useNavigate();
  const dataLocation = location.state;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [qrData, setQrData] = React.useState<CountAssetRow>({
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
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const dataFix = ['ไม่ได้ระบุสถานะ', 'สภาพดี', 'ชำรุดรอซ่อม', 'รอตัดขาย', 'รอตัดชำรุด', 'อื่น ๆ']
  const [dialogFixed, setDialogFixed] = React.useState<boolean>(false);
  const [valueChoice, setValueChoice] = React.useState(qrData && qrData.Reference || 'ไม่ได้ระบุสถานะ');

  const fechData = async () => {
    try {
      if (dataLocation?.Code) {
        const resCheck = await client.post('/check_code_result', { 'Code': dataLocation?.Code }, { headers: dataConfig().header })
        if (resCheck.status === 200) {
          if (resCheck.data.data.length > 0) {
            await client.post('/addAsset',
              {
                "Name": resCheck.data.data[0]['Name'],
                "Code": resCheck.data.data[0]["Code"],
                "BranchID": resCheck.data.data[0]['BranchID'],
                "Date": dayjs(Date.now()),
                "UserBranch": dataLocation?.branchSelect,
                "Reference": 'ยังไม่ได้ระบุสถานะ',
                "Status": 1,
                "RoundID": dataLocation?.PeriodID,
                "UserID": parsedData?.userid,
              },
              { headers: dataConfig().header }).then((resAdd) => {
                if (resAdd.status === 200) {
                  setQrData((prev) => ({
                    ...prev,
                    Code: resCheck.data.data[0]["Code"],
                    Name: resCheck.data.data[0]['Name'],
                    BranchID: resCheck.data.data[0]['BranchID'],
                    detail: resCheck.data.data[0]['Details'] || '-',
                    OwnerID: resCheck.data.data[0]['ownerCode'],
                    typeCode: resCheck.data.data[0]['typeCode'],
                    Position: resCheck.data.data[0]['Position'],
                    RoundID: dataLocation?.PeriodID,
                    Date: dayjs(Date.now()),
                    UserID: parsedData?.UserCode,
                    Reference: 'ยังไม่ได้ระบุสถานะ',
                    remarker: 'ตรวจนับแล้ว',
                  }))
                } else {
                  Swal.fire({
                    icon: "warning",
                    title: `${resAdd.data.message}`,
                    showConfirmButton: false,
                    timer: 1500
                  })
                  navigate('/MobilePageTwoScanRound', { state: { branchSelect: dataLocation?.branchSelect } });
                }
              })
          } else {
            Swal.fire({
              icon: "warning",
              title: `${resCheck.data.message}`,
              showConfirmButton: false,
              timer: 1500
            })
            navigate('/MobilePageTwoScanRound', { state: { branchSelect: dataLocation?.branchSelect } });
          }
        }
      }
    } catch (e) {
      Swal.fire({
        icon: "warning",
        title: `${e}`,
        showConfirmButton: false,
        timer: 1500
      })
      navigate('/MobilePageTwoScanRound', { state: { branchSelect: dataLocation?.branchSelect } });
    }
  }

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedImage(null);
  };

  const updateReferent = async (value: string) => {
    const response = await client.post(
      `/updateReference`,
      {
        "Reference": value,
        "Code": qrData.Code,
        "RoundID": qrData.RoundID,
        "UserID": parsedData.userid,
        "BranchID": qrData.BranchID,
        "Date": dayjs(Date.now()),
      },
      { headers: dataConfig().header }
    );
    if (response.status === 200) {
      setQrData((prev) => ({ ...prev, Reference: value }))
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
    fechData();
  }, []);

  const handleCardClick = (id: number) => {
    const choice = window.confirm(
      "คุณต้องการถ่ายรูปจากกล้องหรืออัปโหลดจากอุปกรณ์?\n\nกด 'ตกลง' เพื่อถ่ายรูป หรือ 'ยกเลิก' เพื่ออัปโหลด"
    );

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    if (choice) {
      fileInput.capture = "camera"; // เปิดกล้อง
    }

    fileInput.onchange = async (e: any) => {
      let file = e.target.files?.[0];
      if (!file) return;

      try {
        file = await convertToJPG(file); // แปลงเป็น JPG

        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        const response = await client.post(
          `/check_files_NewNAC`,
          formData_1,
          { headers: dataConfig().headerUploadFile }
        );

        const attachData = response.data?.attach?.[0]?.ATT;
        console.log("Upload response:", response);
        console.log("Image:", attachData);
        if (response.status === 200 && attachData) {
          const selectedImageRes = `${dataConfig().httpViewFile}/NEW_NAC/${attachData}.jpg`;

          const payload = {
            Code: qrData?.Code ?? '',
            RoundID: qrData?.RoundID ?? '',
            index: id,
            url: selectedImageRes
          };

          try {
            const uploadRes = await client.post(
              `/FA_Mobile_UploadImage`,
              payload,
              { headers: dataConfig().header }
            );
            if (uploadRes.status === 200) {
              setQrData((prev) => ({
                ...prev,
                ImagePath: id === 0 ? selectedImageRes : prev.ImagePath,
                ImagePath_2: id === 1 ? selectedImageRes : prev.ImagePath_2
              }));
            } else {
              console.error("Upload failed:", uploadRes);
              Swal.fire({
                icon: "warning",
                title: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล (Status: " + uploadRes.status + ")",
                showConfirmButton: false,
                timer: 1500
              })
            }
          } catch (error) {
            console.error("Error uploading to FA_Mobile_UploadImage:", error);
            Swal.fire({
              icon: "warning",
              title: "เกิดข้อผิดพลาดในการบันทึกข้อมูลรูปภาพ",
              showConfirmButton: false,
              timer: 1500
            })
          }
        } else {
          console.error("Invalid response from check_files_NewNAC:", response.data);
          Swal.fire({
            icon: "warning",
            title: "ไม่สามารถอัปโหลดรูปภาพได้",
            showConfirmButton: false,
            timer: 1500
          })
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        Swal.fire({
          icon: "warning",
          title: "เกิดข้อผิดพลาดขณะประมวลผลรูปภาพ",
          showConfirmButton: false,
          timer: 1500
        })
      }
    };

    fileInput.click();
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
                  navigate('/MobilePageTwoScanRound', { state: { branchSelect: dataLocation?.branchSelect } });
                }}
                sx={{ color: 'black' }}
              >
                <ArrowBackIosIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" color="inherit" component="div">
              ผลลัพธ์การสแกน
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
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", width: '100vw' }}>
              {qrData && qrData.Code && (
                <Card
                  sx={{
                    width: '100%',
                    border: "1px solid #ddd", // เพิ่มขอบ
                    backgroundColor: "rgba(0,121,107,0.85)", // ใช้สีพื้นหลังของ Paper
                  }}
                  variant='outlined'
                >
                  <CardHeader
                    title={<Typography variant="h6" component="div" color="white">{qrData.Code}</Typography>}
                    subheader={<Typography variant="body1" component="div" color="white">{qrData.Name}</Typography>}
                    action={
                      <Tooltip title="แก้ไขรายละเอียด">
                        <IconButton
                          aria-label="add to favorites"
                          onClick={() => {
                            setQrData(qrData)
                            setDialogFixed(true)
                          }}
                        >
                          <AutoFixHighIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <ImageList cols={2}>
                    <ImageListItem>
                      <CardMedia
                        component="img"
                        height="160"
                        sx={{ objectFit: 'cover', cursor: 'pointer', p: 1 }}
                        onClick={() => handleCardClick(0)}
                        image={qrData?.ImagePath || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png"}
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null; // prevents looping
                          currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
                        }}
                        alt={`${qrData?.Name}_1`}
                      />
                    </ImageListItem>
                    <ImageListItem>
                      <CardMedia
                        component="img"
                        height="160"
                        sx={{ objectFit: 'cover', cursor: 'pointer', p: 1 }}
                        onClick={() => handleCardClick(1)}
                        image={qrData?.ImagePath_2 || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png"}
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null; // prevents looping
                          currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
                        }}
                        alt={`${qrData?.Name}_2`}
                      />
                    </ImageListItem>
                  </ImageList>
                  <CardContent>
                    <Typography variant="body1" color="white">ผู้ถือครอง: {qrData.OwnerID} ({qrData.Position})</Typography>
                    <Typography variant="body1" color="white">ประเภท: {qrData.typeCode || '-'}</Typography>
                    <Typography variant="body1" color="white">สถานะปัจจุบัน: {qrData.detail || '-'}</Typography>
                    <Typography variant="body1" color="white">ผู้ตรวจนับ: {qrData.UserID || '-'}</Typography>
                    <Typography variant="body1" color="white">วันที่ตรวจนับ: {dayjs(qrData.Date).format('DD/MM/YYYY HH:mm')}</Typography>
                    <Typography variant="body1" color="white">สถานะครั้งนี้: {qrData.Reference || '-'}</Typography>
                    <Typography variant="body1" color="white">หมายเหตุ: {qrData.remarker || '-'}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
      <BootstrapDialog
        open={openDialog}
        onClose={handleClose}
        fullWidth
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenDialog(false)
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
        <DialogContent style={{ textAlign: 'center' }}>
          <Stack
            direction="column"
            spacing={2}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={selectedImage || ''}
              style={{ width: '100%', height: 'auto' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
              }}
            />
          </Stack>
        </DialogContent>
      </BootstrapDialog>
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
            <FormLabel id="demo-radio-buttons-group-label">{qrData && qrData.Reference}</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={valueChoice}
              name="radio-buttons-group"
              value={valueChoice}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setValueChoice((event.target as HTMLInputElement).value);
                updateReferent((event.target as HTMLInputElement).value)
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
              setDialogFixed(false)
            }}
          >
            OK
          </Button>
        </DialogActions>
      </BootstrapDialog>
      <Outlet />
    </Box>
  );
};