import * as React from 'react';
import Box from '@mui/material/Box';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CustomTreeItem from './CustomTreeIcon';
import dataConfig from "../config";
import { MenuItemTree } from '../type/nacType';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { Outlet, useNavigate } from "react-router";
import LibraryAddIcon from '@mui/icons-material/LibraryAddOutlined';
import AvTimerOutlinedIcon from '@mui/icons-material/AvTimerOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import client from '../lib/axios/interceptor';

function DotIcon() {
  return (
    <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}>
      <svg width={6} height={6}>
        <circle cx={3} cy={3} r={3} fill="white" />
      </svg>
    </Box>
  );
}

const getIconForId = (id: string): React.ComponentType => {
  switch (id) {
    case 'NAC':
      return () => <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}><LibraryAddIcon sx={{ fontSize: '1.1rem' }} /></Box>;
    case 'STATUS':
      return () => <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}><ReceiptLongIcon sx={{ fontSize: '1.1rem' }} /></Box>;
    case 'PERIOD':
      return () => <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}><AvTimerOutlinedIcon sx={{ fontSize: '1.1rem' }} /></Box>;
    case 'REPORT':
      return () => <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}><AssessmentOutlinedIcon sx={{ fontSize: '1.1rem' }} /></Box>;
    case 'BPC':
      return () => <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}><GroupAddOutlinedIcon sx={{ fontSize: '1.1rem' }} /></Box>;
    default:
      return DotIcon;
  }
};

const getId = (id: string) => {
  switch (id) {
    case 'NAC-1':
      return `?id=1`;
    case 'NAC-3':
      return `?id=3`;
    case 'NAC-2':
      return `?id=2`;
    case 'NAC-4':
      return `?id=4`;
    case 'NAC-5':
      return `?id=5`;
    default:
      return "";
  }
};

