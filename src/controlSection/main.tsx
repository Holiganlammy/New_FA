import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { Alert, alpha, AppBar, Avatar, Button, CardActions, CardHeader, Container, Divider, InputBase, List, ListItem, ListItemAvatar, ListItemText, Stack, styled, TextField, Toolbar } from '@mui/material';
import dataConfig from '../config';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import ControlUsers from './users';
import PermissionUsers from './permissionUser'
import Organization from './organization/main'
import PersonPinOutlinedIcon from '@mui/icons-material/PersonPinOutlined';
import client from '../lib/axios/interceptor';

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
    headers: dataConfig().header,
  });
  return response.data;
}

export default function Profile() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };


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
            Control Section
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
                ส่วนสำหรับควบคุมระบบ (Operation)
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
                      icon={<PersonPinOutlinedIcon />}
                      iconPosition="start"
                      label="List Users"
                      value={0}
                      sx={{
                        height: '40px',
                        minHeight: '40px',
                        textTransform: 'none',
                        fontFamily: 'cursiveRoboto, sans-serif',
                        fontWeight: 500
                      }}
                    />
                    <Tab
                      icon={<CorporateFareIcon />}
                      iconPosition="start"
                      label="Organization"
                      value={1}
                      sx={{
                        height: '40px',
                        minHeight: '40px',
                        textTransform: 'none',
                        fontFamily: 'cursiveRoboto, sans-serif',
                        fontWeight: 500
                      }}
                    />
                    <Tab
                      icon={<LockPersonOutlinedIcon />}
                      iconPosition="start"
                      label="Permission"
                      value={2}
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
                {value === 0 && (<ControlUsers />)}
                {value === 1 && (<Organization />)}
                {value === 2 && (<PermissionUsers />)}
              </Grid>
            </Card>
          </Box>
        </Container>
      </Box>
    </React.Fragment>
  );
}