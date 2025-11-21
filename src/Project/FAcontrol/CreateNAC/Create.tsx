/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';
import Typography from '@mui/material/Typography';
import { AppBar, Toolbar, Container, Paper, Stack, Box, Grid2, TableContainer, Table, TableHead, TableRow, TableBody, IconButton, alpha, Card, Divider, List, ListItem, ListItemText, Dialog, DialogContent, DialogTitle, Button, DialogActions, Alert } from '@mui/material';
import logoPure from '../../../image/Picture1.png'
import { StyledTableCell, StyledTableCellHeader } from '../../../components/StyledTable'
import { RequestCreateDocument, DataUser, DataAsset, FAControlCreateDetail, WorkflowApproval } from '../../../type/nacType';
import dataConfig  from "../../../config";
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../../../components/Loading';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAddOutlined';
import dayjs from 'dayjs';
import SumDetail from './sumdetail';
import Source from './source'
import DettailNAC from './details'
import Des from './des'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import ButtonStates from './buttonStates';
import Swal from 'sweetalert2';
import ChatTSX from './chat_file_Tsx/main'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import ArticleIcon from '@mui/icons-material/Article';
import 'dayjs/locale/th'
import client from '../../../lib/axios/interceptor';
import { parse } from 'path';


dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');


// Helper function to get status color
const getStatusColor = (status: number) => {
  switch (status) {
    case 1:
      return '#1E90FF'; // DodgerBlue
    case 2:
      return '#6495ED'; // CornflowerBlue
    case 3:
      return '#FF69B4'; // HotPink
    case 4:
      return '#00CED1'; // DarkTurquoise
    case 5:
      return '#6A5ACD'; // SlateBlue
    case 6:
      return '#008000'; // Green
    case 7:
      return '#FFA500'; // Orange
    case 8:
      return '#F0E68C'; // Khaki
    case 11:
      return '#F4A460'; // SandyBrown
    case 12:
      return '#DDA0DD'; // Plum
    case 13:
      return '#6A5ACD'; // SlateBlue
    case 14:
      return '#708090'; // SlateGray
    case 15:
      return '#6A5ACD'; // SlateBlue
    case 18:
      return '#6A5ACD'; // SlateBlue
    default:
      return '#DC143C'; // Crimson for unknown statuses
  }
};

