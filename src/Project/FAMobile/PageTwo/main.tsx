import * as React from "react";
import { Box, Stack, Card, CardHeader, Avatar, Typography, AppBar, Toolbar, IconButton, Container, Dialog, Button, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { red } from "@mui/material/colors";
import QrCodeIcon from "@mui/icons-material/QrCode";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CropFreeIcon from "@mui/icons-material/CropFree";
import { BrowserQRCodeReader } from "@zxing/browser";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import Fade from '@mui/material/Fade';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import dataConfig from "../../../config";
import NavBarMobile from '../NavMain/NavbarMobile'
import { useLocation, useNavigate } from "react-router-dom";


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

interface PerBranch {
  BranchID: number;
  Name: string;
}



interface Props {
  window?: () => Window;
  children?: React.ReactElement<unknown>;
}

function ScrollTop(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (
      (event.target as HTMLDivElement).ownerDocument || document
    ).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
      });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Fade>
  );
}

const cards = [
  {
    id: 1,
    title: "เริ่มสแกน",
    description: "Start Scan.",
    icon: <QrCodeIcon />,
  },
  {
    id: 2,
    title: "รายงานตรวจนับทรัพย์สิน",
    description: "Reported.",
    icon: <EventNoteIcon />,
  },
];

export default function MainPageTow(props: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const dataLocation = location.state;
  const branchSelect = dataLocation?.branchSelect;
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [qrData, setQrData] = React.useState<string>("");

  return (
    <Box sx={{ flexGrow: 1 }}>
      <div id="back-to-top-anchor" />
      <ThemeProvider theme={darkTheme}>
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
        >
          <NavBarMobile />
          <Toolbar sx={{ backgroundColor: '#f5f5f5', color: 'black' }}>
            <IconButton
              onClick={() => {
                navigate('/MobileHome');
              }}
              sx={{ color: 'black' }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="subtitle1" color="inherit" component="div">
              หน้าเมนู (2) (id: #{dataLocation?.branchSelect})
            </Typography>
          </Toolbar>
        </AppBar>
        <Container
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: { xs: 8, sm: 12 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Stack direction="column" spacing={2}>
              {!qrData && cards.map((card, index) => (
                <Card
                  key={index}
                  sx={{
                    width: "95vw",
                    backgroundColor: "rgba(0,121,107,1)",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "16px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0,121,107,0.85)",
                      transform: "scale(1.03)",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    },
                  }}
                  onClick={() => {
                    if (index === 0) {
                      navigate("/MobilePageTwoScanRound", {
                        state: { branchSelect }
                      });
                    } else if (index === 1) {
                      navigate("/MobilePageTwoReportedRound", {
                        state: { branchSelect }
                      });
                    }
                  }}
                >
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: red[500] }}>{card.icon}</Avatar>}
                    title={<Typography color="white">{card.title}</Typography>}
                    subheader={<Typography color="white">{card.description}</Typography>}
                  />
                </Card>
              ))}
            </Stack>
            <ScrollTop {...props}>
              <Fab size="small" aria-label="scroll back to top">
                <KeyboardArrowUpIcon />
              </Fab>
            </ScrollTop>
          </Box>
        </Container>
      </ThemeProvider>
    </Box >
  );
}
