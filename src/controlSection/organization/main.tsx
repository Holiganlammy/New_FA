import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Autocomplete, Avatar, CardHeader, Chip, Divider, Stack, TextField, Typography } from '@mui/material';
import { DataUser, EmployeeNode, HierarchyData, Employee } from '../../type/nacType';
import dataConfig from '../../config';
import { styled, alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  TreeItem2,
  TreeItem2Label,
  TreeItem2Props,
} from '@mui/x-tree-view/TreeItem2';
import {
  UseTreeItem2LabelInputSlotOwnProps,
  UseTreeItem2LabelSlotOwnProps,
  useTreeItem2,
} from '@mui/x-tree-view/useTreeItem2';
import { useTreeItem2Utils } from '@mui/x-tree-view/hooks';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import client from '../../lib/axios/interceptor';

type ExtendedTreeItemProps = {
  editable?: boolean;
  id: string;
  label: string;
  usercode: string;
  position: string;
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  ...theme.typography.body1,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: "none",
  boxSizing: "border-box",
  width: 150,
}));

function Label({ children, ...other }: UseTreeItem2LabelSlotOwnProps) {
  return (
    <TreeItem2Label
      {...other}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        justifyContent: 'space-between',
        minHeight: 30,
      }}
    >
      {children}
    </TreeItem2Label>
  );
}

interface CustomLabelInputProps extends UseTreeItem2LabelInputSlotOwnProps {
  handleCancelItemLabelEditing: (event: React.SyntheticEvent) => void;
  handleSaveItemLabel: (event: React.SyntheticEvent, label: string) => void;
  item: TreeViewBaseItem<ExtendedTreeItemProps>;
}

