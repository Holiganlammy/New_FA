import * as React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './login';
import Home from './Dashboard/home3';
import NavBar from './components/Navbar';
import Create from './Project/FAcontrol/CreateNAC/Create';
import ListNacPage from './Project/FAcontrol/ListNAC/ListNacPage';
import ListPeriod from './Project/FAcontrol/Period/ListPeriod';
import CreatePeriod from './Project/FAcontrol/Period/CreatePeriod';
import HistoryList from './Project/FAcontrol/HistoryList/HistoryList';
import MainEbookAssets from './Project/FAcontrol/ListEbook/mainAssets';
import MainListCountedAssets from './Project/FAcontrol/ListFromCounted/mainAssets';
import SelectBU from './Project/FAcontrol/CountedFromUser/SelectBU';
import MainAssets from './Project/FAcontrol/ListAssets/mainAssets';
import Profile from './Account/profile';
import ControlSection from './controlSection/main';
import MobileHome from './Project/FAMobile/MobileHome';
import MobilePageTwo from './Project/FAMobile/PageTwo/main';
import MobilePageTwoScanRound from './Project/FAMobile/PageTwo/Scan/round';
import MobilePageTwoReportedRound from './Project/FAMobile/PageTwo/Reported/round';
import MobilePageTwoReported from './Project/FAMobile/PageTwo/Reported/reported';
import ResultScan from './Project/FAMobile/PageTwo/Scan/ResultScan';
import MyAssets from './Project/FAMobile/PageOne/MyAssets/MyAssets';
import { CssBaseline, Box } from '@mui/material';
import ResetPassword from './reset-password';

const App: React.FC = () => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const date_login: string | null = localStorage.getItem('date_login');
  const now = new Date();

  const isMoreThanOneDayAgo = (dateStr: string | null): boolean => {
    if (!dateStr) {
      return false;
    }
    const loginDate = new Date(
      `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${dateStr.substring(8, 10)}:${dateStr.substring(10, 12)}:${dateStr.substring(12, 14)}`
    );
    const difference = now.getTime() - loginDate.getTime();
    return difference > 24 * 60 * 60 * 1000;
  };

  const hasExpired = isMoreThanOneDayAgo(date_login);
  const token = localStorage.getItem('token');
  const resetPasswordToken = localStorage.getItem('request_reset_token');
  const changePassword = localStorage.getItem('changepassword');

  React.useEffect(() => {
    const checkDevice = () => {
      const currentDeviceType = window.innerWidth < 1100 ? "mobile" : "desktop";
      if (token && !hasExpired && currentDeviceType === 'mobile' && currentPath === '/') {
        navigate('/MobileHome');
      }
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, [token, hasExpired, currentPath, navigate]);

  const checkLoginStatus = () => {
    const resetPasswordData = localStorage.getItem('Request_ResetPassword');
    
    if (resetPasswordData || changePassword === 'false') {
      return 'reset_password';
    }

    if (!token || hasExpired) {
      return 'login';
    }

    return 'authenticated';
  };

  const loginStatus = checkLoginStatus();

  console.log(loginStatus)
  // แสดง Login page
  if (loginStatus === 'login') {
    return <Login />;
  }

  // แสดง Reset Password page
  if (loginStatus === 'reset_password') {
    return <ResetPassword />;
  }

  // แสดงระบบปกติ
  return (
    <Box
      sx={{
        width: '100%',
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
      }}
    >
      <CssBaseline enableColorScheme />
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/Home" />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/NAC_CREATE" element={<Create />} />
        <Route path="/NAC_OPERATOR" element={<ListNacPage />} />
        <Route path="/NAC_ROW" element={<ListNacPage />} />
        <Route path="/EditPeriod" element={<ListPeriod />} />
        <Route path="/CreatePeriod" element={<CreatePeriod />} />
        <Route path="/FETCH_ASSETS" element={<MainAssets />} />
        <Route path="/EBookMain" element={<MainEbookAssets />} />
        <Route path="/Reported_Assets_Counted" element={<MainListCountedAssets />} />
        <Route path="/Report" element={<SelectBU />} />
        <Route path="/History_of_Assets" element={<HistoryList />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/ControlSection" element={<ControlSection />} />
        <Route path="/EBookBranch" element={<MainEbookAssets />} />
        <Route path="/Account_BrnachAssets" element={<MainAssets />} />

        {/* Mobile Routes */}
        <Route path="/MobileHome" element={<MobileHome />} />
        <Route path="/MyAssets" element={<MyAssets />} />
        <Route path="/MobilePageTwo" element={<MobilePageTwo />} />
        <Route path="/MobilePageTwoScanRound" element={<MobilePageTwoScanRound />} />
        <Route path="/MobilePageTwoReportedRound" element={<MobilePageTwoReportedRound />} />
        <Route path="/MobilePageTwoReported" element={<MobilePageTwoReported />} />
        <Route path="/ResultScan" element={<ResultScan />} />
      </Routes>
    </Box>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;