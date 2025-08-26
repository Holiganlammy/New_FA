import * as React from 'react';
import { FAControlCreateDetail, DataAsset } from '../../../type/nacType';
import { StyledTableCell } from '../../../components/StyledTable';
import { alpha, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem, ListItemIcon, Stack, TableBody, TableRow, TextField, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { format } from 'date-fns';
import dataConfig from '../../../config';
import Swal from 'sweetalert2';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import client from '../../../lib/axios/interceptor';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return format(date, 'dd/MM/yyyy');
}

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const NumericFormatCustom = React.forwardRef<NumericFormatProps, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values: { value: string }) => {
          onChange?.({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        decimalScale={3}          // จำนวนตำแหน่งทศนิยม
        fixedDecimalScale={false}  // ใช้จำนวนทศนิยมที่กำหนดเสมอ
      />
    );
  },
)

function CaluculatedExVat(nacdtl_PriceSeals: number | null | undefined) {
  if (nacdtl_PriceSeals) {
    const exVat = nacdtl_PriceSeals * (100 / 107)
    return exVat;
  } else {
    return 0;
  }

}

interface DataFromHeader {
  columnDetail: { columns: string, name: string, show: boolean, col: number, width: string }[],
  dataAssets: DataAsset[],
  detailNAC: FAControlCreateDetail[],
  setDetailNAC: React.Dispatch<React.SetStateAction<FAControlCreateDetail[]>>;
  nac_type: number | null | undefined;
}

