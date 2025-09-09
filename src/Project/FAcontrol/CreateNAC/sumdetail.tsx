import * as React from 'react';
import Typography from '@mui/material/Typography';
import { TableRow, TextField, InputAdornment } from '@mui/material';
import { StyledTableCell } from '../../../components/StyledTable'
import { FAControlCreateDetail, DataAsset, RequestCreateDocument } from '../../../type/nacType';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { LocalizationProvider, DateTimePicker, renderDigitalClockTimeView, } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface DataFromHeader {
  dataAssets: DataAsset[],
  detailNAC: FAControlCreateDetail[],
  idSection: number,
  createDoc: RequestCreateDocument[],
  setCreateDoc: React.Dispatch<React.SetStateAction<RequestCreateDocument[]>>;
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
          onChange({
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
);

export default function SumDetail({ detailNAC, dataAssets, idSection, createDoc, setCreateDoc }: DataFromHeader) {

  const totalPrice = detailNAC.reduce((sum, item) => {
    const asset = dataAssets.find(res => res.Code === item.nacdtl_assetsCode);
    return sum + (asset?.Price ?? 0);
  }, 0);

  const totalPriceSeals = detailNAC.reduce((sum, item) => sum + (item.nacdtl_PriceSeals ?? 0), 0);

  const totalBookValue = detailNAC.reduce((sum, item) => sum + (item.nacdtl_bookV ?? 0), 0);

  const totalExVat = detailNAC.reduce((sum, item) => sum + (item.nacdtl_PriceSeals ?? 0) * (100 / 107), 0);

  const totalProfit = detailNAC.reduce((sum, item) => sum + (item.nacdtl_profit ?? 0), 0);


  return (
    <React.Fragment>
      <TableRow>
        {[4, 5].includes(idSection ?? 0) ? (
          <>
            <StyledTableCell colSpan={6}>รวมทั้งหมด</StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={(typeof totalPrice === 'number') ? totalPrice : ""}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={(typeof totalBookValue === 'number') ? totalBookValue : ""}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={(typeof totalPriceSeals === 'number') ? totalPriceSeals : ""}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={(typeof totalExVat === 'number') ? totalExVat : ""}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={((typeof totalPriceSeals === 'number') ? totalPriceSeals : 0) - ((typeof totalBookValue === 'number') ? totalBookValue : 0)}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
          </>
        ) : (
          <>
            <StyledTableCell colSpan={10}>รวมทั้งหมด</StyledTableCell>
            <StyledTableCell>
              <TextField
                name="numberformat"
                id="formatted-numberformat-input"
                value={(typeof totalPrice === 'number') ? totalPrice : ""}
                slotProps={{
                  input: {
                    inputComponent: NumericFormatCustom as any,
                    inputProps: { style: { textAlign: 'right', } },
                  },
                }}
                variant="standard"
              />
            </StyledTableCell>
          </>
        )}
        <StyledTableCell colSpan={2} />
      </TableRow>
      {[4, 5].includes(idSection ?? 0) && (
        <TableRow>
          <StyledTableCell colSpan={4}>
            <Typography color='error' >
              ราคาขายจริงและวันที่ได้รับเงิน*
            </Typography>
          </StyledTableCell>
          <StyledTableCell colSpan={5} align='right'>
            <TextField
              name="numberformat"
              id="formatted-numberformat-input"
              required={[12].includes(createDoc[0].nac_status ?? 0)}
              error={[12].includes(createDoc[0].nac_status ?? 0) && 
                    (createDoc[0].real_price === null || createDoc[0].real_price === undefined)}
              value={(typeof createDoc[0].real_price === 'number') ? createDoc[0].real_price : ""}
              slotProps={{
                input: {
                  inputComponent: NumericFormatCustom as any,
                  inputProps: { style: { textAlign: 'right', } },
                },
              }}
              onChange={(e) => {
                const realprice = [...createDoc];
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                realprice[0].real_price = value;
                setCreateDoc(realprice);
              }}
              variant="standard"
            />
          </StyledTableCell>
          <StyledTableCell colSpan={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                name='txtCreateDate'
                formatDensity="spacious"
                format="DD/MM/YYYY HH:mm"
                views={['year', 'month', 'day', 'hours']}
                viewRenderers={{
                  hours: renderDigitalClockTimeView,
                  seconds: null,
                }}
                value={dayjs(createDoc[0].realPrice_Date) ?? ""}
                closeOnSelect={true}
                sx={{ width: '100%' }}
                slotProps={{
                  textField: {
                    variant: 'standard', // This applies the 'standard' variant style to the input field
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="subtitle1">
                            วันที่ได้รับเงิน :
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  },
                }}
                ampm={false}
                onChange={(newValue) => {
                  if (newValue) {
                    const realprice = [...createDoc]
                    realprice[0].realPrice_Date = newValue;
                    setCreateDoc(realprice);
                  }
                }}
              />
            </LocalizationProvider>
          </StyledTableCell>
          <StyledTableCell />
        </TableRow>
      )}
    </React.Fragment >
  );
}