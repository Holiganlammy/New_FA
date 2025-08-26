import * as React from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import Grid2 from '@mui/material/Grid2';
import { FormControl, Box, OutlinedInput, Button, List, ListItem, ListItemText, Stack, Avatar, ListItemAvatar, InputLabel } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import dataConfig from '../../../../config';
import { RequestCreateDocument, QureyNAC_Comment, SentNAC_File, QureyNAC_File, DataUser } from '../../../../type/nacType';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import ClearIcon from '@mui/icons-material/Clear';
import client from '../../../../lib/axios/interceptor';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');

interface DataFromHeader {
  nac_type: number | null | undefined;
  createDoc: RequestCreateDocument[],
}

const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url); // จะ throw error หาก URL ไม่ถูกต้อง
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'; // ตรวจสอบว่าเป็น http หรือ https
  } catch (error) {
    return false;
  }
};


export default function ChatCard({ nac_type, createDoc }: DataFromHeader) {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [comment, setComment] = React.useState<string>('')
  const [dataComment, setDataComment] = React.useState<QureyNAC_Comment[]>([]);
  const [dataUsers, setDataUsers] = React.useState<DataUser[]>([]);
  // QureyNAC_File
  const [datafile, setDatafile] = React.useState<QureyNAC_File[]>([]);
  const [datafileReq, setDatafileReq] = React.useState<SentNAC_File[]>([{
    nac_code: createDoc[0]?.nac_code || "",
    linkpath: "",
    usercode: parsedData?.UserCode || "",
    description: "",
    create_date: undefined
  }]);

  const handleSubmitFile = async () => {
    if (datafileReq[0]?.linkpath && !isValidUrl(datafileReq[0].linkpath)) {
      Swal.fire({
        icon: "error",
        title: `Valid URL: ${datafileReq[0].linkpath}`,
        showConfirmButton: false,
        timer: 1500
      })
    }
    try {
      const res = await client.post(
        '/stroe_FA_control_Path', datafileReq[0],
        { headers: dataConfig().header }
      );
      if (res.status === 200) {
        const list = [...datafileReq]
        list[0].description = ''
        list[0].linkpath = ''
        setDatafileReq(list)
        setDatafile(res.data)
        const elementScroll = document.getElementById("scroll-input");
        if (elementScroll) {
          elementScroll.scrollTo(0, elementScroll.scrollHeight);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: `Error submitting PATH: ${error}`,
        showConfirmButton: false,
        timer: 1500
      })
    }
  }

  const handleSubmitComment = async () => {
    try {
      const res = await client.post(
        '/store_FA_control_comment', {
        nac_code: createDoc[0].nac_code,
        usercode: parsedData.UserCode,
        comment: comment,
      },
        { headers: dataConfig().header }
      );
      if (res.status === 200) {
        setDataComment(res.data)
        setComment('')
        const elementScroll = document.getElementById("scroll-input");
        if (elementScroll) {
          elementScroll.scrollTo(0, elementScroll.scrollHeight);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: `Error submitting comment: ${error}`,
        showConfirmButton: false,
        timer: 1500
      })
    }
  }

  const fetchComment = async () => {
    try {
      await client.post(dataConfig().http + '/qureyNAC_comment', { nac_code: createDoc[0].nac_code }, { headers: dataConfig().header })
        .then((res) => {
          if (res.status === 200 && res.data.length > 0) {
            setDataComment(res.data)
          }
        })
      await client.post(dataConfig().http + '/qureyNAC_path', { nac_code: createDoc[0].nac_code }, { headers: dataConfig().header })
        .then((res) => {
          if (res.status === 200 && res.data.length > 0) {
            setDatafile(res.data)
          }
        })
    } catch (error) {
      console.log(`Error submitting comment: ${error}`);
    }
  }

  React.useEffect(() => {
    fetchComment();
    fetDataUsers();
  }, [])

  const handleUploadFileComment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get file extension
      if (fileExtension) {
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);
        try {
          const response = await client.post(
            `/check_files_NewNAC`,
            formData_1,
            { headers: dataConfig().headerUploadFile }
          );
          // Check if the index is valid
          if (response.status === 200) {
            const list = [...datafileReq]
            list[0].linkpath = `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`;
            setDatafileReq(list); // Assuming you have a state setter for detailNAC
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

  const fetDataUsers = async () => {
    try {
      const res = await client.get(
        `/User_List`,
        { headers: dataConfig().header }
      );

      if (res.status === 200) {
        setDataUsers(res.data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  if (createDoc) {
    return (
      <Grid2
        container
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          p: 1, m: { xs: 2, md: 3 },
        }}
        spacing={1}
      >
        <Grid2
          size={5}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Card sx={{ width: '100%' }}>
            <CardHeader
              sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
              title="Attachments"
              subheader="(ไฟล์แนบ)"
              subheaderTypographyProps={{ style: { color: 'white' } }}
            />
            <CardContent>
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {datafile.length > 0 &&
                  datafile.map((res, index) => (
                    <Card
                      variant="outlined"
                      key={index}
                      sx={{
                        backgroundColor: "rgba(0,0,0,0.7)",
                        color: "white",
                        mt: index === 0 ? 0 : 1
                      }}
                    >
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          <Stack direction="row" spacing={2}>
                            <IconButton
                              edge="end"
                              aria-label="comments"
                              onClick={() => {
                                if (res.linkpath) {
                                  window.open(res.linkpath, "_blank");
                                } else {
                                  console.error("Invalid linkpath: ", res.linkpath);
                                }
                              }}
                            >
                              <FindInPageIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="comments"
                              name={res.description || ''} // แปลงค่าเป็น string
                            >
                              <ClearIcon sx={{ color: 'white' }} />
                            </IconButton>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={`${res.userid} (${dayjs.tz(res.create_date, "Asia/Bangkok").format('DD/MM/YYYY HH:mm')})`}
                          secondary={
                            <Typography
                              component="span"
                              variant="subtitle2"
                              sx={{ color: 'white' }}
                            >
                              {res.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Card>
                  ))}
              </List>
            </CardContent>
            <CardActions>
              <Grid2
                container
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                spacing={1}
              >
                <Grid2 size={12} display="flex">
                  <Box sx={{ width: '100vw' }}>
                    <FormControl
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      <InputLabel htmlFor="outlined-adornment-url">type a URL</InputLabel>
                      <OutlinedInput
                        id="outlined-adornment-url"
                        value={datafileReq[0].linkpath}
                        onChange={(e) => {
                          const list = [...datafileReq]
                          list[0].linkpath = e.target.value
                          setDatafileReq(list)
                        }}
                        label="type a URL"
                      />

                    </FormControl>
                  </Box>
                </Grid2>
                <Grid2 size={8} display="flex">
                  <Box sx={{ width: '100vw' }}>
                    <FormControl
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      <OutlinedInput
                        onChange={(e) => {
                          if (datafileReq[0]) {
                            const list = [...datafileReq];
                            list[0].description = e.target.value;
                            setDatafileReq(list);
                          }
                        }}
                        value={datafileReq[0]?.description || ''} // ใช้ fallback เป็น string ว่าง
                        id="outlined-adornment-amount"
                      />
                    </FormControl>
                  </Box>
                </Grid2>
                <Grid2 size={2} display="flex">
                  <Button
                    variant="contained"
                    endIcon={<AttachFileIcon />}
                    component="label"  // เพิ่มเพื่อให้ปุ่มทำหน้าที่เหมือน Label สำหรับ <input>
                    sx={{
                      width: '100%',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',  // เพิ่มสีข้อความให้เห็นชัดเจน
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }  // เพิ่มเอฟเฟกต์ hover
                    }}
                  >
                    File
                    <input
                      hidden
                      type="file"
                      name="file"
                      onChange={(e) => handleUploadFileComment(e)}  // ฟังก์ชันที่รับไฟล์
                    />
                  </Button>
                </Grid2>
                <Grid2 size={2} display="flex">
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    sx={{ width: '100vw' }}
                    disabled={(!datafileReq[0].linkpath || !datafileReq[0].description)}
                    onClick={handleSubmitFile}
                  >
                    Send
                  </Button>
                </Grid2>
              </Grid2>
            </CardActions>
          </Card>
        </Grid2>
        <Grid2
          size={7}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Card sx={{ width: '100%' }}>
            <CardHeader
              sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
              title="Comments Chanel"
              subheader="(ช่องแสดงความคิดเห็น)"
              subheaderTypographyProps={{ style: { color: 'white' } }}
            />
            <CardContent>
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {dataComment.length > 0 &&
                  dataComment.map((res, index) => (
                    <Card
                      variant="outlined"
                      key={index}
                      sx={{
                        backgroundColor: res.userid === parsedData.UserCode ? "#2892D7" : "rgba(0,0,0,0.5)",
                        color: "white",
                        marginLeft: res.userid === parsedData.UserCode ? 'auto' : 'initial', // ชิดขวาเมื่อ userid ตรงกัน
                        maxWidth: 300,
                        mt: index === 0 ? 0 : 1
                      }}
                    >
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar
                            alt={res.userid || ''}
                            src={dataUsers.find(resUser => resUser.UserCode === res.userid)?.img_profile || ''}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${res.userid} (${dayjs.tz(res.create_date, "Asia/Bangkok").format('DD/MM/YYYY HH:mm')})`}
                          secondary={
                            <Typography
                              component="span"
                              variant="subtitle2"
                              sx={{ color: 'white' }}
                            >
                              {res.comment}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Card>
                  ))}
              </List>
            </CardContent>
            <CardActions>
              <Grid2
                container
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                spacing={1}
              >
                <Grid2 size={10} display="flex">
                  <Box sx={{ width: '100vw' }}>
                    <FormControl
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      <OutlinedInput
                        onChange={(e) => {
                          setComment(e.target.value)
                        }}
                        id="outlined-adornment-amount"
                      />
                    </FormControl>
                  </Box>
                </Grid2>
                <Grid2 size={2} display="flex">
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    sx={{ width: '100vw' }}
                    disabled={!comment}
                    onClick={handleSubmitComment}
                  >
                    Send
                  </Button>
                </Grid2>
              </Grid2>
            </CardActions>
          </Card>
        </Grid2>
      </Grid2 >
    );
  } else {
    return null;
  }
}