const LabelInput = React.forwardRef(function LabelInput(
  {
    item,
    handleCancelItemLabelEditing,
    handleSaveItemLabel,
    ...props
  }: Omit<CustomLabelInputProps, 'ref'>,
  ref: React.Ref<HTMLInputElement>,
) {
  const [users, setUsers] = React.useState<DataUser[]>([]);

  const [initialNameValue, setInitialNameValue] = React.useState({
    name: item.usercode,
    label: item.label,
    positin: item.position,
  });

  const [nameValue, setNameValue] = React.useState({
    name: item.usercode,
    label: item.label,
    positin: item.position,
  });

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue((prev) => ({ ...prev, name: event.target.value }));
  };

  const reset = () => {
    setNameValue(initialNameValue);
  };

  const save = () => {
    setInitialNameValue(nameValue);
  };

  const fetchDataUsers = async () => {
    try {
      // ดึงข้อมูล users ทั้งหมด
      const userResponse = await client.get('/User_List', { headers: dataConfig().header });
      if (userResponse.status === 200) {
        setUsers(userResponse.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (users.length === 0) {
    fetchDataUsers()
  }

  return (
    <React.Fragment>
      <Autocomplete
        freeSolo
        options={users.map((option) => option.UserCode)}
        value={nameValue.name}
        renderInput={(params) => <StyledTextField {...params} size="small" />}
      />
      {nameValue.label}
      <IconButton
        color="success"
        size="small"
        onClick={(event: React.MouseEvent) => {
          handleSaveItemLabel(event, `${nameValue.name} ${nameValue.label}`);
          save();
        }}
      >
        <CheckIcon fontSize="small" />
      </IconButton>
      <IconButton
        color="error"
        size="small"
        onClick={(event: React.MouseEvent) => {
          handleCancelItemLabelEditing(event);
          reset();
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );
});

const CustomTreeItem2 = React.forwardRef(function CustomTreeItem2(
  props: TreeItem2Props,
  ref: React.Ref<HTMLLIElement>,
) {
  const { interactions } = useTreeItem2Utils({
    itemId: props.itemId,
    children: props.children,
  });
  const { publicAPI } = useTreeItem2(props);

  const handleInputBlur: UseTreeItem2LabelInputSlotOwnProps['onBlur'] = (event) => {
    event.defaultMuiPrevented = true;
  };

  const handleInputKeyDown: UseTreeItem2LabelInputSlotOwnProps['onKeyDown'] = (
    event,
  ) => {
    event.defaultMuiPrevented = true;
  };

  return (
    <TreeItem2
      {...props}
      ref={ref}
      slots={{ label: Label, labelInput: LabelInput }}
      slotProps={{
        labelInput: {
          item: publicAPI.getItem(props.itemId),
          onBlur: handleInputBlur,
          onKeyDown: handleInputKeyDown,
          handleCancelItemLabelEditing: interactions.handleCancelItemLabelEditing,
          handleSaveItemLabel: interactions.handleSaveItemLabel,
        } as any,
      }}
    />
  );
});

export default function Profile() {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;


  const [treeData, setTreeData] = React.useState<EmployeeNode[]>([]);
  const [users, setUsers] = React.useState<DataUser[]>([]);

  const transformData = (data: any[], funcFun: HierarchyData[]) => {
    const mdMap = new Map<string, EmployeeNode>();
    const fmMap = new Map<string, EmployeeNode>();
    const dmMap = new Map<string, EmployeeNode>();
    const smMap = new Map<string, EmployeeNode>();

    data.forEach(({ MD, FM, DM, SM, ST }: any) => {
      if (!mdMap.has(MD)) {
        mdMap.set(MD, {
          id: MD,
          funcCode: null,
          funcName: null,
          depCode: null,
          depName: null,
          secCode: null,
          secName: null,
          code:
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              กรรมการผู้จัดการ [MD]
            </Typography>
          ,
          label: `กรรมการผู้จัดการ [MD]`,
          position: `MD`,
          usercode: MD,
          editable: true,
          children: []
        });
      }
      const mdNode = mdMap.get(MD)!;

      if (FM && !fmMap.has(FM)) {
        const fmNode = {
          id: `${MD}_${FM}`,
          funcCode: funcFun.find((res) => res.OwnerCode === FM)?.FuncCode ?? null,
          funcName: funcFun.find((res) => res.OwnerCode === FM)?.FuncName ?? null,
          depCode: null,
          depName: null,
          secCode: null,
          secName: null,
          label: `
          [FM] ${funcFun.find((res) => res.OwnerCode === FM)?.FuncName} [${funcFun.find((res) => res.OwnerCode === FM)?.FuncCode}]
          `,
          position: `FM`,
          usercode: FM,
          editable: true,
          children: []
        };
        fmMap.set(FM, fmNode);
        mdNode.children?.push(fmNode);
      }
      const fmNode = fmMap.get(FM)!;

      if (DM && !dmMap.has(DM)) {
        const dmNode = {
          id: `${FM}_${DM}`,
          funcCode: funcFun.find((res) => res.OwnerCode === DM)?.FuncCode ?? null,
          funcName: funcFun.find((res) => res.OwnerCode === DM)?.FuncName ?? null,
          depCode: funcFun.find((res) => res.OwnerCode === DM)?.DepCode ?? null,
          depName: funcFun.find((res) => res.OwnerCode === DM)?.name ?? null,
          secCode: null,
          secName: null,
          label: `
          [DM] ${funcFun.find((res) => res.OwnerCode === DM)?.name} [${funcFun.find((res) => res.OwnerCode === DM)?.DepCode}]
          `,
          position: `DM`,
          usercode: DM,
          editable: true,
          children: []
        };
        dmMap.set(DM, dmNode);
        fmNode.children?.push(dmNode);
      }
      const dmNode = dmMap.get(DM)!;

      if (SM && !smMap.has(SM)) {
        const smNode = {
          id: `${DM}_${SM}`,
          funcCode: funcFun.find((res) => res.OwnerCode === SM)?.FuncCode ?? null,
          funcName: funcFun.find((res) => res.OwnerCode === SM)?.FuncName ?? null,
          depCode: funcFun.find((res) => res.OwnerCode === SM)?.DepCode ?? null,
          depName: funcFun.find((res) => res.OwnerCode === SM)?.name ?? null,
          secCode: funcFun.find((res) => res.OwnerCode === SM)?.SecCode ?? null,
          secName: funcFun.find((res) => res.OwnerCode === SM)?.SecName ?? null,
          label: `
          [SM] ${funcFun.find((res) => res.OwnerCode === SM)?.SecName} [${funcFun.find((res) => res.OwnerCode === SM)?.SecCode}]
          `,
          position: `SM`,
          usercode: SM,
          editable: true,
          children: []
        };
        smMap.set(SM, smNode);
        dmNode.children?.push(smNode);
      }
      const smNode = smMap.get(SM)!;

      if (ST) {
        smNode.children?.push({
          funcCode: funcFun.find((res) => res.OwnerCode === ST)?.FuncCode ?? null,
          funcName: funcFun.find((res) => res.OwnerCode === ST)?.FuncName ?? null,
          depCode: funcFun.find((res) => res.OwnerCode === ST)?.DepCode ?? null,
          depName: funcFun.find((res) => res.OwnerCode === ST)?.name ?? null,
          secCode: funcFun.find((res) => res.OwnerCode === ST)?.SecCode ?? null,
          secName: funcFun.find((res) => res.OwnerCode === ST)?.SecName ?? null,
          id: `${SM}_${ST}`,
          label: `[${users.find(res => res.UserCode === ST)?.PositionCode}]`,
          position: `ST`,
          usercode: ST,
          editable: true,
        });
      }
    });
    return Array.from(mdMap.values());
  };



  const fetchDataUsers = async () => {
    try {
      // ดึงข้อมูล users ทั้งหมด
      const userResponse = await client.get('/User_List', { headers: dataConfig().header });
      if (userResponse.status === 200) {
        setUsers(userResponse.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchDataPosition = async () => {
    try {
      // ดึงข้อมูลแผนก
      const departmentResponse = await client.get('/Organization_List', { headers: dataConfig().header });
      if (!departmentResponse.data) return;

      // ดึงข้อมูลตำแหน่ง
      const positionResponse = await client.get('/User_List_ByPosition', { headers: dataConfig().header });
      if (!positionResponse.data) return;

      // แปลงข้อมูลและอัปเดต state
      const transformedData = transformData(positionResponse.data, departmentResponse.data);
      setTreeData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (users.length === 0) {
    fetchDataUsers();
  }

  if (users.length > 0) {
    fetchDataPosition();
  }


  // React.useEffect(() => {
  //   fetchDataUsers();
  // }, [])

  return (
    <React.Fragment>
      <Card
        variant='outlined'
        sx={{
          width: '100vw',
          maxWidth: '100vw', // จำกัดความกว้างให้พอดีกับหน้าจอ
        }}
      >
        <CardHeader
          subheader={
            <React.Fragment>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: '15px',
                  maxHeight: '15px'
                }}
              >
              </Stack>
            </React.Fragment>
          }
        />
        <Divider />
        <CardContent sx={{ width: '100%' }}>
          {/* {(users.length === 0 || treeData.length === 0) ? 'Loading...' : (
            <RichTreeView
              slots={{ item: CustomTreeItem2 }}
              experimentalFeatures={{ labelEditing: true }}
              getItemLabel={(item) => `${item.usercode} ${item.label}`}
              isItemEditable
              items={treeData}
            />
          )} */}
          <Stack
            spacing={2}
            useFlexGap
            sx={{
              flexWrap: 'wrap',
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {treeData.map((resMD) => (
              <React.Fragment>
                <Stack sx={{ border: '1px solid', p: 1 }}>
                  <Chip avatar={<Avatar>{resMD.position}</Avatar>} label={resMD.usercode} variant="outlined" />
                </Stack>
                <Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    useFlexGap
                    sx={{
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: 'wrap'
                    }}
                  >
                    {resMD.children?.map((resFM) => (
                      <Stack
                        spacing={2}
                        useFlexGap
                        sx={{
                          flexWrap: 'wrap',
                          justifyContent: "center",
                          alignItems: "center",
                          border: '1px solid', p: 1
                        }}
                      >
                        <Stack>
                          <Chip avatar={<Avatar>{resFM.position}</Avatar>} label={resFM.usercode} variant="outlined" />
                        </Stack>
                        <Stack>
                          <Stack
                            direction="row"
                            spacing={2}
                            useFlexGap
                            sx={{
                              justifyContent: "center",
                              alignItems: "center",
                              flexWrap: 'wrap'
                            }}
                          >
                            {resFM.children?.map((resDM) => (
                              <Stack>
                                <Chip avatar={<Avatar>{resDM.position}</Avatar>} label={resDM.usercode} variant="outlined" />
                              </Stack>
                            ))}
                          </Stack>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </React.Fragment>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </React.Fragment >
  );
}