function formatDateToDDMMYYYYHHMM(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const getQueryParam = (url: string, param: string): string | null => {
  const match = new RegExp(`[?&]${param}=([^&]*)`).exec(url);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function Create() {
  // Backdrop 
  const navigate = useNavigate();
  const [openBackdrop, setOpenBackdrop] = React.useState(false);
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);

  // useEffect Data
  const location = useLocation();
  const [idSection, setIdSection] = React.useState<number | null>(null);
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [users, setUsers] = React.useState<DataUser[]>([]);
  const [dataAssets, setDataAssets] = React.useState<DataAsset[]>([]);
  const [openLoading, setOpenLoading] = React.useState(true);

  // Memoize the exampleDocument object
  const exampleDocument: RequestCreateDocument = React.useMemo(() => ({
    usercode: parsedData.UserCode,
    nac_code: null,
    nac_type: idSection,
    status_name: null,
    nac_status: null,
    source_dep_owner: users.find(res => res.UserCode === parsedData.UserCode)?.DepCode,
    source_bu_owner: users.find(res => res.UserCode === parsedData.UserCode)?.BranchID === 901 ? 'Center' : 'Oil',
    source_usercode: parsedData.UserCode,
    source_userid: users.find(res => res.UserCode === parsedData.UserCode)?.UserID,
    source_name: null,
    source_date: dayjs.tz(new Date(), "Asia/Bangkok"),
    source_approve_usercode: null,
    source_approve_userid: null,
    source_approve_date: null,
    source_remark: null,
    des_dep_owner: null,
    des_bu_owner: null,
    des_usercode: null,
    des_userid: null,
    des_name: null,
    des_date: dayjs.tz(new Date(), "Asia/Bangkok"),
    des_approve_usercode: null,
    des_approve_userid: null,
    des_approve_date: null,
    des_remark: null,
    verify_by_usercode: null,
    verify_by_userid: null,
    verify_date: null,
    sum_price: null,
    create_by: null,
    create_date: null,
    account_aprrove_usercode: null,
    account_aprrove_id: null,
    account_aprrove_date: null,
    real_price: null,
    realPrice_Date: null,
    finance_aprrove_usercode: null,
    finance_aprrove_id: null,
    finance_aprrove_date: null,
    desFristName: null,
    desLastName: null,
    sourceFristName: users.find(res => res.UserCode === parsedData.UserCode)?.fristName,
    sourceLastName: users.find(res => res.UserCode === parsedData.UserCode)?.lastName,
  }), [idSection, parsedData.UserCode]); // Add dependencies if needed


  //Header NAC
  const [createDoc, setCreateDoc] = React.useState<RequestCreateDocument[]>([exampleDocument]);
  const [workflowApproval, setWorkflowApproval] = React.useState<WorkflowApproval[]>([]);


  //detail NAC
  const [detailNAC, setDetailNAC] = React.useState<FAControlCreateDetail[]>([{
    usercode: undefined,
    nac_code: undefined,
    nacdtl_row: undefined,
    nacdtl_assetsCode: undefined,
    OwnerCode: undefined,
    nacdtl_assetsName: undefined,
    nacdtl_assetsSeria: undefined,
    nacdtl_assetsDtl: undefined,
    nacdtl_assetsPrice: 0,
    create_date: undefined,
    nacdtl_bookV: undefined,
    nacdtl_PriceSeals: undefined,
    nacdtl_profit: undefined,
    nacdtl_image_1: undefined,
    nacdtl_image_2: undefined,
  }]);

  const handleAddRow = () => {
    const newRow: FAControlCreateDetail = {
      usercode: undefined,
      nac_code: undefined,
      nacdtl_row: undefined,
      nacdtl_assetsCode: undefined,
      OwnerCode: undefined,
      nacdtl_assetsName: undefined,
      nacdtl_assetsSeria: undefined,
      nacdtl_assetsDtl: undefined,
      nacdtl_assetsPrice: 0,
      create_date: undefined,
      nacdtl_bookV: undefined,
      nacdtl_PriceSeals: undefined,
      nacdtl_profit: undefined,
      nacdtl_image_1: undefined,
      nacdtl_image_2: undefined,
    };

    setDetailNAC((prevDetailNAC) => [...prevDetailNAC, newRow]);
  };

  const Export_PDF_DATA_NAC = () => {
    if ([4, 5].includes(idSection || 0)) {
      window.location.href = 'http://ptecdba:10250/OPS/reports/nac_sale.aspx?nac_code=' + createDoc[0].nac_code
    } else if ([1, 2].includes(idSection || 0)) {
      window.location.href = 'http://ptecdba:10250/OPS/reports/nac.aspx?nac_code=' + createDoc[0].nac_code
    }
  }

  React.useEffect(() => {
    const url_pathname = location.search; // สร้าง URLSearchParams จาก location.search
    const idParam = getQueryParam(url_pathname, 'id');
    const nac_codeParam = getQueryParam(url_pathname, 'nac_code');

    const fetData = async () => {
      // แสดง users ทั้งหมด
      await client.get('/User_List', { headers: dataConfig().header })
        .then((res) => {
          setUsers(res.data)
        })

      //permission
      try {
        await client.post('/select_Permission_Menu_NAC', { Permission_TypeID: 1, userID: parsedData.userid }, { headers: dataConfig().header })
          .then(response => {
            setPermission_menuID(response.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))
          });
      } catch (e) {
        setPermission_menuID([])
      }

      // รหัสทรัพย์สินทั้งหมด
      try {
        await client.post('/AssetsAll_Control', { BranchID: parsedData.branchid }, { headers: dataConfig().header })
          .then((res) => {
            if (parsedData.branchid === 901 && parsedData.DepCode !== '101ITO') {
              setDataAssets(res.data.data.filter((datain: { Position: any; }) => datain.Position === parsedData.DepCode))
            }
            setDataAssets(res.data.data)
          })
      } catch (e) {
        setDataAssets([])
      }

      if (idParam && nac_codeParam) {
        const dataId = parseInt(idParam);
        try {
          await client.post('/FA_control_select_headers', { nac_code: nac_codeParam }, { headers: dataConfig().header })
            .then(async (res) => {
              if (res.status === 200) {
                await client.post('/FA_Control_execDocID', { usercode: parsedData.UserCode, nac_code: nac_codeParam }, { headers: dataConfig().header })
                  .then(resApprove => {
                    if (resApprove.status === 200) {
                      setWorkflowApproval(resApprove.data);
                    }
                  })
                await client.post('/FA_Control_select_dtl', { nac_code: nac_codeParam }, { headers: dataConfig().header })
                  .then(resDtl => {
                    if (resDtl.status === 200) {
                      setDetailNAC(resDtl.data)
                      setCreateDoc(res.data)
                      setIdSection(dataId);
                      setOpenLoading(false);
                    }
                  })
              } else {
                Swal.fire({
                  icon: "error",
                  title: `ไม่พบข้อมูลรหัสใบงานนี้ ไม่พบข้อมูลรหัสใบงานนี้`,
                  showConfirmButton: false,
                  timer: 1500
                }).then((result) => {
                  if (result.isConfirmed) {
                    navigate(`/NAC_CREATE?id=${dataId}`)
                  }
                })
              }
            })
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: `เกิดข้อผิดพลาดในการดึงข้อมูล ไม่พบข้อมูลรหัสใบงานนี้`,
            showConfirmButton: true,
          }).then((result) => {
            if (result.isConfirmed) {
              ;
              navigate(`/NAC_CREATE?id=${dataId}`)
            }
          })
        }
      } else if (idParam && !nac_codeParam) {
        const dataId = parseInt(idParam);
        const clearedRow: FAControlCreateDetail = {
          usercode: undefined,
          nac_code: undefined,
          nacdtl_row: undefined,
          nacdtl_assetsCode: undefined,
          OwnerCode: undefined,
          nacdtl_assetsName: undefined,
          nacdtl_assetsSeria: undefined,
          nacdtl_assetsDtl: undefined,
          nacdtl_assetsPrice: 0,
          create_date: undefined,
          nacdtl_bookV: undefined,
          nacdtl_PriceSeals: undefined,
          nacdtl_profit: undefined,
          nacdtl_image_1: undefined,
          nacdtl_image_2: undefined,
        };
        setCreateDoc([exampleDocument])
        setDetailNAC([clearedRow]);
        setIdSection(dataId);
        setOpenLoading(false);
      } else {
        setIdSection(null);
      }
    }
    fetData();
  }, [exampleDocument, location.search, parsedData.DepCode, parsedData.UserCode, parsedData.branchid]);


  const columnDetail: { columns: string, name: string, show: boolean, col: number, width: string }[] = [
    { columns: 'Code', name: 'รหัสทรัพย์สิน', show: true, col: [4, 5].includes(idSection ?? 0) ? 2 : 3, width: [4, 5].includes(idSection ?? 0) ? "16% !important" : "18% !important" },
    { columns: 'serialNo', name: 'Serial No.', show: true, col: 1, width: [4, 5].includes(idSection ?? 0) ? "11% !important" : "14% !important" },
    { columns: 'name', name: 'ชื่อทรัพย์สิน', show: true, col: [4, 5].includes(idSection ?? 0) ? 2 : 3, width: "14% !important" },
    { columns: 'date_asset', name: 'วันที่ขึ้นทะเบียน', show: ![4, 5].includes(idSection ?? 0), col: 1, width: "10% !important" },
    { columns: 'OwnerCode', name: 'ผู้ถือครอง', show: true, col: 1, width: [4, 5].includes(idSection ?? 0) ? "11% !important" : "10% !important" },
    { columns: 'detail', name: 'สถานะ', show: ![4, 5].includes(idSection ?? 0), col: 1, width: "14% !important" },
    { columns: 'price', name: 'ต้นทุน (฿)', show: true, col: 1, width: [4, 5].includes(idSection ?? 0) ? "8% !important" : "13% !important" },
    { columns: 'bookValue', name: 'BV. (฿)', show: [4, 5].includes(idSection ?? 0), col: 1, width: "8% !important" },
    { columns: 'priceSeals', name: 'ขาย (฿)', show: [4, 5].includes(idSection ?? 0), col: 1, width: "8% !important" },
    { columns: 'Expiration', name: 'Ex.Vat (฿)', show: [4, 5].includes(idSection ?? 0), col: 1, width: "8% !important" },
    { columns: 'profit', name: 'Profit (฿)', show: [4, 5].includes(idSection ?? 0), col: 1, width: "8% !important" },
    { columns: 'file', name: 'File', show: true, col: 1, width: "9% !important" },
  ];

  const getHeaderSection = (id: number) => {
    switch (id) {
      case 1:
        return "เพิ่มบัญชีทรัพย์สิน";
      case 2:
        return "โยกย้ายทรัพย์สิน";
      case 3:
        return "เปลี่ยนแปลงรายละเอียดทรัพย์สิน";
      case 4:
        return "ตัดบัญชีทรัพย์สิน";
      case 5:
        return "ขายทรัพย์สิน";
    }
  };

  if (openLoading) {
    return <Loading />
  } else {
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
            <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <Typography variant="subtitle1" color="inherit" component="div">
                {idSection ? getHeaderSection(idSection) : "Loading..."}
              </Typography>
              <IconButton
                aria-label="delete"
                size="small"
                sx={{ mr: 5 }}
                onClick={() => {
                  navigate(permission_menuID.includes(2) ? "/NAC_OPERATOR" : "/NAC_ROW")
                }}
              >
                <ArticleIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <Container
          component="main"
          sx={{
            my: 2,
            backgroundImage:
              'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
          }}
          maxWidth="xl"
        >
          <Alert severity="warning" sx={{ mx: { xs: 2, md: 3 }, overflow: 'hidden', my: { xs: 1, md: 2 } }}>
            *หมายเหตุ (ทรัพย์สินที่มีประเภทรหัสทรัพย์สินต่างกันจะไม่สามารถทำรายการรวมอยู่เอกสารเดียวกันได้)
          </Alert>
          <List sx={{
            p: 1, m: { xs: 2, md: 3 },
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}>
            <ListItem>
              <ListItemText
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 'medium',
                  letterSpacing: 0,
                }}
                primary={
                  workflowApproval.length > 1 ? (
                    <>
                      ผู้มีสิทธิอนุมัติ:&nbsp; &nbsp;
                      {![1].includes(createDoc[0].nac_type ?? 0) && workflowApproval
                        .filter(res => (res.limitamount ?? 0) >= (createDoc[0].sum_price ?? 0) && res.workflowlevel !== 0)
                        .map((item, index) => (
                          <React.Fragment key={index}>
                            {item.status === 1 ? (
                              <Typography component="span" sx={{ color: 'blue' }}>
                                [{item.name}: {item.approverid}]
                              </Typography>
                            ) : (
                              `[${item.name}: ${item.approverid}]`
                            )}
                            {index < workflowApproval.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                    </>
                  ) : `ผู้มีสิทธิอนุมัติ:`
                }
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 'medium',
                  letterSpacing: 0,
                }}
                primary={
                  workflowApproval.length > 1 ? (
                    <>
                      ผู้มีสิทธิตรวจสอบ:&nbsp; &nbsp;
                      {![1].includes(createDoc[0].nac_type ?? 0) && workflowApproval
                        .filter(res => (res.limitamount ?? 0) < (createDoc[0].sum_price ?? 0) && res.workflowlevel !== 0)
                        .map((item, index) => (
                          <React.Fragment key={index}>
                            {item.status === 1 ? (
                              <Typography component="span" sx={{ color: 'blue' }}>
                                [{item.name}: {item.approverid}]
                              </Typography>
                            ) : (
                              `[${item.name}: ${item.approverid}]`
                            )}
                            {index < workflowApproval.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                    </>
                  ) : `ผู้มีสิทธิตรวจสอบ:`
                }
              />
            </ListItem>
          </List>
          {createDoc[0].nac_code && (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: "flex-end",
                alignItems: "flex-end",
                mx: { xs: 2, md: 3 },
                overflow: 'hidden'
              }}
            >
              <Card
                sx={{
                  borderTopLeftRadius: '100%',
                  borderBottomLeftRadius: '0%',
                  'maxWidth': 'fit-content',
                  backgroundColor: getStatusColor(createDoc[0].nac_status ?? 0),
                  px: { xs: 2, md: 3 },
                  pt: 1,
                  textAlign: 'right',
                  color: 'RGB(255,255,255)'
                }}
              >
                <Typography align="center" sx={{ ml: 5, mt: 1 }}>
                  {createDoc[0].status_name}
                </Typography>
              </Card>
            </Stack>
          )}
          <Paper sx={{ mx: { xs: 2, md: 3 }, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCellHeader colSpan={12}>
                      <Grid2
                        container
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Grid2 size={4}>
                          <Box sx={{ width: '10rem' }}>
                            <img style={{ maxWidth: '100%' }} src={logoPure} loading="lazy" alt="Company Logo" />
                          </Box>
                        </Grid2>
                        <Grid2 size={4}>
                          <Stack sx={{ justifyContent: "center", alignItems: "center", }}>
                            <Typography variant="subtitle1">
                              <b>PURE THAI ENERGY CO.,LTD.</b>
                            </Typography>
                            <Typography variant="subtitle2">
                              เปลี่ยนแปลงรายการทรัพย์สินถาวร (Notice of Asset Change - NAC)
                            </Typography>
                          </Stack>
                        </Grid2>
                        {/* Grid 3 */}
                        <Grid2 size={4}>
                          {
                            createDoc[0].nac_code &&
                            <Stack

                              sx={{ justifyContent: "center", alignItems: "flex-end", }}
                            >
                              <Typography variant="subtitle1">
                                <b>{createDoc[0].nac_code}</b>
                              </Typography>
                              <Button
                                onClick={Export_PDF_DATA_NAC}
                                sx={{
                                  fontSize: 10,
                                }}
                                variant='contained'
                                color='warning'
                              >
                                REPORT
                              </Button>
                            </Stack>
                          }
                        </Grid2>
                      </Grid2>
                    </StyledTableCellHeader>
                  </TableRow>
                </TableHead>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" colSpan={4} sx={{ width: '30% !important' }}>
                      ประเภทการเปลี่ยนแปลง
                    </StyledTableCell>
                    <StyledTableCell align="center" colSpan={4} sx={{ width: '35% !important' }}>
                      หน่วยงานที่ส่งมอบ
                    </StyledTableCell>
                    <StyledTableCell align="center" colSpan={4} sx={{ width: '35% !important' }}>
                      หน่วยงานที่รับมอบ
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* ประเภทการเปลี่ยนแปลง */}
                  <TableRow>
                    <StyledTableCell colSpan={4}>
                      <Stack sx={{ justifyContent: "center", alignItems: "center", }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {idSection ? getHeaderSection(idSection) : 'Loading...'}
                        </Typography>
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell colSpan={4}>
                      <Source users={users} createDoc={createDoc} setCreateDoc={setCreateDoc} />
                    </StyledTableCell>
                    <StyledTableCell colSpan={4}>
                      {[1, 2].includes(idSection ?? 0) ?
                        <Des users={users} createDoc={createDoc} setCreateDoc={setCreateDoc} /> :
                        <Stack sx={{ justifyContent: "center", alignItems: "center", }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            NONE
                          </Typography>
                        </Stack>
                      }
                    </StyledTableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columnDetail.filter(res => res.show).map((res) => (
                      <StyledTableCell key={res.name} align="center" colSpan={res.col} sx={{ width: res.width }}>
                        {res.name}
                      </StyledTableCell>
                    ))}
                    <StyledTableCell align="center">
                      <IconButton
                        onClick={handleAddRow}
                        sx={(theme) => ({
                          color: theme.palette.common.white,
                          '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.3) }
                        })}
                      >
                        <PlaylistAddIcon />
                      </IconButton>
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <DettailNAC
                  dataAssets={dataAssets}
                  detailNAC={detailNAC}
                  setDetailNAC={setDetailNAC}
                  columnDetail={columnDetail}
                  nac_type={createDoc[0].nac_type}
                  des_userid={Number(createDoc[0]?.des_userid)}
                  nac_status={createDoc[0]?.nac_status} 
                />
                <TableBody>
                  <SumDetail
                    dataAssets={dataAssets}
                    detailNAC={detailNAC}
                    idSection={idSection ?? 0}
                    createDoc={createDoc}
                    setCreateDoc={setCreateDoc}
                  />
                </TableBody>
              </Table>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ width: '20% !important' }}>
                      <Stack sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                        ผู้ทำรายการ: {parsedData.UserCode} {createDoc[0].create_date ? `[${dayjs(createDoc[0].create_date).format('DD/MM/YYYY HH:mm')}]` : `[${formatDateToDDMMYYYYHHMM(new Date())}]`}
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ width: '20% !important' }}>
                      <Stack sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                        ผู้ตรวจสอบ: {createDoc[0].verify_by_usercode} {createDoc[0].verify_date ? `[${dayjs(createDoc[0].verify_date).format('DD/MM/YYYY HH:mm')}]` : ``}
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ width: '20% !important' }}>
                      <Stack sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                        ผู้อนุมัติ: {createDoc[0].source_approve_usercode} {createDoc[0].source_approve_date ? `[${dayjs(createDoc[0].source_approve_date).format('DD/MM/YYYY HH:mm')}]` : ``}
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ width: '20% !important' }}>
                      <Stack sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                        บัญชี: {createDoc[0].account_aprrove_usercode} {createDoc[0].account_aprrove_date ? `[${dayjs(createDoc[0].account_aprrove_date).format('DD/MM/YYYY HH:mm')}]` : ``}
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ width: '20% !important' }}>
                      <Stack sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                        การเงิน: {createDoc[0].finance_aprrove_usercode} {createDoc[0].finance_aprrove_date ? `[${dayjs(createDoc[0].finance_aprrove_date).format('DD/MM/YYYY HH:mm')}]` : ``}
                      </Stack>
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </Paper>
          <Grid2
            container
            direction="row"
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
            spacing={3}
          >
            <Grid2
              size={12}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <ButtonStates
                setOpenBackdrop={setOpenBackdrop}
                createDoc={createDoc}
                detailNAC={detailNAC}
                idSection={idSection}
                workflowApproval={workflowApproval}
                setCreateDoc={setCreateDoc}
              />
            </Grid2>
          </Grid2>
          {createDoc[0].nac_code ? <ChatTSX nac_type={createDoc[0].nac_type} createDoc={createDoc} /> : null}
        </Container>
        <Backdrop
          sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
          open={openBackdrop}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </React.Fragment >
    );
  }
}