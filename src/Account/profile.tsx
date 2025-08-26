import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { Alert, alpha, AppBar, Avatar, Button, CardActions, CardHeader, Container, Divider, InputBase, List, ListItem, ListItemAvatar, ListItemText, Stack, styled, TextField, Toolbar } from '@mui/material';
import { UserInfo, ResetPass } from '../type/nacType';
import Swal from 'sweetalert2';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import dataConfig from '../config';
import SaveIcon from '@mui/icons-material/Save';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import client from '../lib/axios/interceptor';

const ValidationTextField = styled(TextField)(({ theme }) => ({
  width: '100%', // แทน fullWidth
  backgroundColor: 'rgb(248, 250, 252)', // แทน bgcolor
}));

const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url); // จะ throw error หาก URL ไม่ถูกต้อง
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'; // ตรวจสอบว่าเป็น http หรือ https
  } catch (error) {
    return false; // ไม่ใช่ URL ที่ถูกต้อง
  }
};

const isValidData = (data: ResetPass[]): boolean => {
  const allFieldsFilled = data.every(
    (item) =>
      (item.current_password || '').trim() !== '' &&
      (item.new_password || '').trim() !== '' &&
      (item.confirm_password || '').trim() !== ''
  );

  return allFieldsFilled;
};

interface LoginCredentials {
  UserCode: string;
  Password: string;
}

interface LoginResponse {
  token?: string;
  data: Array<{ userid: string }>;
}

async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await client.post('/login', JSON.stringify(credentials), {
    headers: dataConfig().header
  });
  return response.data;
}

