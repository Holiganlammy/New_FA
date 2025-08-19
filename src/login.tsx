import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { dataConfig } from "./config"
import Axios from "axios";
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const defaultTheme = createTheme();

interface LoginCredentials {
  UserCode: string;
  Password: string;
}

interface LoginResponse {
  changepassword: boolean;
  token?: string;
  data: Array<{ userid: string, changepassword: boolean }>;
  expirepassword?: boolean;
  request_reset_token?: string;
}

// เพื่อใช้ทดสอบ
async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(dataConfig.http + '/login', {
    method: 'POST',
    headers: dataConfig.headers,
    body: JSON.stringify(credentials)
  });
  return response.json();
}

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
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
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  },
}));

export default function SignInSide() {


  // const loginSchema = z.object({
  //   UserCode: z.string().min(1, 'กรุณากรอก UserCode'),
  //   Password: z.string()
  //     .min(8, 'Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
  //     .regex(/[A-Z]/, 'Password ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
  //     .regex(/[a-zA-Z]/, 'Password ต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว')
  //     .regex(/[0-9]/, 'Password ต้องมีตัวเลขอย่างน้อย 1 ตัว')
  //     .regex(/[!@#$%^&*_\-]/, 'Password ต้องมีอักขระพิเศษ !@#$%^&*_- อย่างน้อย 1 ตัว')
  // });

  // type LoginSchema = z.infer<typeof loginSchema>;
  const [deviceType, setDeviceType] = React.useState<string>("mobile");

  const d = new Date();
  const year = (d.getFullYear()).toString();
  const month = ((d.getMonth()) + 101).toString().slice(-2);
  const date = ((d.getDate()) + 100).toString().slice(-2);
  const hours = ((d.getHours()) + 100).toString().slice(-2);
  const mins = ((d.getMinutes()) + 100).toString().slice(-2);
  const seconds = ((d.getSeconds()) + 100).toString().slice(-2);
  const datenow = `${year + month + date + hours + mins + seconds}`;

  const [UserCode, setUserCode] = React.useState<string | undefined>(undefined);
  const [Password, setPassword] = React.useState<string | undefined>(undefined);
  const [shouldRedirectToReset, setShouldRedirectToReset] = React.useState(false);
  const URL_LINK = window.location.href;
  const pathname = window.location.pathname;
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (UserCode === undefined || Password === undefined) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกข้อมูลเพื่อล็อคอินเข้าสู่ระบบ",
        showConfirmButton: false,
        timer: 1500
      })
      return;
    }

    // const result = loginSchema.safeParse({ UserCode, Password });
    // if (!result.success) {
    //   const errorMessages = result.error.issues.map((err) => err.message).join('\n');
    //   Swal.fire({
    //     icon: 'error',
    //     title: errorMessages,
    //     showConfirmButton: false,
    //     timer: 5000,
    //   });
    //   return;
    // }

    const response = await loginUser({
      UserCode,
      Password
    });
    if (deviceType === 'desktop') {
      if (response.expirepassword === true || response.changepassword === false) {
        localStorage.setItem('Request_ResetPassword', JSON.stringify({
          userId: response.data[0].userid,
          reset_password_token: response.request_reset_token,
          expirepassword: response.expirepassword
        }));
        localStorage.setItem('changepassword', String(response.changepassword));
        
        setShouldRedirectToReset(true);
        return;
      }

      if (response.token) {
        const body = { Permission_TypeID: 1, userID: response.data[0]?.userid };
        await Axios.post(dataConfig.http + '/select_Permission_Menu_NAC', body, dataConfig.headers)
          .then((response: { data: { data: { Permission_MenuID: string }[] } }) => {
            localStorage.setItem('permission_MenuID', JSON.stringify(response.data.data.map((res) => res.Permission_MenuID)));
          });

        localStorage.setItem('token', response.token);
        localStorage.setItem('data', JSON.stringify(response.data[0]));
        localStorage.setItem('date_login', datenow);

        if (pathname !== '/Sign-In') {
          window.location.href = '/Home'
        } else {
          navigate(URL_LINK)
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "UserCode หรือ Password ไม่ถูกต้อง",
          showConfirmButton: false,
          timer: 1500
        })
      }
    } else {
      if (response.expirepassword === true || response.changepassword === false) {
        localStorage.setItem('Request_ResetPassword', JSON.stringify({
          userId: response.data[0].userid,
          reset_password_token: response.request_reset_token
        }));
        localStorage.setItem('changepassword', String(response.changepassword));
        
        setShouldRedirectToReset(true);
        return;
      }
      if (response.token) {
        const body = { Permission_TypeID: 1, userID: response.data[0].userid };
        await Axios.post(dataConfig.http + '/select_Permission_Menu_NAC', body, dataConfig.headers)
          .then((response: { data: { data: { Permission_MenuID: string }[] } }) => {
            localStorage.setItem('permission_MenuID', JSON.stringify(response.data.data.map((res) => res.Permission_MenuID)));
          });

        localStorage.setItem('token', response.token);
        localStorage.setItem('data', JSON.stringify(response.data[0]));
        localStorage.setItem('date_login', datenow);
        navigate('/MobileHome')
      } else {
        Swal.fire({
          icon: "error",
          title: "UserCode หรือ Password ไม่ถูกต้อง",
          showConfirmButton: false,
          timer: 1500
        })
      }
    }
  };
  React.useEffect(() => {
    if (shouldRedirectToReset) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [shouldRedirectToReset]);
  React.useEffect(() => {
    const checkDevice = () => {
      const deviceType = window.innerWidth < 1100 ? "mobile" : "desktop"
      setDeviceType(deviceType);
    };

    checkDevice(); // เช็คขนาดตอนเริ่มต้น
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, [])

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOpenOutlinedIcon />
            </Avatar>
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
            >
              Sign up
            </Typography>
          </Stack>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              label="UserCode"
              name="UserCode"
              onChange={(e) => setUserCode(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
          </Box>
        </Card>
      </SignUpContainer>
      {/* <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline enableColorScheme/>
        <Grid
          size={{ xs: false, sm: 4, md: 7 }}
          sx={{
            backgroundImage: 'url(http://vpnptec.dyndns.org:10280/OPS_Fileupload/ATT_220300007.jpg)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid size={{ xs: 12, sm: 8, md: 5 }} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOpenOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="UserCode"
                name="UserCode"
                onChange={(e) => setUserCode(e.target.value)}
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                เข้าสู่ระบบ
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid> */}
    </ThemeProvider>
  );
}
