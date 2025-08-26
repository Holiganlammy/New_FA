import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useNavigate } from "react-router";
import { Avatar, Button, ListItemIcon, ListItemText, Stack } from '@mui/material';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeViewMenu from '../../../components/TreeViewMenu';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { UserInfo } from '../../../type/nacType';
import dataConfig from '../../../config';
import Login from '../../../login';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});


export default function MenuAppBar() {
  const theme = useTheme();

  const navigate = useNavigate();
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [userData, setUserData] = React.useState<UserInfo>();
  const [auth, setAuth] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogOut = () => {
    localStorage.clear();
    setAuth(false);
    window.location.reload();
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    <Toolbar>
      <Stack direction="row" component="div" sx={{ flexGrow: 1 }}>
        <Button onClick={() => navigate("/")}>
          <Typography variant="body1" sx={{ color: 'white' }}>
            <b>{userData?.name}</b>
          </Typography>
        </Button>
      </Stack>
      <Stack direction="row" component="div" spacing={2} sx={{ justifyContent: "center", alignItems: "center", }}>
        {auth && (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                alt={userData && userData.UserCode || ''}
                src={userData && userData.img_profile || ''}
                sx={{ width: 35, height: 35 }}
              />
            </IconButton>
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
              <MenuItem disabled={userData?.depcode !== '101ITO'} onClick={() => navigate(`/Profile`)}>
                <ListItemIcon sx={{ minWidth: '15% !important' }}>
                  <ManageAccountsOutlinedIcon />
                </ListItemIcon>
                <ListItemText>&nbsp; &nbsp;User Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogOut}>
                <ListItemIcon sx={{ minWidth: '15% !important' }}>
                  <LogoutOutlinedIcon />
                </ListItemIcon>
                <ListItemText>&nbsp; &nbsp;Log Out</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        )}
      </Stack>
    </Toolbar>
  );
}
