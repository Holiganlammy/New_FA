import React from "react";
import { SqlInputParameters, Department, Branch, DataUser } from '../../../type/nacType';
import { Stack, Typography, AppBar, Container, Toolbar, FormControl, TextField, Card, CardActions, CardContent, Grid2, Chip, Divider, Alert, FormControlLabel, FormLabel, Radio, RadioGroup, InputLabel, MenuItem, OutlinedInput, Box, Autocomplete, Checkbox, Button, InputAdornment, CssBaseline } from "@mui/material";
import Swal from "sweetalert2";
import DeleteIcon from '@mui/icons-material/Delete';
import dataConfig from "../../../config";
import { Outlet, useNavigate } from "react-router";
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider, DateTimePicker, renderDigitalClockTimeView, } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Theme, useTheme } from '@mui/material/styles';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import Backdrop from '@mui/material/Backdrop';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CircularProgress from '@mui/material/CircularProgress';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import client from "../../../lib/axios/interceptor";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');


const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

async function PeriodCreate(credentials: SqlInputParameters) {
  const response = await client.post(`/craete_period`, JSON.stringify(credentials), {
    headers: dataConfig().header,
  });
  return response.data;
}

export default function ListNacPage() {

  const theme = useTheme();
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [branch, setBrnach] = React.useState<Branch[]>([]);
  const [department, setDepartment] = React.useState<Department[]>([]);
  const [users, setUsers] = React.useState<DataUser[]>([]);
  const [userCenter, setUserCenter] = React.useState<DataUser[]>([]);
  const [category, setCategory] = React.useState<string>("");
  const [categoryBranch, setCategoryBranch] = React.useState<string>("");
  const [categoryHO, setCategoryHO] = React.useState<string>("");
  const [rows, setRows] = React.useState<SqlInputParameters[]>([{
    begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
    enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
    branchid: "",
    description: undefined,
    usercode: parsedData.UserCode,
    depcode: undefined,
    personID: undefined,
    keyID: (Math.random() + 1).toString(36).substring(7)
  }]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const createPeriod = async () => {
    setLoading(true);
    try {
      // ส่งทุก request พร้อมกันด้วย Promise.all
      const responses = await client.post(`/craete_period`, rows[0], { headers: dataConfig().header });

      // ตรวจสอบว่าทุก response สำเร็จหรือไม่
      if (responses.status === 200) {
        setLoading(false);

        await Swal.fire({
          icon: responses.status === 200 ? "success" : "error",
          title: responses.status === 200 ? "ทำรายการสำเร็จ" : "Some rows failed to process.",
          showConfirmButton: false,
          timer: 1500,
        });

        if (responses.status === 200) {
          navigate(`/EditPeriod`)
        }
      }
    } catch (error) {
      console.error("Error creating periods:", error);
      setLoading(false);
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการส่งข้อมูล",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };



  React.useEffect(() => {
    const fetData = async () => {
      // Fetch users
      await client.get<DataUser[]>(`/users`, { headers: dataConfig().header })
        .then((res) => {
          setUsers(res.data.filter((user) => user.BranchID === 901 && user.UserType !== 'CENTER'));
          setUserCenter(res.data.filter((user) => user.BranchID === 901 && user.UserType === 'CENTER'));
        })
        .catch((error) => {
          console.error('Error fetching users:', error);
        });

      // Fetch department list
      await client.post<{ data: Department[] }>(`/Department_List`, { branchid: parsedData.branchid }, { headers: dataConfig().header })
        .then((response) => {
          const newArray = response.data.data.filter((dep) => dep.depid > 14);
          setDepartment(newArray);
        })
        .catch((error) => {
          console.error('Error fetching departments:', error);
        });

      // Fetch branch list
      await client.get<{ data: Branch[] }>(`/Branch_ListAll`, { headers: dataConfig().header })
        .then((response) => {
          setBrnach(
            response.data.data.filter(
              (branch) =>
                branch.branchid <= 300 ||
                [1000005, 1000006, 1000007, 1000008].includes(branch.branchid)
            )
          );
        })
    }
    fetData();
  }, [parsedData.branchid])

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
            เพิ่มรอบตรวจนับ
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline enableColorScheme />
      <Container
        component="main"
        sx={{
          my: 2, // Margin y-axis
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh', // Full viewport height for vertical centering
        }}
        maxWidth="md"
      >
        <Card variant="outlined" sx={{ mx: 5 }}>
          <CardContent>
            <Grid2 container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={12}>
                <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  PURE THAI ENERGY CO.,LTD.
                </Typography>
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={12}>
                <Typography gutterBottom variant="body1" component="div">
                  การเพิ่มรอบตรวจนับสำหรับทรัพย์สิน
                </Typography>
              </Grid2>
              <br />
              <br />
              <Grid2 display="flex" justifyContent="flex-start" alignItems="center" size={12}>
                <Alert severity="error" color="error" sx={{ width: '100%' }}>
                  ข้อควรระวัง ไม่สามารถลงเวลาซ้ำกันได้
                </Alert>
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={6}>
                <TextField
                  id="fristName"
                  placeholder="ชื่อจริง"
                  fullWidth
                  size="small"
                  value={parsedData.fristName}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="body1">
                            ชื่อจริง :
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={6}>
                <TextField
                  id="lastName"
                  placeholder="นามสกุล"
                  size="small"
                  fullWidth
                  value={parsedData.lastName}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="body1">
                            นามสกุล :
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    name='txtCreateDate'
                    format="DD/MM/YYYY HH:mm"
                    views={['year', 'month', 'day', 'hours']}
                    value={rows[0].begindate}
                    viewRenderers={{
                      hours: renderDigitalClockTimeView,
                      seconds: null,
                    }}
                    onChange={(newValue) => {
                      const list = [...rows]
                      list[0].begindate = dayjs(newValue)
                      setRows(list)
                    }}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        sx: {
                          width: '100%',
                          '& .MuiInputBase-root': {
                            height: '40px', // Adjust height to match small size
                          },
                          '& .MuiInputBase-input': {
                            padding: '8.5px 14px', // Adjust padding to match small size
                          },
                        },
                        inputProps: {
                          placeholder: 'วันที่เริ่มต้น', // Set placeholder here
                        },
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="subtitle1">
                                วันที่เริ่มต้น :
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                    ampm={false}
                  />
                </LocalizationProvider>
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    name='txtCreateDate'
                    format="DD/MM/YYYY HH:mm"
                    views={['year', 'month', 'day', 'hours']}
                    value={rows[0].enddate}
                    viewRenderers={{
                      hours: renderDigitalClockTimeView,
                      seconds: null,
                    }}
                    onChange={(newValue) => {
                      const list = [...rows]
                      list[0].enddate = dayjs(newValue)
                      setRows(list)
                    }}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        sx: {
                          width: '100%',
                          '& .MuiInputBase-root': {
                            height: '40px', // Adjust height to match small size
                          },
                          '& .MuiInputBase-input': {
                            padding: '8.5px 14px', // Adjust padding to match small size
                          },
                        },
                        inputProps: {
                          placeholder: 'วันที่สิ้นสุด', // Set placeholder here
                        },
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="subtitle1">
                                วันที่สิ้นสุด :
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                    ampm={false}
                  />
                </LocalizationProvider>
              </Grid2>
              <Grid2 display="flex" justifyContent="center" alignItems="center" size={12}>
                <TextField
                  placeholder="รายละเอียดและคำอธิบาย"
                  multiline
                  rows={4}
                  onChange={(e) => {
                    const list = [...rows]
                    list[0].description = e.target.value
                    setRows(list)
                  }}
                  sx={{ width: '100%' }}
                />
              </Grid2>
              <br />
              <Grid2 display="flex" justifyContent="flex-start" alignItems="center" size={12}>
                <FormControl>
                  <FormLabel id="demo-row-radio-buttons-group-label">กรุณาเลือกหัวข้อที่ต้องการ</FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    value={category}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      if ((event.target as HTMLInputElement).value === "1") {
                        const list = [...rows]
                        list[0].branchid = "0"
                        list[0].personID = undefined
                        list[0].depcode = undefined
                        setCategoryHO("")
                        setRows(list)
                      } else {
                        const list = [...rows]
                        list[0].branchid = "901"
                        setCategoryBranch("")
                        setRows(list)
                      }
                      setCategory((event.target as HTMLInputElement).value);
                    }}
                  >
                    <FormControlLabel value="1" control={<Radio size="small" />} label="CO (หน่วยงานสาขา)" />
                    <FormControlLabel value="2" control={<Radio size="small" />} label="HO (สำนักงานใหญ่)" />
                  </RadioGroup>
                </FormControl>
              </Grid2>
              <br />
              {category === "1" && (
                <>
                  <Grid2 display="flex" justifyContent="flex-start" alignItems="center" size={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="demo-simple-select-label">เลือกสาขาที่ต้องการ</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="เลือกสาขาที่ต้องการ"
                        value={categoryBranch}
                        onChange={(event: SelectChangeEvent) => {
                          if (event.target.value === "1") {
                            const list = [...rows]
                            list[0].branchid = "0"
                            setRows(list);
                          }
                          setCategoryBranch(event.target.value)
                        }}
                      >
                        <MenuItem value="1">ทุกสาขา (All CO)</MenuItem>
                        <MenuItem value="2">เลือกแบบระบุสาขา</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                  {categoryBranch === "2" && (
                    <Grid2 display="flex" justifyContent="flex-start" alignItems="center" size={12}>
                      <FormControl fullWidth>
                        <Autocomplete
                          multiple
                          id="checkboxes-tags-demo"
                          options={branch}
                          disableCloseOnSelect
                          getOptionLabel={(option) => option.name}
                          onChange={(event, newValue) => {
                            const list = [...rows]
                            list[0].branchid = newValue.map((res) => res.branchid).join(`, `)
                            setRows(list);
                          }}
                          renderOption={(props, option, { selected }) => {
                            const { key, ...optionProps } = props;
                            return (
                              <li key={key} {...optionProps}>
                                <Checkbox
                                  icon={icon}
                                  checkedIcon={checkedIcon}
                                  style={{ marginRight: 8 }}
                                  checked={selected}
                                />
                                {option.name}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField {...params} size="small" fullWidth placeholder="เลือกสาขา (เลือกได้มากกว่า 1 สาขา)" />
                          )}
                        />
                      </FormControl>
                    </Grid2>
                  )}
                </>
              )}
              {category === "2" && (
                <>
                  <Grid2 display="flex" justifyContent="flex-start" alignItems="center" size={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="demo-simple-select-label">เลือกหัวข้อที่ต้องการ</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="เลือกสาขาที่ต้องการ"
                        value={categoryHO}
                        onChange={(event: SelectChangeEvent) => {
                          if (event.target.value === "1") {
                            const list = [...rows]
                            list[0].branchid = "901"
                            setRows(list);
                          }
                          setCategoryHO(event.target.value)
                        }}
                      >
                        <MenuItem value="1">สำนักงานใหญ่ (All HO)</MenuItem>
                        <MenuItem value="3">กลุ่มส่วนกลาง (Center)</MenuItem>
                        <MenuItem value="2">แยกตามแผนก (Department)</MenuItem>
                        <MenuItem value="4">แยกตามบุคคล (Person)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                  {categoryHO === "2" && (
                    <Autocomplete
                      multiple
                      id="checkboxes-tags-demo"
                      options={department}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.name}
                      onChange={(event, newValue, reason) => {
                        if (rows.length === 1 && newValue.length > 0) {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: "901",
                            description: rows[0].description,
                            usercode: parsedData.UserCode,
                            depcode: newValue[0].depcode,
                            personID: "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        } else if (rows.length > 1 && newValue.length > 0) {
                          const newData = newValue.map((res) => {
                            return {
                              begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              branchid: "901",
                              description: rows[0]?.description ?? "",
                              usercode: parsedData.UserCode,
                              depcode: rows[0]?.depcode ?? "",
                              personID: res.depcode,
                              keyID: rows[0]?.keyID ?? ""
                            }
                          });
                          setRows(newData);
                        } else {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: "",
                            description: "",
                            usercode: parsedData.UserCode,
                            depcode: "",
                            personID: "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        }
                      }}
                      sx={{ width: "100%" }}
                      renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                          <li key={key} {...optionProps}>
                            <Checkbox
                              icon={icon}
                              checkedIcon={checkedIcon}
                              style={{ marginRight: 8 }}
                              checked={selected}
                            />
                            {option.name}
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="เลือกแผนก (เลือกได้มากกว่า 1 สาขา)" />
                      )}
                    />
                  )}
                  {categoryHO === "3" && (
                    <Autocomplete
                      multiple
                      id="checkboxes-tags-demo"
                      options={userCenter}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.UserCode}
                      onChange={(event, newValue, reason) => {
                        if (rows.length === 1 && newValue.length > 0) {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: newValue[0].BranchID.toString(),
                            description: rows[0].description,
                            usercode: parsedData.UserCode,
                            depcode: "",
                            personID: newValue[0].UserCode ?? "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        } else if (rows.length > 1 && newValue.length > 0) {
                          const newData = newValue.map((res) => {
                            return {
                              begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              branchid: res.BranchID.toString(),
                              description: rows[0]?.description ?? "",
                              usercode: parsedData.UserCode,
                              depcode: rows[0]?.depcode ?? "",
                              personID: res.UserCode,
                              keyID: rows[0]?.keyID ?? ""
                            }
                          });
                          setRows(newData);
                        } else {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: "",
                            description: "",
                            usercode: parsedData.UserCode,
                            depcode: "",
                            personID: "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        }
                      }}
                      sx={{ width: "100%" }}
                      renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                          <li key={key} {...optionProps}>
                            <Checkbox
                              icon={icon}
                              checkedIcon={checkedIcon}
                              style={{ marginRight: 8 }}
                              checked={selected}
                            />
                            {option.UserCode}
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="เลือกกลุ่มส่วนกลาง (เลือกได้มากกว่า 1 สาขา)" />
                      )}
                    />
                  )}
                  {categoryHO === "4" && (
                    <Autocomplete
                      multiple
                      id="checkboxes-tags-demo"
                      options={users}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.UserCode}
                      onChange={(event, newValue, reason) => {
                        if (rows.length === 1 && newValue.length > 0) {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: newValue[0].BranchID.toString(),
                            description: rows[0]?.description ?? "",
                            usercode: parsedData.UserCode,
                            depcode: "",
                            personID: newValue[0].UserCode ?? "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        } else if (rows.length > 1 && newValue.length > 0) {
                          const newData = newValue.map((res) => {
                            return {
                              begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                              branchid: res.BranchID.toString(),
                              description: rows[0]?.description ?? "",
                              usercode: parsedData.UserCode,
                              depcode: rows[0]?.depcode ?? "",
                              personID: res.UserCode,
                              keyID: rows[0]?.keyID ?? ""
                            }
                          });
                          setRows(newData);
                        } else {
                          const newData = {
                            begindate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            enddate: dayjs.tz(new Date(), "Asia/Bangkok"),
                            branchid: "",
                            description: "",
                            usercode: parsedData.UserCode,
                            depcode: "",
                            personID: "",  // Assign the newValue to personID
                            keyID: (Math.random() + 1).toString(36).substring(7)
                          };
                          setRows([newData]);
                        }
                      }}
                      sx={{ width: "100%" }}
                      renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                          <li key={key} {...optionProps}>
                            <Checkbox
                              icon={icon}
                              checkedIcon={checkedIcon}
                              style={{ marginRight: 8 }}
                              checked={selected}
                            />
                            {option.UserCode}
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="เลือกกลุ่มส่วนกลาง (เลือกได้มากกว่า 1 สาขา)" />
                      )}
                    />
                  )}
                </>
              )}
              <Grid2
                display="flex"
                justifyContent="center"
                alignItems="center"
                size={12}
                sx={{ pt: 5 }}
              >
                <Button variant="contained" sx={{ width: '100%' }} onClick={createPeriod}>Submit</Button>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>
        <Backdrop
          sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Outlet />
      </Container>
    </React.Fragment>
  );
}