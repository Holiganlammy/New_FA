import * as React from 'react';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import Swal from 'sweetalert2';
import dataConfig from '../../../config';
import { RequestCreateDocument, FAControlCreateDetail, WorkflowApproval } from '../../../type/nacType';
import BackspaceIcon from '@mui/icons-material/Backspace';
import UpdateIcon from '@mui/icons-material/Update';
import dayjs from 'dayjs';
import { Box, CircularProgress } from '@mui/material';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th'
import { useNavigate } from 'react-router-dom';
import client from '../../../lib/axios/interceptor';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Bangkok');

interface DataFromHeader {
  createDoc: RequestCreateDocument[],
  setOpenBackdrop: React.Dispatch<React.SetStateAction<boolean>>,
  detailNAC: FAControlCreateDetail[],
  idSection: number | null | undefined,
  workflowApproval: WorkflowApproval[]
  setCreateDoc: React.Dispatch<React.SetStateAction<RequestCreateDocument[]>>,
}

export default function ButtonStates({ createDoc, setOpenBackdrop, detailNAC, idSection, workflowApproval, setCreateDoc }: DataFromHeader) {
  const navigate = useNavigate();
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const permission = localStorage.getItem('permission_MenuID');
  const parsedPermission = permission ? JSON.parse(permission) : null;
  const checkAt = workflowApproval.find(res => (res.approverid || "") === (parsedData.UserCode || ""))
  const [hideBT, setHideBT] = React.useState<boolean>(false)
  const [currentApprover, setCurrentApprover] = React.useState<string | null>(null);

  const validateFieldsAsset = (dtl: FAControlCreateDetail, nac_type: number, status: number) => {
    // Check if any of the required fields are missing
    const missingFields = [];
    if (!dtl.nacdtl_assetsCode) missingFields.push('รหัสทรัพย์สิน');
    if (!dtl.nacdtl_image_1 && [1, 2].includes(nac_type) && status > 3) missingFields.push('รูปภาพที่ 1');
    if (!dtl.nacdtl_image_2 && [1].includes(nac_type) && status > 3) missingFields.push('รูปภาพที่ 2');
    if (!dtl.nacdtl_image_1 && [4, 5].includes(nac_type)) missingFields.push('รูปภาพที่ 1');
    // if (!dtl.nacdtl_image_2 && [4, 5].includes(nac_type)) missingFields.push('รูปภาพที่ 2');
    if ((dtl.nacdtl_PriceSeals === undefined || dtl.nacdtl_PriceSeals === null) && [4, 5].includes(idSection ?? 0)) missingFields.push('ราคาขาย');
    return missingFields;
  };

  const validateFieldsCode = (dtl: FAControlCreateDetail) => {
    // Check if any of the required fields are missing
    const FieldsCode = [];
    if (['SF', 'BP'].includes(dtl.nacdtl_assetsCode?.substring(0, 2) ?? '')) FieldsCode.push(1);
    if (!['SF', 'BP'].includes(dtl.nacdtl_assetsCode?.substring(0, 2) ?? '')) FieldsCode.push(0);
    return FieldsCode;
  };

const validateFields = (doc: RequestCreateDocument) => {
    const missingFields = [];
    if (!doc.source_usercode) missingFields.push('ผู้ส่งมอบ');
    if (!doc.sourceFristName) missingFields.push('ชื่อผู้ส่งมอบ');
    if (!doc.sourceLastName) missingFields.push('นามสกุลผู้ส่งมอบ');
    if (!doc.des_usercode && [1, 2].includes(idSection ?? 0)) missingFields.push('ผู้รับมอบ');

    // // เพิ่มการตรวจสอบ real_price สำหรับสถานะ 12
    // if ([12].includes(doc.nac_status ?? 0) && 
    //     (doc.real_price === null || doc.real_price === undefined)) {
    //   missingFields.push('ราคาขายจริงและวันที่ได้รับเงิน');
    // }

    return missingFields;
};

  // ฟังก์ชันแยกสำหรับ update asset 
  const updateAssetOwnership = async (nac_code: string) => {
    try {
      console.log('Starting asset ownership update for nac_code:', nac_code);
      
      const updatePromises = detailNAC.map(item => 
        client.post(
          `/store_FA_control_upadate_table`,
          {
            nac_code: nac_code,
            usercode: parsedData.UserCode,
            nacdtl_assetsCode: item.nacdtl_assetsCode,
            nac_type: createDoc[0].nac_type,
            nac_status: 6
          },
          { headers: dataConfig().header }
        )
      );

      await Promise.all(updatePromises);
      console.log('Asset ownership update completed successfully');
      
      return true;
    } catch (error) {
      console.error("Error updating asset ownership:", error);
      throw error;
    }
  };

  const getCurrentApprover = async (nac_code: string) => {
    try {
      const response = await client.get('/FA_Control_Get_Current_Approver', {
        params: { nac_code },
        headers: dataConfig().header,
      });
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'ไม่พบข้อมูลผู้อนุมัติ');
      }
    } catch (error: any) {
      console.error('❌ Error fetching current approver:', error);
      throw error;
    }
  };

  React.useEffect(() => {
    const fetchApprover = async () => {
      if (createDoc[0]?.nac_code) {
        try {
          const res = await getCurrentApprover(createDoc[0].nac_code);
          console.log('✅ Current Approver from API:', res);

          if (Array.isArray(res) && res.length > 0) {
            setCurrentApprover(res[0].userid_approver);
          } else if (res?.userid_approver) {
            setCurrentApprover(res.userid_approver);
          } else {
            setCurrentApprover(null);
          }
        } catch (err) {
          console.error('Error fetching approver:', err);
          setCurrentApprover(null);
        }
      }
    };
    fetchApprover();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createDoc[0]?.nac_code]);

  const submitDoc = async (shouldUpdateAssets = false) => {
    try {
      // รวม FA และ SI ให้เป็นประเภทเดียวกัน
      const uniquePrefixes = Array.from(
        new Set(
          detailNAC
            .map(item => {
              const prefix = (item.nacdtl_assetsCode ?? "").substring(0, 2);
              return ["FA", "SI"].includes(prefix) ? "FA" : prefix;
            })
            .filter(Boolean)
        )
      );

      if (uniquePrefixes.length > 1) {
        return Swal.fire({
          icon: "warning",
          title: `พบรายการทรัพย์สินที่มีประเภทไม่ตรงกัน [${uniquePrefixes}]`,
          showConfirmButton: false,
          timer: 1500
        });
      }

      // ตรวจสอบค่าว่าง
      const missingFields = validateFields(createDoc[0]);
      if (missingFields.length > 0) {
        return Swal.fire({
          icon: "warning",
          title: `กรุณาระบุข้อมูล ${missingFields.join(", ")} ให้ครบ`,
          showConfirmButton: false,
          timer: 1500
        });
      }

      setHideBT(true);
      setOpenBackdrop(true);

      // ส่งข้อมูล Header
      const header = {
        ...createDoc[0],
        nac_status: createDoc[0].nac_status ? createDoc[0].nac_status : 1,
        usercode: parsedData.UserCode
      };

      const res = await client.post(
        `/FA_Control_Create_Document_NAC`,
        header,
        { headers: dataConfig().header }
      );

      console.log('Header response:', res);

      if (res.status === 200) {
        const nac_code = res.data[0].nac_code;
        
        // ส่งข้อมูล detail
        await sendDataToAPI(nac_code, shouldUpdateAssets);
      }
    } catch (error) {
      console.error("Error in submitDoc:", error);
      setOpenBackdrop(false);
      setHideBT(false);
      Swal.fire({
        icon: "error",
        title: `Error sending data to API: ${error}`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const checkWorkflow = async (workflowApproval: WorkflowApproval[], sumPrice: number) => {
    const textCode = validateFieldsCode(detailNAC[0])
        
    const sortedWorkflow = workflowApproval
      .filter(wf => wf.workflowlevel !== null && wf.workflowlevel !== undefined)
      .sort((a, b) => (Number(a.workflowlevel) || 0) - (Number(b.workflowlevel) || 0));

    // ระดับสูงสุดที่ "อนุมัติแล้ว"
    const maxApprovedLevel = Math.max(
      0,
      ...sortedWorkflow
        .filter(wf => wf.status === 1)
        .map(wf => Number(wf.workflowlevel) || 0)
    );

    // คนปัจจุบันใน workflow (ถ้า user นี้เป็นผู้อนุมัติขั้นนี้จริง)
    const currentActor = sortedWorkflow.find(wf => (wf.approverid || "") === (parsedData.UserCode || ""));

    // baseline = ถ้ามี currentActor (และเขายังไม่อนุมัติ) ให้ใช่ level ของเขา
    //           ไม่งั้นใช้ maxApprovedLevel
    const baselineLevel = currentActor
      ? (Number(currentActor.workflowlevel) || 0)
      : maxApprovedLevel;

    // คนถัดไปจริง ๆ คือต้อง "ระดับมากกว่า baseline เท่านั้น" และยัง pending
    const nextApprover = sortedWorkflow
      .filter(wf => wf.status === 0 && (Number(wf.workflowlevel) || 0) > baselineLevel)
      .sort((a, b) => (Number(a.workflowlevel) || 0) - (Number(b.workflowlevel) || 0))[0] || null;
    
    const hasLevelZero = workflowApproval.some((item) => item.workflowlevel === 0);

    // Validate each item
    for (const item of detailNAC) {
      const missingFields = validateFieldsAsset(item, createDoc[0].nac_type ?? 0, createDoc[0].nac_status ?? 0);
      if (missingFields.length > 0) {
        setOpenBackdrop(false)
        setHideBT(false);
        Swal.fire({
          icon: "warning",
          title: `กรุณาระบุข้อมูล ${missingFields.join(', ')} ให้ครบ`,
          showConfirmButton: false,
          timer: 1500
        })
        return;
      }
    }

    if ((textCode[0] ?? '') === 0) {
      if ([1, 2, 3].includes(createDoc[0].nac_type ?? 0)) {
        if ([1].includes(createDoc[0].nac_status ?? 0) && [2, 3].includes(createDoc[0].nac_type ?? 0)) {
          const header = [...createDoc]
          // ถ้ามี workflow (มีคนต้องอนุมัติ) ให้เริ่มที่ status 2 (รอตรวจสอบ)
          const workflow = workflowApproval.filter(res => (res.limitamount ?? 0) < (createDoc[0].sum_price ?? 0) && res.workflowlevel !== 0)
          header[0].nac_status = workflow.length > 0 ? 2 : 3
          setCreateDoc(header)
          await submitDoc()
         console.log(1)
        } else if ([1].includes(createDoc[0].nac_status ?? 0) && [1].includes(createDoc[0].nac_type ?? 0)) {
          const header = [...createDoc]
          header[0].nac_status = 4
          setCreateDoc(header)
          await submitDoc()
         console.log(2)
        } else if ([2].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].verify_by_userid = parseInt(parsedData.userid)
          header[0].verify_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 3; // ถึงตรงนี้
          const currentLevel = checkAt?.workflowlevel ?? 0;
          // หาคนถัดไปที่ยัง pending และ level สูงกว่าคนปัจจุบัน
          const actualNextApprover = sortedWorkflow
            .filter(wf => wf.status === 0 && (Number(wf.workflowlevel) || 0) > currentLevel)
            .sort((a, b) => (Number(a.workflowlevel) || 0) - (Number(b.workflowlevel) || 0))[0] || null;
          
          // ตรวจสอบว่า Level 1 และ 2 อนุมัติครบหรือยัง
          const level1Approved = sortedWorkflow.find(wf => wf.workflowlevel === 1)?.status === 1;
          const level2Approved = sortedWorkflow.find(wf => wf.workflowlevel === 2)?.status === 1;
          const requiredLevelsApproved = level1Approved && level2Approved;
          const checkerlist = workflowApproval.filter(res => (res.limitamount ?? 0) < (createDoc[0].sum_price ?? 0) && res.workflowlevel !== 0);

          if (parsedPermission.includes(10)) {
            // Admin ผ่านได้เลย
            header[0].nac_status = 3;
          } else if (requiredLevelsApproved) {
            // Level 1 และ 2 อนุมัติครบแล้ว → เปลี่ยนเป็นสถานะ 3
            header[0].nac_status = 3;
          }else if (checkerlist.length <= 1) {
            header[0].nac_status = 3;
          } else if (actualNextApprover && (actualNextApprover.workflowlevel ?? 0) <= 2) {
            // ยังมีผู้อนุมัติ Level 1-2 ที่ยัง pending
            header[0].nac_status = 2;
          } else {
            // กรณีอื่นๆ (ไม่ควรเกิด)
            header[0].nac_status = 3;
          }
          await submitDoc()
          console.log(3)
        } else if ([3].includes(createDoc[0].nac_status ?? 0) && [2].includes(createDoc[0].nac_type ?? 0)) {
          const header = [...createDoc]
          header[0].source_approve_userid = parseInt(parsedData.userid)
          header[0].source_approve_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 4
          setCreateDoc(header)
          await submitDoc()
          console.log(4)
        } else if ([3].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].source_approve_userid = parseInt(parsedData.userid)
          header[0].source_approve_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 5
          setCreateDoc(header)
          await submitDoc()
          console.log(5)
        } else if ([4].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].nac_status = 5
          setCreateDoc(header)
          await submitDoc()
          console.log(6)
        } else if ([5].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].account_aprrove_id = parseInt(parsedData.userid)
          header[0].account_aprrove_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 6
          setCreateDoc(header)
          await submitDoc(true)
          console.log(7)
        }
      } else if ([4, 5].includes(createDoc[0].nac_type ?? 0)) {
        if (hasLevelZero && [1].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].nac_status = 11
          setCreateDoc(header)
          await submitDoc()
         console.log(8)
        } else if ([11].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].nac_status = sortedWorkflow.length > 0 ? 2 : 3
          setCreateDoc(header)
          await submitDoc()
          console.log(9)
        } else if ([2].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc];
          header[0].verify_by_userid = parseInt(parsedData.userid);
          header[0].verify_date = dayjs.tz(new Date(), "Asia/Bangkok");

          const currentLevel = checkAt?.workflowlevel ?? 0;
          // หาคนถัดไปที่ยัง pending และ level สูงกว่าคนปัจจุบัน
          const actualNextApprover = sortedWorkflow
            .filter(wf => wf.status === 0 && (Number(wf.workflowlevel) || 0) > currentLevel)
            .sort((a, b) => (Number(a.workflowlevel) || 0) - (Number(b.workflowlevel) || 0))[0] || null;
          
          // ตรวจสอบว่า Level 1 และ 2 อนุมัติครบหรือยัง
          const level1Approved = sortedWorkflow.find(wf => wf.workflowlevel === 1)?.status === 1;
          const level2Approved = sortedWorkflow.find(wf => wf.workflowlevel === 2)?.status === 1;
          const requiredLevelsApproved = level1Approved && level2Approved;
          
          console.log('➡️ Next approver:', actualNextApprover?.approverid, 'level:', actualNextApprover?.workflowlevel);
          console.log('📊 Level 1 approved:', level1Approved, 'Level 2 approved:', level2Approved);

          if (parsedPermission.includes(10)) {
            // Admin ผ่านได้เลย
            header[0].nac_status = 3;
            console.log('Admin bypass → set status = 3');
          } else if (requiredLevelsApproved) {
            // Level 1 และ 2 อนุมัติครบแล้ว → เปลี่ยนเป็นสถานะ 3
            header[0].nac_status = 3;
            console.log('Level 1 & 2 approved → set status = 3');
          } else if (actualNextApprover && (actualNextApprover.workflowlevel ?? 0) <= 2) {
            // ยังมีผู้อนุมัติ Level 1-2 ที่ยัง pending
            header[0].nac_status = 2;
            console.log(`Waiting for level ${actualNextApprover.workflowlevel} to approve`);
          } else {
            // กรณีอื่นๆ (ไม่ควรเกิด)
            header[0].nac_status = 3;
            console.log('Fallback → set status = 3');
          }

          setCreateDoc(header);
          await submitDoc();
          console.log('✅ Status updated correctly');
          console.log(10)
        }else if ([3].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].source_approve_userid = parseInt(parsedData.userid)
          header[0].source_approve_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = (typeof createDoc[0].real_price === 'number' || [4].includes(createDoc[0].nac_type ?? 0)) ? 13 : 12
         setCreateDoc(header)
         await submitDoc()
          console.log(11)
        } else if ([12].includes(createDoc[0].nac_status ?? 0)) {
          if (createDoc[0].real_price === null || createDoc[0].real_price === undefined) {
            setOpenBackdrop(false);
            setHideBT(false);
            Swal.fire({
              icon: "warning",
              title: `กรุณาระบุราคาขายจริงและวันที่ได้รับเงิน`,
              showConfirmButton: false,
              timer: 3000
            });
            return;
          }
          
          const totalPriceSeals = detailNAC.reduce((sum, item) => {
            return item.nacdtl_PriceSeals ? sum + item.nacdtl_PriceSeals : sum;
          }, 0);
          const realPrice = createDoc[0].real_price ?? 0;
          const header = [...createDoc]
          header[0].source_approve_userid = (realPrice) < totalPriceSeals ? null : (createDoc[0].source_approve_userid ?? null)
          header[0].source_approve_date = (realPrice) < totalPriceSeals ? null : (createDoc[0].source_approve_date ?? null)
          
          if (realPrice === 0) {
            header[0].nac_status = 5;
            header[0].nac_type = 4
          } else if (realPrice < totalPriceSeals) {
            header[0].nac_status = 3;
          } else {
            header[0].nac_status = 15;
          }
          setCreateDoc(header)
          await submitDoc()
          console.log(12)
        } else if ([5].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].account_aprrove_id = parseInt(parsedData.userid)
          header[0].account_aprrove_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 6
          setCreateDoc(header)
          await submitDoc(true)
          console.log(13)
        } else if ([15].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].account_aprrove_id = parseInt(parsedData.userid)
          header[0].account_aprrove_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 13
          setCreateDoc(header)
          await submitDoc()
          console.log(14)
        } else if ([13].includes(createDoc[0].nac_status ?? 0)) {
          const header = [...createDoc]
          header[0].finance_aprrove_id = parseInt(parsedData.userid)
          header[0].finance_aprrove_date = dayjs.tz(new Date(), "Asia/Bangkok")
          header[0].nac_status = 6
          setCreateDoc(header)
          await submitDoc(true)
          console.log(15)
        }
      }
    } else if ((textCode[0] ?? '') === 1) {
      if ([1].includes(createDoc[0].nac_status ?? 0)) {
        const header = [...createDoc]
        header[0].nac_status = sortedWorkflow.length > 0 ? 2 : 3
        setCreateDoc(header)
        await submitDoc()
        console.log(16)
      } else if ([2].includes(createDoc[0].nac_status ?? 0)) {
        const header = [...createDoc]
        header[0].verify_by_userid = parseInt(parsedData.userid)
        header[0].verify_date = dayjs.tz(new Date(), "Asia/Bangkok")
        
        if (parsedPermission.includes(10)) {
          header[0].nac_status = 3;
        } else if (nextApprover && (nextApprover.workflowlevel ?? 0) < 3) {
          header[0].nac_status = 2;
        } else {
          header[0].nac_status = 3;
        }
        
        setCreateDoc(header)
        await submitDoc()
        console.log(17)
      } else if ([3].includes(createDoc[0].nac_status ?? 0)) {
        const header = [...createDoc]
        header[0].source_approve_userid = parseInt(parsedData.userid)
        header[0].source_approve_date = dayjs.tz(new Date(), "Asia/Bangkok")
        header[0].nac_status = 18
        setCreateDoc(header)
        await submitDoc()
        console.log(18)
      } else if ([18].includes(createDoc[0].nac_status ?? 0)) {
        const header = [...createDoc]
        header[0].nac_status = 5
        setCreateDoc(header)
        await submitDoc()
        console.log(19)
      } else if ([5].includes(createDoc[0].nac_status ?? 0)) {
        const header = [...createDoc]
        header[0].finance_aprrove_id = parseInt(parsedData.userid)
        header[0].finance_aprrove_date = dayjs.tz(new Date(), "Asia/Bangkok")
        header[0].nac_status = 6
        setCreateDoc(header)
        await submitDoc(true)
        console.log(20)
      }
    }
  };

  const redo = async () => {
    Swal.fire({
      title: "กรุณาระบุเหตุผลสำหรับ Redo!",
      input: "text",
      inputAttributes: {
        autocapitalize: "off"
      },
      showCancelButton: true,
      confirmButtonText: "Yes",
      showLoaderOnConfirm: true,
      preConfirm: async (body) => {
        const response = await client.post(
          '/store_FA_control_comment',
          {
            nac_code: createDoc[0].nac_code,
            usercode: parsedData.UserCode,
            comment: body,
          },
          { headers: dataConfig().header }
        );
        if (response.status === 200) {
          const header = [...createDoc]
          header[0].nac_status = 1
          setCreateDoc(header)
          await submitDoc()
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: `บันทึกข้อมูลสำเร็จ`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          navigate(`/NAC_CREATE?id=${idSection}?nac_code=${createDoc[0].nac_code}`)
        })
      }
    });
  }

  const cancelDoc = async () => {
    Swal.fire({
      title: "กรุณาระบุเหตุผลสำหรับ Rejected!",
      input: "text",
      inputAttributes: {
        autocapitalize: "off"
      },
      showCancelButton: true,
      confirmButtonText: "Yes",
      showLoaderOnConfirm: true,
      preConfirm: async (body) => {
        const response = await client.post(
          '/store_FA_control_comment',
          {
            nac_code: createDoc[0].nac_code,
            usercode: parsedData.UserCode,
            comment: body,
          },
          { headers: dataConfig().header }
        );
        if (response.status === 200) {
          const header = [...createDoc]
          header[0].nac_status = 17
         setCreateDoc(header)
         await submitDoc()
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: `บันทึกข้อมูลสำเร็จ`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          navigate(`/NAC_CREATE?id=${idSection}?nac_code=${createDoc[0].nac_code}`)
        })
      }
    });
  }

  const sendDataToAPI = async (nac_code: string | null | undefined, shouldUpdateAssets = false) => {
    setHideBT(true)
    try {
      // Mapping through each detailNAC item
      const requestData = detailNAC.map((detail, index) => ({
        usercode: parsedData.UserCode,
        nac_code: nac_code,
        nacdtl_row: index,
        nacdtl_assetsCode: detail.nacdtl_assetsCode ?? null,
        OwnerCode: detail.OwnerCode ?? null,
        nacdtl_assetsName: detail.nacdtl_assetsName ?? null,
        nacdtl_assetsSeria: detail.nacdtl_assetsSeria ?? null,
        nacdtl_assetsDtl: detail.nacdtl_assetsDtl ?? null,
        create_date: detail.create_date ?? null,
        nacdtl_bookV: detail.nacdtl_bookV ?? null,
        nacdtl_PriceSeals: detail.nacdtl_PriceSeals ?? null,
        nacdtl_profit: detail.nacdtl_profit ?? null,
        nacdtl_image_1: detail.nacdtl_image_1 ?? null,
        nacdtl_image_2: detail.nacdtl_image_2 ?? null,
      }));

      for (let i = 0; i < requestData.length; i++) {
        const response = await client.post('/FA_Control_Create_Detail_NAC', requestData[i], { headers: dataConfig().header });
        
        if (response.status === 200 && (response.data[0].count_nac === requestData.length)) {
          // ส่งเมล์
          await client.post('/store_FA_SendMail', { nac_code: nac_code }, { headers: dataConfig().header });
          
          if (shouldUpdateAssets && nac_code) {
            try {
              await updateAssetOwnership(nac_code);
              console.log('Asset ownership updated successfully');
            } catch (updateError) {
              console.error('Failed to update asset ownership:', updateError);
              Swal.fire({
                icon: "warning",
                title: "บันทึกเอกสารสำเร็จ แต่ไม่สามารถอัพเดตผู้ถือครองทรัพย์สินได้",
                text: "กรุณาติดต่อผู้ดูแลระบบ",
                showConfirmButton: true,
              });
            }
          }
          
          setOpenBackdrop(false);
          setHideBT(false);
          
          Swal.fire({
            icon: "success",
            title: `บันทึกข้อมูลสำเร็จ`,
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            navigate(`/NAC_CREATE?id=${idSection}?nac_code=${response.data[0].nac_code}`)
          })
          
          break; 
        }
      }
    } catch (error: unknown) {
      setOpenBackdrop(false);
      setHideBT(false)
      Swal.fire({
        icon: "error",
        title: `Error sending data to API: ${error}`,
        showConfirmButton: false,
        timer: 1500
      })
    }
  };

  if (!hideBT) {
    return (
      <Stack direction="row" spacing={2} sx={{ py: 2 }}>
        {
          (([1, 4, 11, 12, 14].includes(createDoc[0].nac_status ?? 0) || parsedPermission.includes(10)) && createDoc[0].nac_code) &&
          <Button variant="contained" color="warning" endIcon={<UpdateIcon />} onClick={() => submitDoc()}>UPDATE</Button>
        }
        {
          (checkAt || parsedPermission.includes(16)) && createDoc[0].nac_code && createDoc[0].nac_status !== 1 &&
          <Button variant="contained" color="secondary" onClick={redo} endIcon={<BackspaceIcon />}>REDO</Button>
        }
        {![6].includes(createDoc[0].nac_status ?? 0) &&
          <>
            {!createDoc[0].nac_code &&
              <Button variant="contained" endIcon={<SendIcon />} onClick={() => submitDoc()}>SUBMIT</Button>}
            {
              (([11].includes(createDoc[0].nac_status ?? 0) && checkAt) ||
                (createDoc[0].nac_code && [11, 12, 16].some((val) => parsedPermission.includes(val)) && [11, 13, 15, 5, 18, 19].includes(createDoc[0].nac_status ?? 0)) ||
                [1, 12, 4].includes(createDoc[0].nac_status ?? 0)) &&
              <Button variant="contained" endIcon={<SendIcon />} onClick={() => checkWorkflow(workflowApproval, createDoc[0].sum_price ?? 0)}>SUBMIT</Button>
            }
            {([2, 3].includes(createDoc[0].nac_status ?? 0)) &&
              <>
                {
                  ((checkAt && currentApprover === checkAt.name) || parsedPermission.includes(10)) && (
                    <Button
                      variant="contained"
                      color="success"
                      endIcon={<SendIcon />}
                      onClick={async () => {
                        await checkWorkflow(workflowApproval, createDoc[0].sum_price ?? 0);
                        if (createDoc[0]?.nac_code) {
                          const res = await getCurrentApprover(createDoc[0].nac_code);
                          if (Array.isArray(res) && res.length > 0) {
                            setCurrentApprover(res[0].userid_approver);
                          } else if (res?.userid_approver) {
                            setCurrentApprover(res.userid_approver);
                          } else {
                            setCurrentApprover(null);
                          }
                        }
                      }}
                    >
                      APPROVED
                    </Button>
                  )
                }
                {
                  ((checkAt && currentApprover === checkAt.name) || parsedPermission.includes(10)) && (
                    <Button
                      variant="contained"
                      color="error"
                      endIcon={<DeleteIcon />}
                      onClick={async () => {
                        await cancelDoc();
                        if (createDoc[0]?.nac_code) {
                          const res = await getCurrentApprover(createDoc[0].nac_code);
                          if (Array.isArray(res) && res.length > 0) {
                            setCurrentApprover(res[0].userid_approver);
                          } else if (res?.userid_approver) {
                            setCurrentApprover(res.userid_approver);
                          } else {
                            setCurrentApprover(null);
                          }
                        }
                      }}
                    >
                      REJECTED
                    </Button>
                  )
                }
              </>
            }
          </>
        }
      </Stack>
    );
  } else {
    return (
      <Stack direction="row" spacing={2} sx={{ py: 2 }}>
        <Box component="main">
          <CircularProgress disableShrink />
        </Box>
      </Stack>
    );
  }
}