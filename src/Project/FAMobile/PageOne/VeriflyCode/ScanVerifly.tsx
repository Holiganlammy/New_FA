/* eslint-disable jsx-a11y/alt-text */
import * as React from 'react';
import Box from "@mui/material/Box";
import dataConfig from "../../../../config";
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ImageList, ImageListItem, Stack, Dialog, DialogContent } from '@mui/material';
import { Dayjs } from 'dayjs'; // Import Dayjs
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import client from '../../../../lib/axios/interceptor';

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

interface ScanVeriflyProps {
  qrText: string;
}

interface Asset {
  AssetID: string;
  Code: string;
  Name: string;
  SerialNo: string;
  BranchID: number;
  BranchName: string;
  ownerCode: string;
  ImagePath: string;
  ImagePath_2: string;
  Details: string | null;
  CreateDate: Dayjs; // หรือ Date ถ้าคุณต้องการให้เป็น Date object
}


export default function ScanVerifly({ qrText }: Readonly<ScanVeriflyProps>) {
  const [qrData, setQrData] = React.useState<Asset[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);


  const fetuser = async () => {
    try {
      if (qrText) {
        await client.post('/check_code_result', { 'Code': qrText }, { headers: dataConfig().header })
          .then((res) => {
            if (res.data.data.length > 0 && res.status === 200) {
              setQrData(res.data.data)
            } else {
              Swal.fire({
                icon: "warning",
                title: `${res.data.message}`,
                showConfirmButton: false,
                timer: 1500
              })
            }
          });
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedImage(null);
  };

  const handleClickOpen = (imageUrl: string, indexData: number) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  React.useEffect(() => {
    fetuser();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: '100vw' }}>
      {qrData.length > 0 && qrData[0].Code && (
        <Card
          sx={{
            width: '100%',
            border: "1px solid #ddd", // เพิ่มขอบ
            backgroundColor: "rgba(0,121,107,0.85)", // ใช้สีพื้นหลังของ Paper
          }}
          variant='outlined'
        >
          <CardHeader
            title={<Typography variant="h6" component="div" color="white">{qrData[0].Code}</Typography>}
            subheader={<Typography variant="body1" component="div" color="white">{qrData[0].Name}</Typography>}
          />
          <ImageList cols={2}>
            <ImageListItem key={qrData[0]?.ImagePath}>
              <CardMedia
                component="img"
                height="160"
                sx={{ objectFit: 'cover', cursor: 'pointer', p: 1 }}
                onClick={() => handleClickOpen(qrData[0]?.ImagePath, 0)}
                image={qrData[0]?.ImagePath || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png"}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
                }}
                alt={`${qrData[0]?.Name}_1`}
              />
            </ImageListItem>
            <ImageListItem key={qrData[0]?.ImagePath_2}>
              <CardMedia
                component="img"
                height="160"
                sx={{ objectFit: 'cover', cursor: 'pointer', p: 1 }}
                onClick={() => handleClickOpen(qrData[0]?.ImagePath_2, 1)}
                image={qrData[0]?.ImagePath_2 || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png"}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
                }}
                alt={`${qrData[0]?.Name}_2`}
              />
            </ImageListItem>
          </ImageList>
          <CardContent>
            <Typography variant="body1" color="white">SerialNo: {qrData[0]?.SerialNo || '-'}</Typography>
            <Typography variant="body1" color="white">ผู้ถือครอง: {qrData[0]?.ownerCode || '-'}</Typography>
            <Typography variant="body1" color="white">สาขาที่อยู่: {qrData[0]?.BranchName || '-'} {qrData[0]?.BranchID ? `(ID=${qrData[0]?.BranchID})` : `-`}</Typography>
            <Typography variant="body1" color="white">
              วันที่ขึ้นทะเบียน: {qrData[0]?.CreateDate
                ? dayjs.tz(qrData[0].CreateDate, "Asia/Bangkok").format("YYYY-MM-DD")
                : '-'}
            </Typography>
            <Typography variant="body1" color="white">สถานะปัจจุบัน: {qrData[0]?.Details || '-'}</Typography>
          </CardContent>
        </Card>
      )}
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
    </Box>
  );
};