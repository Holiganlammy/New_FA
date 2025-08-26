import * as React from 'react';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid2';
import { Autocomplete, Card, CardContent, CardHeader, IconButton, ListItem, ListItemText, Stack, TextField, Tooltip } from '@mui/material';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { CountAssetRow, PeriodDescription, NAC_Backlog } from '../type/nacType';
import dataConfig from '../config';
import client from '../lib/axios/interceptor';
import SquareIcon from '@mui/icons-material/Square';
import RefreshIcon from '@mui/icons-material/Refresh';
import { GridCellParams, GridColDef } from '@mui/x-data-grid';
import DataTable from './DataTable';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';

type PieCenterLabelProps = {
  primaryText: string | number;
  secondaryText: string;
};

interface StyledTextProps {
  variant: 'primary' | 'secondary';
}

type AnnualGraphType = {
  create_year: number;
  nac_type: number;
  create_month: number;
  nac_count: number;
};

interface MonthlyData {
  month: string;
  Add: number;
  Sell: number;
  Delete: number;
  Transfer: number;
}

function valueFormatter(value: number | null) {
  return `${value} Items`;
}

const organizeDataByMonth = (data: AnnualGraphType[]) => {
  return data.reduce((acc: Record<number, Record<number, number>>, item) => {
    const { create_month, nac_type, nac_count } = item;

    // ตรวจสอบว่าเดือนนี้มีอยู่ใน accumulator หรือยัง
    if (!acc[create_month]) {
      acc[create_month] = {};
    }

    // เพิ่มหรืออัปเดต nac_count สำหรับ type นั้นในเดือนนี้
    acc[create_month][nac_type] = (acc[create_month][nac_type] || 0) + nac_count;

    return acc;
  }, {});
};

const transformDataForBarChart = (data: Record<number, Record<number, number>>) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
    'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
  ];

  return Object.entries(data).map(([month, types]) => ({
    month: monthNames[parseInt(month) - 1], // แปลงเดือนเป็นชื่อเดือน
    Add: types[1] || 0, // ค่า type 1
    Sell: types[5] || 0, // ค่า type 5
    Delete: types[4] || 0, // ค่า type 4
    Transfer: types[2] || 0, // ค่า type 2
  }));
};

const size = {
  width: 200,
  height: 200,
};

const chartSetting = {
  width: 800,
  height: 300,
  sx: {
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: 'translate(-20px, 0)',
    },
  },
};

const sumData = (data: { Add: number; Sell: number; Delete: number; Transfer: number }[]) => {
  return data.reduce(
    (totals, item) => {
      totals.Add += item.Add;
      totals.Sell += item.Sell;
      totals.Delete += item.Delete;
      totals.Transfer += item.Transfer;
      return totals;
    },
    { Add: 0, Sell: 0, Delete: 0, Transfer: 0 } // ค่าเริ่มต้นเป็น 0
  );
};

