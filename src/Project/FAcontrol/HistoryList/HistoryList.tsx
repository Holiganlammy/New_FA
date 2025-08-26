import { GridActionsCellItem, GridCellParams, GridColDef, GridRowParams } from "@mui/x-data-grid"
import DataTable from "./DataTable"
import React from "react";
import { NACDetailHistory, ListNACHeaders, Assets_TypeGroup, AssetRecord } from '../../../type/nacType';
import { Typography, AppBar, Container, Toolbar, Autocomplete, TextField, Card, CssBaseline, Tab, Tabs } from "@mui/material";
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import ArticleIcon from '@mui/icons-material/Article';
import Grid from '@mui/material/Grid2';
import client from "../../../lib/axios/interceptor";

export default function ListNacPage() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [rows, setRows] = React.useState<NACDetailHistory[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // State สำหรับการกรองแต่ละฟิลด์
  const [originalRows, setOriginalRows] = React.useState<NACDetailHistory[]>([]);
  const [assets_TypeGroup, setAssets_TypeGroup] = React.useState<Assets_TypeGroup[]>([]);
  const [assets_TypeGroupSelect, setAssets_TypeGroupSelect] = React.useState<string | null>(null);
  const [filterRows, setFilterRows] = React.useState<Partial<NACDetailHistory>>({
    nac_code: undefined,
    nacdtl_assetsCode: undefined,
    nacdtl_assetsName: undefined,
    update_date: undefined,
    source_approve_userid: undefined,
    account_approve_id: undefined,
  });
  const navigate = useNavigate();

  const searchFilterByKey = (newValue: String | null | undefined, id: keyof NACDetailHistory, reason: any) => {
    setFilterRows(prevFilter => {
      const updatedFilter = { ...prevFilter, [id]: newValue };

      const filteredRows = originalRows.filter(res =>
        Object.entries(updatedFilter).every(([key, value]) =>
          value === undefined || value === null || res[key as keyof NACDetailHistory] === value
        )
      );

      const filterType = filteredRows.filter(res => res.typeCode === assets_TypeGroupSelect)
      setRows(filterType); // อัปเดต rows หลังจาก filter เปลี่ยนแปลง
      return updatedFilter;
    });
  };

  const columns: GridColDef[] = [
    { field: 'nacdtl_assetsCode', headerName: 'รหัสทรัพย์สิน', width: 140, headerAlign: 'center', align: 'center', },
    { field: 'nacdtl_assetsName', headerName: 'ชื่อทรัพย์สิน', width: 160, headerAlign: 'center', },
    { field: 'name', headerName: 'หัวข้อรายการ', width: 160, },
    {
      field: 'nacdtl_assetsPrice', headerName: 'ราคาทุน', headerAlign: 'center', align: 'right', flex: 1,
      renderCell: (params) => params.row.nacdtl_assetsPrice ? params.row.nacdtl_assetsPrice.toLocaleString('en-US') : 0,
    },
    {
      field: 'nacdtl_bookV', headerName: 'BV', headerAlign: 'center', align: 'right', flex: 1,
      renderCell: (params) => params.row.nacdtl_bookV ? params.row.nacdtl_bookV.toLocaleString('en-US') : "-",
    },
    {
      field: 'nacdtl_PriceSeals', headerName: 'ราคาขาย', headerAlign: 'center', align: 'right', flex: 1,
      renderCell: (params) => params.row.nacdtl_PriceSeals ? params.row.nacdtl_PriceSeals.toLocaleString('en-US') : "-",
    },
    {
      field: 'nacdtl_profit', headerName: 'Profit', headerAlign: 'center', align: 'right', flex: 1,
      renderCell: (params) => params.row.nacdtl_profit ? params.row.nacdtl_profit.toLocaleString('en-US') : "-",
    },
    { field: 'nac_code', headerName: 'เลขที่ NAC', width: 100, headerAlign: 'center', align: 'center', },
    { field: 'create_by', headerName: 'ผู้ทำรายการ', width: 100, },
    { field: 'source_approve_userid', headerName: 'ผู้อนุมัติ', width: 100, },
    { field: 'account_aprrove_id', headerName: 'ผู้ปิดรายการ', width: 100, },
    { field: 'update_date', headerName: 'วันที่ปิดรายการ', flex: 1, },
    {
      field: 'Actions', type: 'actions', headerAlign: 'center', align: 'center', width: 100,
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<ArticleIcon />}
            label="Edit Row"
            onClick={() => handleEditClick(params)} // Pass params to the function
            color="warning"
          />,
        ];
      },
    },
  ];

  const handleEditClick = (params: GridRowParams<ListNACHeaders>) => {
    const newPageValue = localStorage.getItem('pagination') || 1; // Example for getting page value
    localStorage.setItem('pagination_user', newPageValue.toString());
    localStorage.removeItem("pagination");

    localStorage.setItem('NacCode', JSON.stringify({
      nac_code: params.row.nac_code,
      nac_status: params.row.nac_status
    }));
    navigate(`/NAC_CREATE?id=${params.row.workflowtypeid}?nac_code=${params.row.nac_code}`);
  };

  React.useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {

        const resFetchAssets = await client.get('/FA_Control_Assets_TypeGroup', { headers: dataConfig().header })
        const resData: Assets_TypeGroup[] = resFetchAssets.data
        setAssets_TypeGroup(resData)
        setAssets_TypeGroupSelect(resData[0].typeCode)

        await client.post(`/store_FA_control_HistorysAssets`, { userCode: parsedData.UserCode }, { headers: dataConfig().header })
          .then((res) => {
            if (res.status === 200) {
              setLoading(false)
              setRows(res.data.data.filter((res: AssetRecord) => res.typeCode === resData[0].typeCode));
              setOriginalRows(res.data.data);
            } else {
              setLoading(false)
              setRows([]);
              setOriginalRows([]);
            }
          }).finally(() => setLoading(false));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [parsedData.UserCode, parsedData.userid]);

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
            ประวัติการทำ NAC ทั้งหมด
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline enableColorScheme />
      <Container component="main" sx={{ my: 2 }} maxWidth="xl">
        <Grid container spacing={2} sx={{ py: 1 }}>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.nac_code || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'nac_code', reason)}
              options={rows ? Array.from(new Set(rows.map(res => res.nac_code).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="nac_code" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.nacdtl_assetsCode || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'nacdtl_assetsCode', reason)}
              options={rows ? Array.from(new Set(rows.map(res => res.nacdtl_assetsCode).filter(x => !!x))) : []}
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
              value={filterRows.name || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'name', reason)}
              options={rows ? Array.from(new Set(rows.map(res => res.name).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="หัวข้อรายการ" />}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
            <Autocomplete
              autoHighlight
              disablePortal
              id="autocomplete-status-name"
              size="small"
              sx={{ flexGrow: 1, padding: 1 }}
              value={filterRows.account_approve_id || ''}
              onChange={(e, newValue, reason) => searchFilterByKey(newValue ?? undefined, 'account_approve_id', reason)}
              options={rows ? Array.from(new Set(rows.map(res => res.account_approve_id).filter(x => !!x))) : []}
              renderInput={(params) => <TextField {...params} label="ผู้อนุมัติ" />}
            />
          </Grid>
        </Grid>
        <Grid justifyContent="flex-start" size={12} sx={{ mt: 2 }}>
          <Tabs
            // originalRows
            value={assets_TypeGroupSelect}
            onChange={(event: React.SyntheticEvent, newValue: string) => {
              const filter = { ...filterRows }
              const filteredRows = originalRows.filter(res =>
                Object.entries(filter).every(([key, value]) =>
                  value === undefined || value === null || res[key as keyof NACDetailHistory] === value
                )
              )
              const newData = filteredRows.filter((res: NACDetailHistory) => res.typeCode === newValue)
              setRows(newData)
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
        <Card variant="outlined">
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            isCellEditable={function (params: GridCellParams): boolean {
              throw new Error("Function not implemented.");
            }}
          />
        </Card>
        <Outlet />
      </Container>
    </React.Fragment >
  );
}