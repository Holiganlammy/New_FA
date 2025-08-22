import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockResetIcon from '@mui/icons-material/LockReset';
import LockClockIcon from '@mui/icons-material/LockClock';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { dataConfig } from "./config"
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { IconButton, InputAdornment, Alert } from '@mui/material';
import { he } from 'zod/v4/locales/index.cjs';

const defaultTheme = createTheme();

interface ResetPasswordData {
  userId: string | null;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

async function resetPassword(data: ResetPasswordData, resetToken: string): Promise<ResetPasswordResponse> {
  const response = await fetch(dataConfig.http + '/reset_password_expired', {
    method: 'POST',
    headers: {
      ...dataConfig.headers,
      'Authorization': `Bearer ${resetToken}`,
    },
    body: JSON.stringify({
      userId: data.userId,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    })
  });
  return response.json();
}

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '90%',
  height: 'auto',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
    maxHeight: '800px',
    overflow: 'auto',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const ResetPasswordContainer = styled(Stack)(({ theme }) => ({
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

export default function ResetPassword() {
  const navigate = useNavigate();
  
  const strongPasswordSchema = z.string()
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[a-zA-Z]/, 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[!@#$%^&*_\-]/, 'รหัสผ่านต้องมีอักขระพิเศษ !@#$%^&*_- อย่างน้อย 1 ตัว');

  const resetPasswordSchema = z.object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน')
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [showNewPassword, setShowNewPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [resetData, setResetData] = React.useState<{userId: string, reset_password_token: string, expirepassword: boolean} | null>(null);

  const passwordValidation = React.useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-zA-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*_\-]/.test(newPassword),
      passwordsMatch: newPassword === confirmPassword && confirmPassword.length > 0
    };
  }, [newPassword, confirmPassword]);
  
  const isPasswordValid = React.useMemo(() => {
    return Object.values(passwordValidation).every(Boolean);
  }, [passwordValidation]);

  const pageContent = React.useMemo(() => {
    if (!resetData) return null;
    
    if (resetData.expirepassword === true) {
      return {
        icon: <LockClockIcon />,
        iconColor: 'error.main',
        title: 'รหัสผ่านหมดอายุ',
        subtitle: 'รหัสผ่านของคุณหมดอายุแล้ว กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัย',
        alertMessage: 'รหัสผ่านของคุณหมดอายุแล้ว จำเป็นต้องเปลี่ยนรหัสผ่านใหม่เพื่อเข้าใช้งานระบบต่อไป',
        alertSeverity: 'error' as const
      };
    } else {
      return {
        icon: <LockResetIcon />,
        iconColor: 'warning.main',
        title: 'เปลี่ยนรหัสผ่าน',
        subtitle: 'กรุณาตั้งรหัสผ่านใหม่ให้มีความปลอดภัยสูง',
        alertMessage: 'กรุณาตั้งรหัสผ่านใหม่ตามข้อกำหนดด้านล่างเพื่อความปลอดภัย เนื่องจาก คุณไม่เคยเปลี่ยนรหัสผ่าน',
        alertSeverity: 'info' as const
      };
    }
  }, [resetData]);

  React.useEffect(() => {
    const resetPasswordData = localStorage.getItem('Request_ResetPassword');
    
    if (resetPasswordData) {
      try {
        const parsed = JSON.parse(resetPasswordData);
        
        if (parsed.userId && parsed.reset_password_token) {
          setResetData(parsed);
        } else {
          console.log('Invalid reset data structure');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing reset data:', error);
        navigate('/', { replace: true });
      }
    } else {
      console.log('No reset data found');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isPasswordValid) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = resetPasswordSchema.safeParse({
        newPassword,
        confirmPassword
      });

      if (!result.success) {
        const errorMessages = result.error.issues.map((err) => err.message).join('\n');
        Swal.fire({
          icon: 'error',
          title: 'ข้อมูลไม่ถูกต้อง',
          text: errorMessages,
          showConfirmButton: true,
        });
        return;
      }

      const response = await resetPassword({
        userId: resetData?.userId || null,
        newPassword,
        confirmPassword
      }, resetData?.reset_password_token || '');
      
      if (response.success) {
        // แสดงข้อความสำเร็จตามสาเหตุ
        const successMessage = resetData?.expirepassword === true 
          ? 'เปลี่ยนรหัสผ่านที่หมดอายุเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
          : 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่';
        
        await Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรหัสผ่านสำเร็จ',
          text: successMessage,
          showConfirmButton: false,
          timer: 2500
        });

        localStorage.removeItem('request_reset_token');
        localStorage.removeItem('reset_user_id');
        localStorage.removeItem('changepassword');
        localStorage.removeItem('Request_ResetPassword');
        localStorage.clear();
        navigate('/', { replace: true });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
          showConfirmButton: true,
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        showConfirmButton: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = (field: 'new' | 'confirm') => {
    if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmPassword('');
    
    localStorage.removeItem('Request_ResetPassword');
    localStorage.removeItem('changepassword');
    
    navigate('/', { replace: true });
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      {isValid ? (
        <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
      ) : (
        <Cancel sx={{ color: 'error.main', fontSize: 16 }} />
      )}
      <Typography 
        variant="caption" 
        sx={{ 
          color: isValid ? 'success.main' : 'error.main',
          fontWeight: isValid ? 'bold' : 'normal'
        }}
      >
        {text}
      </Typography>
    </Stack>
  );

  // ถ้ายังไม่มีข้อมูล resetData ให้แสดง loading หรือไม่แสดงอะไร
  if (!resetData || !pageContent) {
    return null;
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline enableColorScheme />
      <ResetPasswordContainer direction="column" justifyContent="space-between" alignItems="center">
        <Card variant="outlined">
          {/* แสดง Alert แจ้งเตือนตามสาเหตุ */}
          <Alert 
            severity={pageContent.alertSeverity} 
            sx={{ mb: 2 }}
            icon={pageContent.icon}
          >
            <Typography variant="body2">
              {pageContent.alertMessage}
            </Typography>
          </Alert>

          <Stack
            direction="row"
            spacing={6}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: pageContent.iconColor }}>
              {pageContent.icon}
            </Avatar>
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(1.5rem, 8vw, 2rem)'}}
            >
              {pageContent.title}
            </Typography>
          </Stack>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mb: 2 }}
          >
            {pageContent.subtitle}
          </Typography>

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
              name="newPassword"
              label="รหัสผ่านใหม่"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handleTogglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="ยืนยันรหัสผ่านใหม่"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                  </InputAdornment>
                ),
              }}
            />

            {/* แสดงเงื่อนไขรหัสผ่านพร้อมสถานะ */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                ข้อกำหนดรหัสผ่าน:
              </Typography>
              
              <Stack spacing={0.5}>
                <ValidationItem 
                  isValid={passwordValidation.minLength}
                  text="ความยาวอย่างน้อย 8 ตัวอักษร"
                />
                <ValidationItem 
                  isValid={passwordValidation.hasUppercase}
                  text="ตัวอักษรพิมพ์ใหญ่ อย่างน้อย 1 ตัว (A-Z)"
                />
                <ValidationItem 
                  isValid={passwordValidation.hasLowercase}
                  text="ตัวอักษรภาษาอังกฤษ อย่างน้อย 1 ตัว"
                />
                <ValidationItem 
                  isValid={passwordValidation.hasNumber}
                  text="ตัวเลข อย่างน้อย 1 ตัว (0-9)"
                />
                <ValidationItem 
                  isValid={passwordValidation.hasSpecialChar}
                  text="อักขระพิเศษ อย่างน้อย 1 ตัว (!@#$%^&*_-)"
                />
                {confirmPassword.length > 0 && (
                  <ValidationItem 
                    isValid={passwordValidation.passwordsMatch}
                    text="รหัสผ่านตรงกัน"
                  />
                )}
              </Stack>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !isPasswordValid}
              sx={{ 
                mt: 2, 
                mb: 2,
                bgcolor: isPasswordValid 
                  ? (resetData.expirepassword === true ? 'error.main' : 'warning.main')
                  : 'grey.400',
                '&:hover': {
                  bgcolor: isPasswordValid 
                    ? (resetData.expirepassword === true ? 'error.dark' : 'warning.dark')
                    : 'grey.400',
                },
                '&:disabled': {
                  bgcolor: 'grey.400',
                  color: 'grey.600'
                }
              }}
            >
              {isLoading 
                ? (resetData.expirepassword === true 
                    ? 'กำลังเปลี่ยนรหัสผ่านที่หมดอายุ...' 
                    : 'กำลังเปลี่ยนรหัสผ่าน...'
                  )
                : (resetData.expirepassword === true 
                    ? 'เปลี่ยนรหัสผ่านที่หมดอายุ' 
                    : 'เปลี่ยนรหัสผ่าน'
                  )
              }
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleCancel}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {resetData.expirepassword === true 
                ? 'ออกจากระบบ'
                : 'ยกเลิกและกลับไปหน้าเข้าสู่ระบบ'
              }
            </Button>
          </Box>
        </Card>
      </ResetPasswordContainer>
    </ThemeProvider>
  );
}