const StyledText = styled('text', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<StyledTextProps>(({ theme }) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

function PieCenterLabel({ primaryText, secondaryText }: PieCenterLabelProps) {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
}

const MenuAppBar: React.FC = () => {

  const dataStorage = localStorage.getItem('data');
  const parsedData = dataStorage ? JSON.parse(dataStorage) : null;
  const [rows, setRows] = React.useState<CountAssetRow[]>([]);
  const [optionDct, setOptionDct] = React.useState<PeriodDescription[]>([]);
  const [optionDctString, setOptionDctString] = React.useState<string | null>('');
  const [dataAnnual, setDataAnnual] = React.useState<MonthlyData[]>([])
  const [dataBacklog, setBacklog] = React.useState<NAC_Backlog[]>([])
  const [loading, setLoading] = React.useState<boolean>(true);
  const transformedData = dataAnnual.map((item) => ({
    ...item,
    month: item.month.toString(),
  }));
  const [countAllAsset, setCountAllAsset] = React.useState<number>(0)


  // Process data for Pie Chart
  const inspectedCount = rows.filter(item => item.remarker === 'ตรวจนับแล้ว').length;
  const notInspectedCount = rows.filter(item => item.remarker === 'ยังไม่ได้ตรวจนับ').length;
  const unknownStatusCount = rows.filter(item => item.remarker === 'ต่างสาขา').length;

  const chartData = [
    { label: 'ตรวจนับแล้ว', value: inspectedCount, color: '#4caf50' },
    { label: 'ยังไม่ได้ตรวจนับ', value: notInspectedCount, color: '#f44336' },
    { label: 'ต่างสาขา', value: unknownStatusCount, color: '#ffeb3b' },
  ];

  const handleChange = async (newValue: string | null) => {
    setOptionDctString(newValue);

    if (newValue) {
      try {
        const resData = await client.post(
          '/FA_Control_Report_All_Counted_by_Description',
          { Description: newValue },
          { headers: dataConfig().header }
        );

        if (resData.status === 200) {
          setRows(resData.data);
        } else {
          setRows([]);
        }
      } catch (error) {
        setRows([]);
      }
    } else {
      setRows([]);
    }
  };

  const fetNac_Blocking = async () => {
    try {
      setLoading(true);
      const response = await client.get(
        '/FA_Control_NAC_Backlog',
        { headers: dataConfig().header }
      );
      if (response.status === 200) {
        const rawData: NAC_Backlog[] = response.data;
        setBacklog(rawData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // ไม่ว่าผลลัพธ์จะเป็นอย่างไร ตั้งค่า loading เป็น false
    }
  };


  const fetchData = async () => {
    try {
      const response = await client.post(
        '/FA_Control_Report_All_Counted_by_Description',
        { Description: '' },
        { headers: dataConfig().header }
      );
      if (response.status === 200) {
        setOptionDct(response.data);
        setOptionDctString(response.data[0].Description);
        const resData = await client.post(
          '/FA_Control_Report_All_Counted_by_Description',
          { Description: response.data[0].Description },
          { headers: dataConfig().header }
        );

        if (resData.status === 200) {
          setRows(resData.data);
        } else {
          setRows([]);
        }
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDataAnnualGraph = async () => {
    try {
      const response = await client.post(
        '/FA_Control_Report_All_Counted_by_Description',
        { Description: '' },
        { headers: dataConfig().header }
      );

      if (response.status === 200) {
        const resData = await client.get(
          '/FA_Control_AnnualGraph',
          { headers: dataConfig().header }
        );

        if (resData.status === 200) {
          const organizedData = organizeDataByMonth(resData.data); // จัดกลุ่มข้อมูล
          const transformedData = transformDataForBarChart(organizedData); // แปลงข้อมูล
          setDataAnnual(transformedData); // อัปเดต State
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetAllAsset = async () => {
    const response = await client.post(
      '/FA_Control_Fetch_Assets',
      { usercode: parsedData.UserCode },
      { headers: dataConfig().header }
    );
    if (response.status === 200) {
      setCountAllAsset(response.data.length)
    }
  }

  React.useEffect(() => {
    fetchData();
    fetchDataAnnualGraph();
    fetAllAsset();
    fetNac_Blocking();
  }, [parsedData.UserCode]);

  const columns: GridColDef[] = [
    { field: 'source_dep_owner', headerName: 'Department', width: 300, align: 'center', headerAlign: 'center', },
    { field: 'add_nac', headerName: 'เพิ่มทรัพย์สิน', flex: 1, align: 'right', headerAlign: 'center', },
    { field: 'tranfer_nac', headerName: 'โยกย้ายทรัพย์สิน', flex: 1, align: 'right', headerAlign: 'center', },
    { field: 'delete_nac', headerName: 'ตัดบัญชีทรัพย์สิน', flex: 1, align: 'right', headerAlign: 'center', },
    { field: 'sell_nac', headerName: 'ขายทรัพย์สิน', flex: 1, align: 'right', headerAlign: 'center', },
  ];

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
            Dashboard
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
        <CssBaseline />
        <Container component="main" sx={{ my: 2 }} maxWidth="xl">
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            <Grid size={{ xs: 3 }}>
              <Card
                variant="outlined"
              // sx={{ backgroundImage: `linear-gradient(to bottom, #99E1D9, #F0F7F4)` }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    เพิ่มทรัพย์สิน
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>+{sumData(transformedData).Add} Items</Typography>
                  <Typography variant="body2" color="success">{((sumData(transformedData).Add / (countAllAsset - sumData(transformedData).Add)) * 100).toFixed(2)}% Since last year</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Card
                variant="outlined"
              // sx={{ backgroundImage: `linear-gradient(to bottom, #FFA5AB, #F0F7F4)` }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    ขายทรัพย์สิน
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>-{sumData(transformedData).Sell} Items</Typography>
                  <Typography variant="body2" color="error">{((sumData(transformedData).Sell / (sumData(transformedData).Sell + countAllAsset)) * 100).toFixed(2)}% Since last year</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Card
                variant="outlined"
              // sx={{ backgroundImage: `linear-gradient(to bottom, #D7B8F3, #F0F7F4)` }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    ตัดบัญชีทรัพย์สิน
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>-{sumData(transformedData).Delete} Items</Typography>
                  <Typography variant="body2" color="error">{((sumData(transformedData).Delete / (sumData(transformedData).Delete + countAllAsset)) * 100).toFixed(2)}% Since last year</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Card
                variant="outlined"
              // sx={{ backgroundImage: `linear-gradient(to bottom, #8DE4FF, #F0F7F4)` }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    โยกย้ายทรัพย์สิน
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>{sumData(transformedData).Transfer} Items</Typography>
                  <Typography variant="body2" color="success">{((sumData(transformedData).Transfer / countAllAsset) * 100).toFixed(2)}% Since last year</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 7 }}>
              <Card variant="outlined" sx={{ height: 400, }}>
                <CardHeader
                  title={
                    <ListItem
                      secondaryAction={
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Tooltip title="Refesh Data">
                            <IconButton aria-label="comment" sx={{ color: '#3590F3' }} onClick={fetchDataAnnualGraph}>
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="body2" color="success"> Sync</Typography>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            NAC Completed ({(new Date()).getUTCFullYear()})
                          </Typography>
                        }
                      />
                    </ListItem>
                  }
                />
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end', // Centers vertically
                  }}
                >
                  <BarChart
                    grid={{ vertical: true, horizontal: true }}
                    dataset={transformedData}
                    xAxis={[{ scaleType: 'band', dataKey: 'month', }]}
                    series={[
                      {
                        dataKey: 'Add', label: 'เพิ่มทรัพย์สิน', valueFormatter, color: 'var(--my-custom-gradient, #358600)',
                        // showMark: false 
                      },
                      {
                        dataKey: 'Sell', label: 'ขายทรัพย์สิน', valueFormatter, color: 'var(--my-custom-gradient, #D7263D)',
                        // showMark: false 
                      },
                      {
                        dataKey: 'Delete', label: 'ตัดบัญชีทรัพย์สิน', valueFormatter, color: 'var(--my-custom-gradient, #140D4F)',
                        // showMark: false 
                      },
                      {
                        dataKey: 'Transfer', label: 'โยกย้าย', valueFormatter, color: 'var(--my-custom-gradient, #3CDBD3)',
                        // showMark: false 
                      },
                    ]}
                    slotProps={{
                      legend: {
                        direction: 'row',
                        position: { vertical: 'top', horizontal: 'middle' },
                        itemMarkWidth: 10,
                        itemMarkHeight: 10,
                        markGap: 5,
                        itemGap: 20,
                        padding: 0,
                      },
                    }}
                    {...chartSetting}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 5 }}>
              <Card variant="outlined" sx={{ height: 400, }}>
                <CardHeader
                  title={
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        สรุปผลการตรวจนับ
                      </Typography>
                      <Autocomplete
                        autoHighlight
                        disablePortal
                        id="autocomplete-status-name"
                        size="small"
                        sx={{ flexGrow: 1, padding: 1 }}
                        value={optionDctString}
                        onChange={(e, newValue) => handleChange(newValue)}
                        options={optionDct.map((option) => option.Description)}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </Stack>
                  }
                />
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row'
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: chartData,
                        innerRadius: 75,
                        outerRadius: 100,
                        paddingAngle: 0,
                        highlightScope: { faded: 'global', highlighted: 'item' },
                      },
                    ]}
                    {...size}
                    margin={{ left: 100 }}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                  >
                    <PieCenterLabel primaryText={rows.length.toString()} secondaryText="Total" />
                  </PieChart>
                  <Box sx={{ marginTop: 2 }}>
                    <Stack direction="column" spacing={2}>
                      {chartData.map((item, index) => (
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "flex-start",
                            alignItems: "center",
                          }}
                        >
                          <SquareIcon sx={{ color: item.color }} />
                          <Typography key={index} variant="caption">
                            {item.label}: {item.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <Typography variant="h6" sx={{ p: 1, fontWeight: 'bold' }}>
                  จำนวนงาน NAC ที่ค้างอยู่ในระบบ (แยกตาม Department)
                </Typography>
                <DataTable
                  rows={dataBacklog}
                  columns={columns}
                  loading={loading}
                  isCellEditable={function (params: GridCellParams): boolean {
                    throw new Error("Function not implemented.");
                  }}
                />
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </React.Fragment>
  );
};

export default MenuAppBar;
