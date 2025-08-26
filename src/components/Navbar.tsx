import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, Button, ListItemIcon, ListItemText, Stack } from '@mui/material';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeViewMenu from './TreeViewMenu';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { UserInfo } from '../type/nacType';
import dataConfig from '../config';
import LockResetIcon from '@mui/icons-material/LockReset';
import client from '../lib/axios/interceptor';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function MenuAppBar() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [openTree, setOpenTree] = React.useState(false);

  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [userData, setUserData] = React.useState<UserInfo>();
  const [auth, setAuth] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);

  // ตรวจสอบว่าอยู่ในหน้า ResetPassword หรือไม่
  const isResetPasswordPage = location.pathname === '/ResetPassword';

  React.useEffect(() => {
    const fetData = async () => {
      const body = { Permission_TypeID: 1, userID: parsedData.userid }
  
      await client.post('/select_Permission_Menu_NAC', body, { headers: dataConfig().header })
        .then(response => {
          setPermission_menuID(response.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))
        });
    }
    fetData();
  }, []);

  // ปิด drawer เมื่ออยู่ในหน้า ResetPassword
  React.useEffect(() => {
    if (isResetPasswordPage) {
      setOpenTree(false);
      setAnchorEl(null); // ปิด user menu ด้วย
    }
  }, [isResetPasswordPage]);

  const toggleDrawerTree = (newOpen: boolean) => () => {
    // ห้ามเปิด drawer ในหน้า ResetPassword
    if (isResetPasswordPage) {
      return;
    }
    setOpenTree(newOpen);
  };

  const DrawerList = (
    <Box sx={{ minWidth: 300 }}>
      <DrawerHeader>
        <IconButton onClick={toggleDrawerTree(false)}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <TreeViewMenu />
    </Box>
  );

  const handleLogOut = () => {
    localStorage.clear();
    setAuth(false);
    navigate('/');
    window.location.reload();
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    // ห้ามเปิด user menu ในหน้า ResetPassword
    if (isResetPasswordPage) {
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    // ป้องกันการ navigate ในหน้า ResetPassword ยกเว้นการ logout
    if (isResetPasswordPage && path !== '/') {
      return;
    }
    navigate(path);
  };

  React.useEffect(() => {
    const storedData = localStorage.getItem('data');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ThemeProvider theme={darkTheme}>
        <AppBar
          position="static"
          color="default"
          elevation={0}
        >
          {/* ไม่แสดง Drawer ในหน้า ResetPassword */}
          {!isResetPasswordPage && (
            <Drawer
              sx={{
                minWidth: 300,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  minWidth: 300,
                  boxSizing: 'border-box',
                },
              }}
              open={openTree} 
              onClose={toggleDrawerTree(false)}
            >
              {DrawerList}
            </Drawer>
          )}
          
          <Toolbar>
            <Stack direction="row" component="div" sx={{ flexGrow: 1 }}>
              {/* แสดง burger menu เฉพาะเมื่อไม่ได้อยู่ในหน้า ResetPassword */}
              {!isResetPasswordPage && (
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ mr: 2 }}
                  onClick={toggleDrawerTree(true)}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              {/* แสดง Reset Password icon แทนเมื่ออยู่ในหน้า ResetPassword */}
              {isResetPasswordPage && (
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  <LockResetIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="body2" color="warning.main">
                    กำลังเปลี่ยนรหัสผ่าน
                  </Typography>
                </Box>
              )}

              <Button 
                onClick={() => handleNavigation("/")} 
                variant='text'
                disabled={isResetPasswordPage}
                sx={{
                  opacity: isResetPasswordPage ? 0.5 : 1,
                  cursor: isResetPasswordPage ? 'not-allowed' : 'pointer'
                }}
              >
                <Typography
                  style={{ color: isResetPasswordPage ? '#666' : '#ea0c80' }}
                  variant="body1"
                  sx={{
                    flexGrow: 1,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3em',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <b>DATA</b>
                </Typography>
                <Typography
                  style={{ color: isResetPasswordPage ? '#666' : '#07519e' }}
                  variant="body1"
                  sx={{
                    flexGrow: 1,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3em',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <b>CENTER</b>
                </Typography>
              </Button>
            </Stack>
            
            <Stack direction="row" component="div" spacing={2} sx={{ justifyContent: "center", alignItems: "center", }}>
              <Typography variant="body1">
                <b>{userData?.name}</b>
              </Typography>
              
              {auth && (
                <div>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                    disabled={isResetPasswordPage}
                    sx={{
                      opacity: isResetPasswordPage ? 0.5 : 1,
                      cursor: isResetPasswordPage ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Avatar
                      alt={userData && userData.UserCode || ''}
                      src={userData && userData.img_profile || ''}
                      sx={{ 
                        width: 35, 
                        height: 35,
                        opacity: isResetPasswordPage ? 0.5 : 1
                      }}
                    />
                  </IconButton>
                  
                  {/* User menu - ไม่แสดงในหน้า ResetPassword */}
                  {!isResetPasswordPage && (
                    <Menu
                      sx={{ mt: '45px' }}
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                    >
                      <MenuItem 
                        disabled={userData?.depcode !== '101ITO'} 
                        onClick={() => handleNavigation('/Profile')}
                      >
                        <ListItemIcon sx={{ minWidth: '15% !important' }}>
                          <ManageAccountsOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText>&nbsp; &nbsp;User Profile</ListItemText>
                      </MenuItem>
                      
                      {permission_menuID.includes(20) && (
                        <MenuItem onClick={() => handleNavigation('/ControlSection')}>
                          <ListItemIcon sx={{ minWidth: '15% !important' }}>
                            <AdminPanelSettingsOutlinedIcon />
                          </ListItemIcon>
                          <ListItemText>&nbsp; &nbsp;Control section</ListItemText>
                        </MenuItem>
                      )}
                      
                      <MenuItem onClick={handleLogOut}>
                        <ListItemIcon sx={{ minWidth: '15% !important' }}>
                          <LogoutOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText>&nbsp; &nbsp;Log Out</ListItemText>
                      </MenuItem>
                    </Menu>
                  )}
                  
                  {/* แสดงเฉพาะปุ่ม Logout ในหน้า ResetPassword */}
                  {isResetPasswordPage && (
                    <Menu
                      sx={{ mt: '45px' }}
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                    >
                      <MenuItem disabled>
                        <ListItemIcon sx={{ minWidth: '15% !important' }}>
                          <LockResetIcon />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body2" color="text.secondary">
                            กรุณาเปลี่ยนรหัสผ่านก่อน
                          </Typography>
                        </ListItemText>
                      </MenuItem>
                      
                      <Divider />
                      
                      <MenuItem onClick={handleLogOut}>
                        <ListItemIcon sx={{ minWidth: '15% !important' }}>
                          <LogoutOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText>&nbsp; &nbsp;Log Out</ListItemText>
                      </MenuItem>
                    </Menu>
                  )}
                </div>
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      </ThemeProvider>
    </Box>
  );
}