export default function Source({ dataAssets, detailNAC, setDetailNAC, columnDetail, nac_type }: DataFromHeader) {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [openDialogImage, setOpenDialogImage] = React.useState(false);
  const [selectedImage, setSelectedImageImage] = React.useState<{ url: string | null; Imagtype: string, indexImg: number } | null>(null);

  const handleClickOpenImage = (imageUrl: string, type: string, index: number) => {
    setSelectedImageImage({ url: imageUrl, Imagtype: type, indexImg: index });
    setOpenDialogImage(true);
  };

  const handleCloseImage = async () => {
    const index = detailNAC.findIndex(res => res.nacdtl_image_1 === selectedImage?.url || res.nacdtl_image_2 === selectedImage?.url)
    const response = await client.post('/FA_control_update_DTL', {
      usercode: parsedData.UserCode,
      nac_code: detailNAC[index].nac_code,
      nacdtl_assetsCode: detailNAC[index].nacdtl_assetsCode,
      nacdtl_assetsName: detailNAC[index].nacdtl_assetsName,
      nacdtl_assetsSeria: detailNAC[index].nacdtl_assetsSeria,
      nacdtl_assetsDtl: detailNAC[index].nacdtl_assetsDtl,
      nacdtl_assetsPrice: detailNAC[index].nacdtl_assetsPrice,
      image_1: detailNAC[index].nacdtl_image_1,
      image_2: detailNAC[index].nacdtl_image_2,

    }, { headers: dataConfig().header })
    console.log(response);
    if (response.status === 200) {
      setOpenDialogImage(false);
      setSelectedImageImage(null);
    }
  };

  const handleDelete = (index: number) => {
    if (detailNAC.length > 1) {
      const updatedDetailNAC = [...detailNAC];
      updatedDetailNAC.splice(index, 1);
      setDetailNAC(updatedDetailNAC);
    } else {
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

      setDetailNAC([clearedRow]);
    }
  };

  const handleChange = (indexDtl: number, field: keyof FAControlCreateDetail) => (event: { target: { value: string } }) => {
    const listDtl = [...detailNAC];

    // จัดการกับฟิลด์ที่เป็น number
    if (field === 'nacdtl_PriceSeals' || field === 'nacdtl_bookV') {
      // แปลงค่าจาก string เป็น number หรือใช้ null หากค่าว่างเปล่า
      const newValue = event.target.value ? parseFloat(event.target.value) : null;
      listDtl[indexDtl][field] = newValue as any; // ใช้ `as any` เพื่อหลีกเลี่ยง type error

      if (listDtl[indexDtl].nacdtl_PriceSeals || listDtl[indexDtl].nacdtl_bookV) {
        const beforeVat = CaluculatedExVat(listDtl[indexDtl].nacdtl_PriceSeals ?? 0);
        const bv = listDtl[indexDtl].nacdtl_bookV ?? 0;
        // คำนวณกำไรใหม่
        listDtl[indexDtl].nacdtl_profit = beforeVat - bv;
      }
    }


    setDetailNAC(listDtl);
  };

  const handleChangeAuto = async (newValue: string | null, indexDtl: number) => {

    await client.post('/FA_Control_CheckAssetCode_Process', { nacdtl_assetsCode: newValue }, { headers: dataConfig().header })
      .then((res) => {
        if (res.status === 200) {
          Swal.fire({
            icon: "warning",
            title: `${res.data[0].checkProcess}`,
            showConfirmButton: false,
            timer: 1500
          })
        } else {
          const listDtl = [...detailNAC];
          listDtl[indexDtl].nacdtl_assetsCode = newValue ?? ''; // Update with the new value
          setDetailNAC(listDtl); // Make sure to update the state with the new list
        }
      })
  };

  const filteredColumns = columnDetail.filter(resFilter => resFilter.show);

  const handleUploadFile_1 = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();

    const allowedImageExtensions = ['jpg', 'png', 'gif', 'xbm', 'tif', 'pjp', 'svgz', 'jpeg', 'jfif', 'bmp', 'webp', 'svg'];

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get file extension

      if (fileExtension && allowedImageExtensions.includes(fileExtension)) {
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        try {
          const response = await client.post(
            `/check_files_NewNAC`,
            formData_1,
            { headers: dataConfig().headerUploadFile }
          );

          const list = [...detailNAC];

          // Check if the index is valid
          if (list[index]) {
            // Make sure nacdtl_image_1 exists
            list[index].nacdtl_image_1 = `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`;
            setDetailNAC(list); // Assuming you have a state setter for detailNAC
            setSelectedImageImage({
              url: `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`,
              Imagtype: 'nacdtl_image_1',
              indexImg: index
            });
          } else {
            console.error(`Index ${index} is out of bounds for detailNAC.`);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: 'ไฟล์ประเภทนี้ไม่ได้รับอนุญาติให้ใช้งานในระบบ \nใช้ได้เฉพาะ .csv, .xls, .txt, .ppt, .doc, .pdf, .jpg, .png, .gif',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  };

  const handleUploadFile_2 = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();

    const allowedImageExtensions = ['jpg', 'png', 'gif', 'xbm', 'tif', 'pjp', 'svgz', 'jpeg', 'jfif', 'bmp', 'webp', 'svg'];

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get file extension

      if (fileExtension && allowedImageExtensions.includes(fileExtension)) {
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        try {
          const response = await client.post(
            `/check_files_NewNAC`,
            formData_1,
            { headers: dataConfig().headerUploadFile }
          );

          const list = [...detailNAC];

          // Check if the index is valid
          if (list[index]) {
            // Make sure nacdtl_image_2 exists
            list[index].nacdtl_image_2 = `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`;
            setDetailNAC(list); // Assuming you have a state setter for detailNAC
            setSelectedImageImage({
              url: `${dataConfig().httpViewFile}/NEW_NAC/${response.data.attach[0].ATT}.${fileExtension}`,
              Imagtype: 'nacdtl_image_2',
              indexImg: index
            });
          } else {
            console.error(`Index ${index} is out of bounds for detailNAC.`);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: 'ไฟล์ประเภทนี้ไม่ได้รับอนุญาติให้ใช้งานในระบบ \nใช้ได้เฉพาะ .csv, .xls, .txt, .ppt, .doc, .pdf, .jpg, .png, .gif',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  };



  return (
    <>
      <TableBody>
        {detailNAC.map((resDtl, indexDtl) => (
          <TableRow key={indexDtl}>
            {filteredColumns.map((res, index) => {
              switch (res.columns) {
                case 'Code':
                  return (
                    <StyledTableCell key={`code-${index}`} colSpan={res.col}>
                      <Autocomplete
                        id="Code"
                        freeSolo
                        options={dataAssets.map((option) => option.Code).filter((code) => !detailNAC.some((item) => item.nacdtl_assetsCode === code))}
                        value={resDtl.nacdtl_assetsCode ?? ""}
                        onChange={(event, newValue) => handleChangeAuto(newValue, indexDtl)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder="รหัสทรัพย์สิน"
                          />
                        )}
                      />
                    </StyledTableCell>
                  );
                case 'serialNo':
                  return (
                    <StyledTableCell key={`serialNo-${index}`} colSpan={res.col}>
                      <Stack direction="column" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        {nac_type !== 3 && resDtl.nacdtl_assetsSeria && resDtl.nacdtl_assetsSeria || dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.SerialNo}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.SerialNo}
                        {nac_type === 3 && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.SerialNo && (
                          <React.Fragment>
                            <Divider />
                            <TextField
                              id="standard-basic"
                              placeholder="new SerialNo"
                              variant="standard"
                              size="small"
                              value={!resDtl.nacdtl_assetsSeria ? dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.SerialNo : resDtl.nacdtl_assetsSeria}
                              onChange={(e) => {
                                const list = [...detailNAC]
                                list[indexDtl]['nacdtl_assetsSeria'] = e.target.value
                                setDetailNAC(list)
                              }}
                            />
                          </React.Fragment>
                        )}
                      </Stack>
                    </StyledTableCell>
                  );
                case 'name':
                  return (
                    <StyledTableCell key={`name-${index}`} colSpan={res.col}>
                      <Stack direction="column" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        {nac_type !== 3 && resDtl.nacdtl_assetsName && resDtl.nacdtl_assetsName || nac_type !== 3 && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Name}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Name}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && (
                          <React.Fragment>
                            <Divider />
                            <TextField
                              id="standard-basic"
                              placeholder="new Name"
                              variant="standard"
                              size="small"
                              value={!resDtl.nacdtl_assetsName ? dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Name : resDtl.nacdtl_assetsName}
                              onChange={(e) => {
                                const list = [...detailNAC]
                                list[indexDtl]['nacdtl_assetsName'] = e.target.value
                                setDetailNAC(list)
                              }}
                            />
                          </React.Fragment>
                        )}
                      </Stack>
                    </StyledTableCell>
                  );
                case 'date_asset':
                  return (
                    <StyledTableCell key={`date_asset-${index}`} colSpan={res.col}>
                      <Stack direction="column" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        {nac_type !== 3 && resDtl.create_date && dayjs(resDtl.create_date).format('DD/MM/YYYY') || nac_type !== 3 && dayjs(dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.CreateDate).format('DD/MM/YYYY') || ''}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && dayjs(dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.CreateDate).format('DD/MM/YYYY') || ''}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && (
                          <React.Fragment>
                            <Divider />
                            <TextField
                              id="standard-basic"
                              placeholder="new Date"
                              variant="standard"
                              size="small"
                              value={!resDtl.create_date && resDtl.nacdtl_assetsCode && dayjs(dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.CreateDate).format('DD/MM/YYYY') || ''}
                            />
                          </React.Fragment>
                        )}
                      </Stack>
                    </StyledTableCell>
                  );
                case 'OwnerCode':
                  return (
                    <StyledTableCell key={`OwnerCode-${index}`} colSpan={res.col}>
                      <Stack direction="column" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        {nac_type !== 3 && resDtl.OwnerCode && resDtl.OwnerCode || nac_type !== 3 && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.OwnerCode}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.OwnerCode}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && (
                          <React.Fragment>
                            <Divider />
                            <TextField
                              id="standard-basic"
                              placeholder="new OwnerCode"
                              variant="standard"
                              size="small"
                              value={!resDtl.OwnerCode ? dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.OwnerCode : resDtl.OwnerCode}
                              onChange={(e) => {
                                const list = [...detailNAC]
                                list[indexDtl]['OwnerCode'] = e.target.value
                                setDetailNAC(list)
                              }}
                            />
                          </React.Fragment>
                        )}
                      </Stack>
                    </StyledTableCell>
                  );
                case 'detail':
                  return (
                    <StyledTableCell key={`detail-${index}`} colSpan={res.col}>
                      <Stack direction="column" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        {nac_type !== 3 && resDtl.nacdtl_assetsDtl && resDtl.nacdtl_assetsDtl || nac_type !== 3 && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Details}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Details}
                        {nac_type === 3 && resDtl.nacdtl_assetsCode && (
                          <React.Fragment>
                            <Divider />
                            <TextField
                              id="standard-basic"
                              placeholder="new Details"
                              variant="standard"
                              size="small"
                              value={!resDtl.nacdtl_assetsDtl ? dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Details : resDtl.nacdtl_assetsDtl}
                              onChange={(e) => {
                                const list = [...detailNAC]
                                list[indexDtl]['nacdtl_assetsDtl'] = e.target.value
                                setDetailNAC(list)
                              }}
                            />
                          </React.Fragment>
                        )}
                      </Stack>
                    </StyledTableCell>
                  );
                case 'price':
                  return (
                    <StyledTableCell key={`price-${index}`} colSpan={res.col}>
                      <TextField
                        name="numberformat"
                        id="formatted-numberformat-input"
                        value={resDtl.nacdtl_assetsPrice || dataAssets.find(res => res.Code === resDtl.nacdtl_assetsCode)?.Price || 0}
                        disabled
                        sx={{
                          backgroundColor: "transparent", // ลบสีพื้นหลัง
                          "& .MuiInputBase-input.Mui-disabled": {
                            WebkitTextFillColor: "#000", // เปลี่ยนสีตัวอักษรเป็นดำ
                            opacity: 1, // ป้องกันสีซีด
                          },
                          "&:before, &:after": {
                            display: "none", // ลบเส้นใต้
                          },
                        }}
                        slotProps={{
                          input: {
                            inputComponent: NumericFormatCustom as any,
                            inputProps: { style: { textAlign: 'right' } },
                          },
                        }}
                        variant="standard"
                      />
                    </StyledTableCell>
                  );
                case 'bookValue':
                  return (
                    <StyledTableCell key={`bookValue-${index}`} colSpan={res.col}>
                      <TextField
                        name="numberformat"
                        id="formatted-numberformat-input"
                        value={(typeof resDtl.nacdtl_bookV === 'number') ? resDtl.nacdtl_bookV : ""}
                        slotProps={{
                          input: {
                            inputComponent: NumericFormatCustom as any,
                            inputProps: { style: { textAlign: 'right' } },
                          },
                        }}
                        onChange={handleChange(indexDtl, 'nacdtl_bookV')}
                        variant="standard"
                      />
                    </StyledTableCell>
                  );
                case 'priceSeals':
                  return (
                    <StyledTableCell key={`priceSeals-${index}`} colSpan={res.col}>
                      <TextField
                        name="numberformat"
                        id="formatted-numberformat-input"
                        value={(typeof resDtl.nacdtl_PriceSeals === 'number') ? resDtl.nacdtl_PriceSeals : ""}
                        slotProps={{
                          input: {
                            inputComponent: NumericFormatCustom as any,
                            inputProps: { style: { textAlign: 'right' } },
                          },
                        }}
                        onChange={handleChange(indexDtl, 'nacdtl_PriceSeals')}
                        variant="standard"
                      />
                    </StyledTableCell>
                  );
                case 'Expiration':
                  return (
                    <StyledTableCell key={`Expiration-${index}`} colSpan={res.col}>
                      <Stack sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <TextField
                          name="numberformat"
                          id="formatted-numberformat-input"
                          value={typeof resDtl.nacdtl_PriceSeals === 'number' ? CaluculatedExVat(resDtl.nacdtl_PriceSeals) : ""}
                          slotProps={{
                            input: {
                              inputComponent: NumericFormatCustom as any,
                              inputProps: { style: { textAlign: 'right' } },
                            },
                          }}
                          variant="standard"
                        />
                      </Stack>
                    </StyledTableCell>
                  );
                case 'profit':
                  return (
                    <StyledTableCell key={`profit-${index}`} colSpan={res.col}>
                      <TextField
                        name="numberformat"
                        id="formatted-numberformat-input"
                        value={(typeof resDtl.nacdtl_PriceSeals === 'number' || typeof resDtl.nacdtl_bookV === 'number') ? (resDtl.nacdtl_PriceSeals ?? 0) - (resDtl.nacdtl_bookV ?? 0) : ""}
                        slotProps={{
                          input: {
                            inputComponent: NumericFormatCustom as any,
                            inputProps: { style: { textAlign: 'right' } },
                          },
                        }}
                        variant="standard"
                      />
                    </StyledTableCell>
                  );
                case 'file':
                  return (
                    <StyledTableCell key={`profit-${index}`} colSpan={res.col} align='center'>
                      {resDtl.nacdtl_assetsCode &&
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Tooltip title={!resDtl.nacdtl_image_1 ? 'ยังไม่มีไฟล์' : resDtl.nacdtl_image_1}>
                            {!resDtl.nacdtl_image_1 ?
                              <IconButton color='error' aria-label="upload picture" component="label">
                                <input hidden type="file" name='file' accept='image/*'
                                  onChange={(e) => handleUploadFile_1(e, indexDtl)} />
                                <FilePresentIcon sx={{ fontSize: '1.2rem' }} />
                              </IconButton> :
                              <IconButton
                                color='success'
                                component="label"
                                onClick={() => handleClickOpenImage(resDtl.nacdtl_image_1 ?? '', 'nacdtl_image_1', indexDtl)}
                              >
                                <FilePresentIcon sx={{ fontSize: '1.2rem' }} />
                              </IconButton>
                            }
                          </Tooltip>
                          {nac_type === 1 && (
                            <Tooltip title={!resDtl.nacdtl_image_2 ? 'ยังไม่มีไฟล์' : resDtl.nacdtl_image_1}>
                              {!resDtl.nacdtl_image_2 ?
                                <IconButton color='error' aria-label="upload picture" component="label">
                                  <input hidden type="file" name='file' accept='image/*'
                                    onChange={(e) => handleUploadFile_2(e, indexDtl)} />
                                  <FilePresentIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton> :
                                <IconButton
                                  color='success'
                                  component="label"
                                  onClick={() => handleClickOpenImage(resDtl.nacdtl_image_2 ?? '', 'nacdtl_image_2', indexDtl)}
                                >
                                  <FilePresentIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              }
                            </Tooltip>
                          )}
                        </Stack>
                      }
                    </StyledTableCell>
                  );
                default:
                  return null;
              }
            })}
            <StyledTableCell align="center">
              <IconButton
                onClick={() => handleDelete(indexDtl)}
                sx={(theme) => ({
                  color: theme.palette.common.black,
                  '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.3) }
                })}
              >
                <DeleteOutlineOutlinedIcon />
              </IconButton>
            </StyledTableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* Dialog for displaying the image */}
      <BootstrapDialog
        open={openDialogImage}
        onClose={() => {
          setOpenDialogImage(false);
          setSelectedImageImage(null);
        }}
        fullWidth
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          {selectedImage?.Imagtype}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenDialogImage(false);
            setSelectedImageImage(null);
          }}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent style={{ textAlign: 'center' }} dividers>
          <Stack
            direction="column"
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <img
              src={selectedImage?.url || ''}
              alt={selectedImage?.Imagtype || ''}
              style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '60vh' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
              }}
            />
            <Button
              component="label"
              role={undefined}
              variant="contained"
              tabIndex={-1}
              sx={{ maxWidth: '400px' }}
              startIcon={<CloudUploadIcon />}
            >
              Upload files
              <input hidden type="file" name='file' accept='image/*' onChange={(e) => {
                if (selectedImage?.Imagtype === 'nacdtl_image_1') {
                  handleUploadFile_1(e, selectedImage?.indexImg ?? 0)
                } else {
                  handleUploadFile_2(e, selectedImage?.indexImg ?? 0)
                }
              }} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleCloseImage}>
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}