export default function Profile() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [userInfo, setUserInfo] = React.useState<UserInfo[]>([])
  const [resetPass, setResetPass] = React.useState<ResetPass[]>([{
    current_password: '',
    new_password: '',
    confirm_password: '',
  }])
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };


  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const allowedImageExtensions = ['jpg', 'png', 'gif', 'jpeg'];
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension && allowedImageExtensions.includes(fileExtension)) {
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        try {
          const response = await client.post(
            '/check_files_NewNAC',
            formData_1,
            { headers: dataConfig().headerUploadFile }
          );

          if (response.status === 200) {
            const list = [...userInfo];
            list[0].img_profile = `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`;
            setUserInfo(list);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        console.warn("Invalid file type.");
      }
    }
  };

  const SavedChangeUserInfo = async () => {
    if (!isValidUrl(userInfo && userInfo[0]?.img_profile || parsedData.img_profile)) {
      Swal.fire({
        icon: "error",
        title: `Valid URL: ${userInfo && userInfo[0]?.img_profile || parsedData.img_profile}`,
        showConfirmButton: false,
        timer: 1500
      })
    } else {
      try {
        const res = await client.post(
          '/User_UpdateUserInfo', userInfo && userInfo[0] || parsedData,{ 
            headers: dataConfig().header
          });
        if (res.status === 200) {
          localStorage.setItem('data', JSON.stringify(res.data[0]));
          setUserInfo(res.data)
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  }

  const ChangePass = async () => {
    const response = await loginUser({
      UserCode: parsedData.UserCode,
      Password: resetPass[0].current_password || '',
    });
    if ('token' in response) {
      const resChangePass = await client.post(
        '/User_ResetPassword',
        { loginname: parsedData.UserCode, newpassword: resetPass[0].new_password || '' },
        { headers: dataConfig().header }
      );
      if (resChangePass.status === 200) {
        setResetPass([{
          current_password: '',
          new_password: '',
          confirm_password: '',
        }])
        Swal.fire({
          icon: "success",
          title: `เปลี่ยนรหัสผ่านสำเร็จ`,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: `รหัสผ่านปัจจุบันผิด กรุณาลองใหม่อีกครั้ง`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }

  React.useEffect(() => {
    if (parsedData) {
      setUserInfo([parsedData])
    }
  }, [])


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
            Profile
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: '45vh',
          mb: 2
        }}
      >
        <Container component="main" sx={{ my: 2, }} maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card
              variant='outlined'
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', md: 'row' },
                width: '100%',
                justifyContent: 'space-between',
                alignItems: { xs: 'start', md: 'center' },
                gap: 2,
                overflow: 'auto',
                p: 2
              }}
            >
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Profile: {parsedData.fristName} {parsedData.lastName}
              </Typography>
            </Card>
            <Card
              variant='outlined'
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', md: 'row' },
                width: '100%',
                justifyContent: 'space-between',
                alignItems: { xs: 'start', md: 'center' },
                gap: 2,
                overflow: 'auto',
                p: 2
              }}
            >
              <Grid
                container
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
                spacing={3}
              >
                <Grid size={12}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="nav tabs example"
                    role="navigation"
                    sx={{
                      height: '40px',
                      minHeight: '40px',
                    }}
                  >
                    <Tab
                      icon={<ArticleOutlinedIcon />}
                      iconPosition="start"
                      label="Personal Details"
                      sx={{
                        height: '40px',
                        minHeight: '40px',
                        textTransform: 'none',
                        fontFamily: 'cursiveRoboto, sans-serif',
                        fontWeight: 500
                      }}
                    />
                    <Tab
                      icon={<LockOutlinedIcon />}
                      iconPosition="start"
                      label="Change Password"
                      sx={{
                        height: '40px',
                        minHeight: '40px',
                        textTransform: 'none',
                        fontFamily: 'cursiveRoboto, sans-serif',
                        fontWeight: 500
                      }}
                    />
                  </Tabs>
                  <Divider />
                </Grid>
                {value === 0 ? (
                  <React.Fragment>
                    <Grid size={6}>
                      <Card variant='outlined'>
                        <CardHeader
                          subheader={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                minHeight: 15,
                                maxHeight: 15,
                                fontWeight: 500,
                                fontFamily: 'Roboto, sans-serif'
                              }}
                            >
                              Profile
                            </Typography>
                          }
                        />
                        <Divider sx={{ my: 1 }} />
                        <CardContent>
                          <Grid
                            container
                            direction="row"
                            spacing={2}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
                              <Avatar
                                alt={userInfo && userInfo[0]?.UserCode || parsedData.UserCode}
                                src={userInfo && userInfo[0]?.img_profile || parsedData.img_profile}
                                sx={{
                                  width: 150, // เพิ่มขนาดความกว้าง
                                  height: 150, // เพิ่มขนาดความสูง
                                }}
                              />
                            </Grid>
                            <Grid size={12}>
                              <Grid
                                container
                                direction="row"
                                spacing={2}
                                sx={{
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Grid size={10}>
                                  <ValidationTextField
                                    size="small"
                                    value={userInfo && userInfo[0]?.img_profile || parsedData.img_profile}
                                    fullWidth
                                    onChange={(e) => {
                                      const list = [...userInfo]
                                      list[0].img_profile = e.target.value
                                      setUserInfo(list)
                                    }}
                                  />
                                </Grid>
                                <Grid size={2}>
                                  <Button
                                    variant="contained"
                                    endIcon={<AttachFileIcon />}
                                    component="label"  // เพิ่มเพื่อให้ปุ่มทำหน้าที่เหมือน Label สำหรับ <input>
                                    sx={{
                                      textTransform: 'none',
                                      width: '100%',
                                      bgcolor: 'rgb(103, 58, 183)',
                                      color: 'white',  // เพิ่มสีข้อความให้เห็นชัดเจน
                                      '&:hover': { bgcolor: 'rgba(103, 58, 183,0.9)' }  // เพิ่มเอฟเฟกต์ hover
                                    }}
                                  >
                                    Upload
                                    <input
                                      hidden
                                      type="file"
                                      name="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadFile(e)}  // ฟังก์ชันที่รับไฟล์
                                    />
                                  </Button>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={6}>
                      <Card variant='outlined'>
                        <CardHeader
                          subheader={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                minHeight: 15,
                                maxHeight: 15,
                                fontWeight: 500,
                                fontFamily: 'Roboto, sans-serif'
                              }}
                            >
                              Personal Information
                            </Typography>
                          }
                        />
                        <Divider sx={{ my: 1 }} />
                        <CardContent>
                          <Grid
                            container
                            direction="row"
                            spacing={2}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Grid size={6}>
                              <ValidationTextField
                                label="FristName"
                                size="small"
                                value={userInfo && userInfo[0]?.fristName || parsedData.fristName}
                                fullWidth
                                onChange={(e) => {
                                  const list = [...userInfo]
                                  list[0].fristName = e.target.value
                                  setUserInfo(list)
                                }}
                              />
                            </Grid>
                            <Grid size={6}>
                              <ValidationTextField
                                label="LastName"
                                value={userInfo && userInfo[0]?.lastName || parsedData.lastName}
                                size="small"
                                fullWidth
                                onChange={(e) => {
                                  const list = [...userInfo]
                                  list[0].lastName = e.target.value
                                  setUserInfo(list)
                                }}
                              />
                            </Grid>
                            <Grid size={12}>
                              <TextField
                                label="Email"
                                size="small"
                                value={userInfo && userInfo[0]?.Email || parsedData.Email}
                                sx={{ bgcolor: 'rgb(248, 250, 252)' }}
                                onChange={(e) => {
                                  const list = [...userInfo]
                                  list[0].Email = e.target.value
                                  setUserInfo(list)
                                }}
                                fullWidth
                              />
                            </Grid>
                            <Grid size={6}>
                              <TextField
                                label="BrachID"
                                size="small"
                                value={userInfo && userInfo[0]?.branchid || parsedData.branchid}
                                sx={{ bgcolor: 'rgb(248, 250, 252)' }}
                                fullWidth
                                type="number"
                              />
                            </Grid>
                            <Grid size={6}>
                              <TextField
                                label="Department"
                                size="small"
                                value={userInfo && userInfo[0]?.depcode || parsedData.depcode}
                                sx={{ bgcolor: 'rgb(248, 250, 252)' }}
                                fullWidth
                              />
                            </Grid>
                            <Grid size={12}>
                              <TextField
                                label="Positon"
                                size="small"
                                value={userInfo && userInfo[0]?.dep || parsedData.dep}
                                sx={{ bgcolor: 'rgb(248, 250, 252)' }}
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={12} justifyItems="flex-end">
                      <Button
                        variant="contained"
                        endIcon={<SaveIcon />}
                        color="warning"
                        sx={{ textTransform: 'none' }}
                        disabled={JSON.stringify(userInfo[0]) === JSON.stringify(parsedData)}
                        onClick={(e) => {
                          Swal.fire({
                            title: "Do you want to save the changes?",
                            showCancelButton: true,
                            confirmButtonText: "Save",
                          }).then((result) => {
                            /* Read more about isConfirmed, isDenied below */
                            if (result.isConfirmed) {
                              SavedChangeUserInfo()
                            }
                          });
                        }}
                      >
                        Save Change
                      </Button>
                    </Grid>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Grid size={12}>
                      <Alert variant="outlined" severity="warning">
                        Alert! <br />
                        Your Password will expire in every 3 months. So change it periodically. Do not share your password
                      </Alert>
                    </Grid>
                    <Grid size={12}>
                      <Card variant='outlined'>
                        <CardHeader
                          subheader={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                minHeight: 15,
                                maxHeight: 15,
                                fontWeight: 500,
                                fontFamily: 'Roboto, sans-serif'
                              }}
                            >
                              Change Password
                            </Typography>
                          }
                        />
                        <Divider sx={{ my: 1 }} />
                        <CardContent>
                          <Grid
                            container
                            direction="row"
                            spacing={2}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Grid size={6}>
                              <ValidationTextField
                                label="Current Password"
                                size="small"
                                value={resetPass[0].current_password || ''}
                                fullWidth
                                onChange={(e) => {
                                  const list = [...resetPass]
                                  list[0].current_password = e.target.value
                                  setResetPass(list)
                                }}
                              />
                            </Grid>
                            <Grid size={6} />
                            <Grid size={6}>
                              <ValidationTextField
                                label="New Password"
                                value={resetPass[0].new_password || ''}
                                size="small"
                                fullWidth
                                onChange={(e) => {
                                  const list = [...resetPass]
                                  list[0].new_password = e.target.value
                                  setResetPass(list)
                                }}
                              />
                            </Grid>
                            <Grid size={6}>
                              <TextField
                                label="Confirm Password"
                                size="small"
                                value={resetPass[0].confirm_password || ''}
                                sx={{ bgcolor: 'rgb(248, 250, 252)' }}
                                onChange={(e) => {
                                  const list = [...resetPass]
                                  list[0].confirm_password = e.target.value
                                  setResetPass(list)
                                }}
                                fullWidth
                              />
                            </Grid>
                            <Grid size={12}>
                              <Button
                                variant="contained"
                                endIcon={<SaveIcon />}
                                color="warning"
                                sx={{ textTransform: 'none' }}
                                disabled={!isValidData(resetPass)}
                                onClick={async (e) => {
                                  const passwordsMatch = resetPass.every(
                                    (item) => item.new_password === item.confirm_password
                                  );
                                  if (!passwordsMatch) {
                                    Swal.fire({
                                      icon: "warning",
                                      title: `New password และ Confirm password ไม่ตรงกัน`,
                                      showConfirmButton: false,
                                      timer: 1500
                                    });
                                  } else {
                                    ChangePass()
                                  }
                                }}
                              >
                                Save Change
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </React.Fragment>
                )}
              </Grid>
            </Card>
          </Box>
        </Container>
      </Box>
    </React.Fragment>
  );
}