function OAIcon(name: string, permission: boolean) {
  return (
    <Box sx={{ marginRight: 1, width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", }}>
        {name}
        {permission && (<SupervisorAccountIcon fontSize="small" color="warning" />)}
      </Stack>
    </Box>
  );
}

export default function CustomStyling() {

  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [permission_menuID, setPermission_menuID] = React.useState<number[]>([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetData = async () => {
      // POST request using axios with set header

      const body = { Permission_TypeID: 1, userID: parsedData.userid }
      await client.post('/select_Permission_Menu_NAC', body, { headers: dataConfig().header })
        .then(response => {
          setPermission_menuID(response.data.data.map((res: { Permission_MenuID: number; }) => res.Permission_MenuID))
        });
    }
    fetData();
  }, [parsedData.userid]);

  const mainTree: { id: string, name: string, permission: boolean }[] = [
    {
      id: 'NAC',
      name: 'NAC CREATE',
      permission: true,
    },
    {
      id: 'STATUS',
      name: 'LIST NAC',
      permission: true,
    },
    {
      id: 'PERIOD',
      name: 'NAC PERIOD',
      permission: permission_menuID.includes(3) || permission_menuID.includes(4),
    },
    {
      id: 'REPORT',
      name: 'NAC REPORT',
      permission: true,
    },
    // {
    //   id: 'BPC',
    //   name: 'ASSETS BPC',
    //   permission: permission_menuID.includes(13),
    // },
  ]

  const menuTree: MenuItemTree[] = [
    {
      id: "NAC-1",
      menuName: OAIcon("เพิ่มบัญชีทรัพย์สิน", permission_menuID.includes(1)),
      menu_url: "/NAC_CREATE",
      permission: permission_menuID.includes(1),
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "NAC-3",
      menuName: OAIcon("เปลี่ยนแปลงรายละเอียด", permission_menuID.includes(1)),
      menu_url: "/NAC_CREATE",
      permission: permission_menuID.includes(1),
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "NAC-2",
      menuName: OAIcon("โยกย้ายทรัพย์สิน", false),
      menu_url: "/NAC_CREATE",
      permission: true,
      permission_branch: true,
    },
    {
      id: "NAC-5",
      menuName: OAIcon("ขายทรัพย์สิน", false),
      menu_url: "/NAC_CREATE",
      permission: true,
      permission_branch: true,
    },
    {
      id: "NAC-4",
      menuName: OAIcon("ตัดบัญชีทรัพย์สิน", parsedData.branchid === 901),
      menu_url: "/NAC_CREATE",
      permission: parsedData.branchid === 901,
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "STATUS-2",
      menuName: OAIcon("รายการ NAC", false),
      menu_url: permission_menuID.includes(2) ? "/NAC_OPERATOR" : "/NAC_ROW",
      permission: true,
      permission_branch: true,
    },
    {
      id: "PERIOD-1",
      menuName: OAIcon("เพิ่มรอบตรวจนับ", permission_menuID.includes(3)),
      menu_url: "/CreatePeriod",
      permission: permission_menuID.includes(3),
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "PERIOD-2",
      menuName: OAIcon("รายการรอบตรวจนับ", permission_menuID.includes(4)),
      menu_url: "/EditPeriod",
      permission: permission_menuID.includes(4),
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "REPORT-1",
      menuName: OAIcon("รายงานตรวจนับทรัพย์สิน", false),
      menu_url: permission_menuID.includes(7) ? "/Reported_Assets_Counted" : "/Report",
      permission: true,
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "REPORT-2",
      menuName: OAIcon("ประวัติการ NAC ทรัพย์สิน", permission_menuID.includes(8)),
      menu_url: "/History_of_Assets",
      permission: permission_menuID.includes(8),
      permission_branch: true,
    },
    {
      id: "REPORT-3",
      menuName: OAIcon("E-BOOK", false),
      menu_url: parsedData.branchid === 901 ? '/EBookMain' : '/EBookBranch',
      permission: true,
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "REPORT-4",
      menuName: OAIcon("ทะเบียนทรัพย์สิน", false),
      menu_url: parsedData.branchid === 901 ? '/FETCH_ASSETS' : '/Account_BrnachAssets',
      permission: true,
      permission_branch: parsedData.branchid === 901,
    },
    {
      id: "BPC-1",
      menuName: OAIcon("E-Book BPC", false),
      menu_url: "/BSAssetsMain",
      permission: true,
      permission_branch: true,
    },
    {
      id: "BPC-2",
      menuName: OAIcon("สถานะรายการทรัพย์สินผู้ร่วม", false),
      menu_url: "/BpcStatus",
      permission: true,
      permission_branch: true,
    },
    {
      id: "BPC-3",
      menuName: OAIcon("ประวัติทรัพย์สินผู้ร่วม", false),
      menu_url: "/TransectionList",
      permission: true,
      permission_branch: true,
    }
  ];

  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      <Box sx={{ minWidth: 300 }}>
        <SimpleTreeView>
          {mainTree.filter(find => find.permission).map((main) => (
            <React.Fragment key={main.id}>
              {main.id === "NAC" && <Box sx={{ pl: 2, pt: 2 }}><Typography>PURE ASSETS</Typography></Box>}
              {main.id === "BPC" && permission_menuID.includes(13) && <Box sx={{ pl: 2, pt: 2 }}><Typography>BPC ASSETS</Typography></Box>}
              <CustomTreeItem itemId={main.id} label={main.name} labelIcon={getIconForId(main.id)}>
                {menuTree.filter(find => find.permission).map((res) => (
                  <React.Fragment key={res.id}>
                    {res.id.includes(main.id) && (
                      <CustomTreeItem
                        key={res.id}
                        onClick={() => {
                          const queryParam = getId(res.id);
                          if (queryParam) {
                            navigate(`${res.menu_url}${queryParam}`);
                          } else {
                            navigate(`${res.menu_url}`);
                          }
                        }}
                        itemId={res.id}
                        label={res.menuName}
                        labelIcon={DotIcon}
                      />
                    )}
                  </React.Fragment>
                ))}
              </CustomTreeItem>
            </React.Fragment>
          ))}
        </SimpleTreeView>
      </Box>
      <Outlet />
    </Stack>
  );
}
