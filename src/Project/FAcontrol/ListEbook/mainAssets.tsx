import { GridCellParams, GridColDef } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { AssetRecord, Assets_TypeGroup, CountAssetRow } from '../../../type/nacType';
import { Stack, Typography, AppBar, Container, Toolbar, Autocomplete, TextField, Box, ImageListItem, CardActionArea, CardContent, ImageList, Pagination, CardMedia, Tab, Tabs } from "@mui/material";
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid2';
import ImageCell from "./ClickOpenImg";
import Loading from "../../../components/Loading";
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import client from "../../../lib/axios/interceptor";

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(1),
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
  '&:hover': {
    border: `2px solid ${theme.palette.primary.main}`,
    // boxShadow: `0 2px 10px ${theme.palette.primary.main}33`,
  },
}));


export default function ListNacPage() {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<AssetRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);

  // State สำหรับการกรองแต่ละฟิลด์
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;
  const [originalRows, setOriginalRows] = React.useState<AssetRecord[]>([]);
  const [filter, setFilter] = React.useState<Partial<AssetRecord>>({
    Code: undefined,
    Name: undefined,
    OwnerID: undefined,
    Asset_group: undefined,
    Group_name: undefined,
    Position: undefined,
  });

  const handleChangeFilterNAC = (newValue: string | number | undefined, id: string) => {
    setFilter(prevFilter => {
      const updatedFilter = { ...prevFilter, [id]: newValue };

      const filteredRows = originalRows.filter(res =>
        Object.entries(updatedFilter).every(([key, value]) =>
          value === undefined || value === null || res[key as keyof AssetRecord] === value
        )
      );

      const filterType = filteredRows.filter(res => res.typeCode === assets_TypeGroupSelect)
      setRows(filterType); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
      return updatedFilter;
    });
  };

  const fetchData = async () => {
    try {
      const response = await client.post(
        `/FA_Control_Fetch_Assets`,
        { usercode: parsedData.UserCode },
        { headers: dataConfig().header }
      );

      const resFetchAssets = await client.get(
        `/FA_Control_Assets_TypeGroup`,
        { headers: dataConfig().header }
      );
      const resData: Assets_TypeGroup[] = resFetchAssets.data;
      setAssets_TypeGroup(resData);
      setAssets_TypeGroupSelect(resData[0].typeCode)

      const permiss = await client.post(
        `/select_Permission_Menu_NAC`,
        { Permission_TypeID: 1, userID: parsedData.userid },
        { headers: dataConfig().header }
      );
      setPermission_menuID(permiss.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))

      if (response.status === 200) {
        const dataLog = permiss.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID).includes(5)
          ? response.data.filter((res: AssetRecord) => res.typeCode === resData[0].typeCode)
          : response.data.filter((res: AssetRecord) => res.typeCode === resData[0].typeCode && res.OwnerID === parsedData.UserCode)
        setLoading(false)
        setRows(dataLog);
        setOriginalRows(response.data)
      } else {
        setLoading(false)
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  React.useEffect(() => {
    setLoading(true)
    fetchData();
  }, [parsedData.UserCode, pathname]);

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
            ทะเบียนทรัพย์สินทั้งหมด
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ my: 2 }} maxWidth="xl">
        <Grid container spacing={2} sx={{ py: 1 }}>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.Code || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Code')}
              options={rows ? Array.from(new Set(rows.map(res => res.Code).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Code" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.Name || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Name')}
              options={rows ? Array.from(new Set(rows.map(res => res.Name).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Name" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.OwnerID || ''}
              onChange={(e, newValue, reason) => handleChangeFilterNAC(newValue ?? undefined, 'OwnerID')}
              options={rows ? Array.from(new Set(rows.map(res => res.OwnerID).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="OwnerCode" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.Asset_group || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Asset_group')}
              options={rows ? Array.from(new Set(rows.map(res => res.Asset_group).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Asset_group" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.Group_name || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Asset_group')}
              options={rows ? Array.from(new Set(rows.map(res => res.Group_name).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Group_name" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filter.Position || ''}
              onChange={(e, newValue) => handleChangeFilterNAC(newValue ?? undefined, 'Position')}
              options={rows ? Array.from(new Set(rows.map(res => res.Position).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="Location" />}
            />
          </Grid>
        </Grid>
        {/* <MuiCard variant="outlined" sx={{ width: '100%' }}> */}
        <Grid container spacing={2} sx={{ py: 2, m: 1 }}>
          <Grid display="flex" justifyContent="flex-start" alignItems="flex-start" size={12}>
            <Pagination
              count={Math.ceil(rows.length / itemsPerPage)}
              variant="outlined"
              shape="rounded"
              onChange={(event: React.ChangeEvent<unknown>, value: number) => {
                setCurrentPage(value)
              }}
            />
          </Grid>
          <Grid justifyContent="flex-start" size={12} sx={{ mt: 2 }}>
            <Tabs
              // originalRows
              value={assets_TypeGroupSelect}
              onChange={(event: React.SyntheticEvent, newValue: string) => {
                const filterRows = { ...filter }
                const filteredRows = originalRows.filter(res =>
                  Object.entries(filterRows).every(([key, value]) =>
                    value === undefined || value === null || res[key as keyof AssetRecord] === value
                  )
                )
                const typeFil =
                  permission_menuID.includes(5) ? filteredRows.filter(res => res.typeCode === newValue) :
                    filteredRows.filter(res => res.typeCode === newValue && res.OwnerID === parsedData.UserCode)
                setRows(typeFil); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
                setAssets_TypeGroupSelect(newValue);
              }}
            >
              {assets_TypeGroup.map((res) => (
                <Tab
                  label={`${res.typeCode} (${res.typeName})`}
                  value={res.typeCode}
                  key={res.typeGroupID}
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
          </Grid>
          {loading && (
            <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
              <Loading />
            </Grid>
          )}
          {!loading && rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((res, index) => (
            <Grid display="flex" key={res.AssetID} justifyContent="center" alignItems="center" size={3}>
              <Card variant="outlined">
                <ImageList sx={{ height: 140, objectFit: 'cover', cursor: 'pointer' }} cols={2}>
                  <div>
                    <ImageCell
                      imagePath={res.ImagePath ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png'}
                      name={'Image 1'}
                      originalRows={originalRows}
                      rows={rows}
                      rowData={res}
                      index={index}
                      fieldData={`ImagePath`}
                      setRows={setRows}
                      setOriginalRows={setOriginalRows}
                    />
                  </div>
                  <div>
                    <ImageCell
                      imagePath={res.ImagePath_2 ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png'}
                      name={'Image '}
                      originalRows={originalRows}
                      rows={rows}
                      rowData={res}
                      index={index}
                      fieldData={`ImagePath_2`}
                      setRows={setRows}
                      setOriginalRows={setOriginalRows}
                    />
                  </div>
                </ImageList>
                <CardContent>
                  <Typography gutterBottom variant="h6">
                    รหัสทรัพย์สิน: {res.Code}
                  </Typography>
                  <Grid container>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        ชื่อทรัพย์สิน: {res.Name}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        ผู้ถือครอง: {res.OwnerID} ({res.Position})
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        SerialNo: {res.SerialNo ?? '-'}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        Asset Group: {res.Asset_group ?? '-'}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        Group Name: {res.Group_name ?? '-'}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2">
                        สถานะปัจจุบัน: {res.Details}
                      </Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography gutterBottom variant="body2" color={res.nac_processing ? 'error' : 'default'}>
                        NAC STATUS: {res.nac_processing ? `ถูกใช้งานที่ ${res.nac_processing}` : '-'}
                      </Typography>
                    </Grid>
                    {/* nac_processing */}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Outlet />
      </Container>
    </React.Fragment >
  );
}