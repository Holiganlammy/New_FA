import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { Autocomplete, Button, CardHeader, Divider, List, ListItem, ListItemText, Stack, styled, Switch, TextField } from '@mui/material';
import { UserInfo, ResetPass, DataUser, Permission, MenuPermissionItem } from '../type/nacType';
import Swal from 'sweetalert2';
import dataConfig from '../config';
import SaveIcon from '@mui/icons-material/Save';
import FormControlLabel from '@mui/material/FormControlLabel';
import client from '../lib/axios/interceptor';

const ValidationTextField = styled(TextField)(({ theme }) => ({
  width: '100%', // แทน fullWidth
  backgroundColor: 'rgb(248, 250, 252)', // แทน bgcolor
}));

export default function Profile() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [users, setUsers] = React.useState<DataUser[]>([]);
  const [usersText, setUsersText] = React.useState<string>('');
  const [menuActive, setMenuActive] = React.useState([]);
  const [menu, setMenu] = React.useState<MenuPermissionItem[]>([]);

  const fetuser = async () => {
    await client.get('/User_List', { headers: dataConfig().header })
      .then((res) => {
        setUsers(res.data)
      })

    await client.post('/Permission_Menu_NAC', {}, { headers: dataConfig().header })
      .then((res) => {
        setMenu(res.data.data)
      })
  }

  const OnSelectUser = async (value: string) => {
    await client.post(
      '/Select_Permission_Menu_NAC',
      { Permission_TypeID: 1, UserCode: value },
      { headers: dataConfig().header }
    ).then((res) => {
      if (res.status === 200) {
        setUsersText(value)
        setMenuActive((res.data.data).map((resData: { menuid: number; }) => resData.menuid))
      }
    })
  }

  React.useEffect(() => {
    fetuser()
  }, [])

  const switchActive_User = async (res: MenuPermissionItem) => {
    const body = {
      admin: parsedData.UserCode,
      UserCode: usersText,
      menuid: res.menuid,
      id: menuActive.findIndex((resActive) => resActive === res.menuid) < 0 ? 0 : 1,
    };

    const bodyII = {
      Permission_TypeID: 1,
      UserCode: usersText,
    };

    try {
      const updateResponse = await client.post(
        '/Fix_Assets_Control_UPDATE_Permission',
        body,
        { headers: dataConfig().header }
      );

      if (updateResponse.data.data) {
        const Response = await client.post(
          '/Select_Permission_Menu_NAC',
          bodyII,
          { headers: dataConfig().header }
        );

        if (Response.data.data) {
          setMenuActive(Response.data.data.map((res: { menuid: number; }) => res.menuid));
          setUsersText(usersText);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: `เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง`,
          showConfirmButton: false,
          timer: 1500
        })
      }
    } catch (error) {
      console.error("Error in setActive_User:", error);
      Swal.fire({
        icon: "error",
        title: `เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง`,
        showConfirmButton: false,
        timer: 1500
      })
    }
  };


  return (
    <Card
      variant="outlined"
      sx={{
        width: "100vw",
        maxWidth: "100vw", // ขยายความกว้างให้เต็ม viewport
        margin: "0 auto", // จัดกึ่งกลาง
      }}
    >
      <CardHeader
        subheader={
          <Typography
            variant="subtitle1"
            sx={{
              minHeight: 15,
              maxHeight: 15,
              fontWeight: 500,
              fontFamily: "Roboto, sans-serif",
            }}
          >
            Permission Users
          </Typography>
        }
      />
      <Divider />
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 3, // เพิ่ม padding เพื่อจัดระยะห่าง
        }}
      >
        <Grid container spacing={3} sx={{ width: "100%" }}>
          <Grid size={12}>
            <Autocomplete
              id="free-solo-2-demo"
              options={users.map((option) => option.UserCode)}
              onChange={(event, value) => OnSelectUser(value || "")}
              value={usersText}
              renderInput={(params) => (
                <ValidationTextField
                  {...params}
                  required
                  name="usercode"
                  label="UserCode"
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={12}>
            <List
              sx={{
                width: "100%",
                bgcolor: "background.paper",
              }}
            >
              <ListItemText
                primary="Main"
                primaryTypographyProps={{ style: { fontWeight: "bold" } }}
              />
              {menu
                .filter((res) => res.menutypeid === 5)
                .map((res) => (
                  <React.Fragment key={res.menuid}>
                    <ListItem disablePadding>
                      <FormControlLabel
                        control={<Switch />}
                        label={`${res.menu_name} (${res.menuid})`}
                        onChange={(e) => switchActive_User(res)}
                        checked={
                          menuActive.findIndex((resActive) => resActive === res.menuid) >= 0
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              <ListItemText
                primary="Menu"
                primaryTypographyProps={{ style: { fontWeight: "bold" } }}
              />
              {menu
                .filter((res) => res.menutypeid === 2)
                .map((res) => (
                  <React.Fragment key={res.menuid}>
                    <ListItem disablePadding>
                      <FormControlLabel
                        control={<Switch />}
                        label={`${res.menu_name} (${res.menuid})`}
                        onChange={(e) => switchActive_User(res)}
                        checked={
                          menuActive.findIndex((resActive) => resActive === res.menuid) >= 0
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Document Section */}
            <List
              sx={{
                width: "100%",
                bgcolor: "background.paper",
              }}
            >
              <ListItemText
                primary="Document"
                primaryTypographyProps={{ style: { fontWeight: "bold" } }}
              />
              {menu
                .filter((res) => res.menutypeid === 1)
                .map((res) => (
                  <React.Fragment key={res.menuid}>
                    <ListItem disablePadding>
                      <FormControlLabel
                        control={<Switch />}
                        label={res.menu_name}
                        onChange={(e) => switchActive_User(res)}
                        checked={
                          menuActive.findIndex((resActive) => resActive === res.menuid) >= 0
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}