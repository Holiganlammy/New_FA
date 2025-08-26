import React, { useState } from 'react';
import { CardMedia, ImageListItem } from '@mui/material';
import dataConfig from '../../../../config';
import { CountAssetRow, UpdateDtlAssetParams } from '../../../../type/nacType';
import Swal from 'sweetalert2';
import client from '../../../../lib/axios/interceptor';

export interface Data {
  imagePath: string;
  name: string;
  rows: CountAssetRow[];
  originalRows: CountAssetRow[];
  index: number;
  fieldData: string;
  setRows: React.Dispatch<React.SetStateAction<CountAssetRow[]>>;
  setOriginalRows: React.Dispatch<React.SetStateAction<CountAssetRow[]>>;
  fetchData: () => void
}

const convertToJPG = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const jpgFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve(jpgFile);
            } else {
              reject(new Error("Failed to convert image to JPG"));
            }
          },
          "image/jpeg",
          0.9 // คุณภาพของ JPG (0.9 = 90%)
        );
      };
    };

    reader.onerror = (error) => reject(error);
  });
};

// Create a separate component for rendering the image cell
const ImageCell = ({ imagePath, name, rows, setRows, index, fieldData, originalRows, setOriginalRows, fetchData }: Data) => {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [imageData, setImageData] = React.useState<string>(imagePath);


  const handleUploadFile = async (indexCode: number) => {
    const choice = window.confirm("คุณต้องการถ่ายรูปจากกล้องหรืออัปโหลดจากอุปกรณ์?\n\nกด 'ตกลง' เพื่อถ่ายรูป หรือ 'ยกเลิก' เพื่ออัปโหลด");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    if (choice) {
      fileInput.capture = "camera"; // เปิดกล้องถ่ายรูป
    }

    fileInput.onchange = async (e: any) => {
      let file = e.target.files[0];
      if (!file) return;

      try {
        file = await convertToJPG(file); // แปลงเป็น JPG
        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        const responseFile = await client.post(
          `/check_files_NewNAC`,
          formData_1,
          { headers: dataConfig().header }
        );

        console.log("Upload file response:", responseFile);

        if (responseFile.status === 200 && responseFile.data.attach?.[0]?.ATT) {
          const selectedImageRes = `${dataConfig().httpViewFile}/NEW_NAC/${responseFile.data.attach[0].ATT}.jpg`;

          // อัปเดตข้อมูลภาพ
          const indexOriginalRows = originalRows.findIndex((row) => row.Code === rows[indexCode].Code);
          const list = [...rows];
          const listOriginalRows = [...originalRows];

          if (fieldData === 'ImagePath') {
            list[indexCode].ImagePath = selectedImageRes;
            listOriginalRows[indexOriginalRows].ImagePath = selectedImageRes;
          } else if (fieldData === 'ImagePath_2') {
            list[indexCode].ImagePath_2 = selectedImageRes;
            listOriginalRows[indexOriginalRows].ImagePath_2 = selectedImageRes;
          }

          const payload = {
            Code: list[indexCode].Code ?? '',
            RoundID: list[indexCode].RoundID ?? '',
            index: fieldData === 'ImagePath' ? 0 : 1,
            url: selectedImageRes ?? '',
          };

          console.log("Sending to FA_Mobile_UploadImage:", payload);

          try {
            const response = await client.post(
              `/FA_Mobile_UploadImage`,
              payload,
              { headers: dataConfig().header }
            );
            if (response.status === 200) {
              fetchData();
              setImageData(selectedImageRes);
              setRows(list);
              setOriginalRows(listOriginalRows);
            } else {
              console.error("Unexpected status:", response.status);
              Swal.fire({
                icon: "warning",
                title: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล (Status: " + response.status + ")",
                showConfirmButton: false,
                timer: 1500
              })
            }
          } catch (err) {
            console.error("Error in FA_Mobile_UploadImage:", err);
            Swal.fire({
              icon: "warning",
              title: "เกิดข้อผิดพลาดในการบันทึกข้อมูลรูปภาพ",
              showConfirmButton: false,
              timer: 1500
            })
          }
        } else {
          console.error("Invalid response or missing ATT:", responseFile.data);
          Swal.fire({
            icon: "warning",
            title: "ไม่สามารถอัปโหลดรูปภาพได้",
            showConfirmButton: false,
            timer: 1500
          })
        }
      } catch (error) {
        console.error("Error converting/uploading file:", error);
        Swal.fire({
          icon: "warning",
          title: "เกิดข้อผิดพลาดขณะประมวลผลรูปภาพ",
          showConfirmButton: false,
          timer: 1500
        })
      }
    };

    fileInput.click();
  };


  return (
    <React.Fragment>
      <ImageListItem key={index}>
        <CardMedia
          component="img"
          height="160"
          sx={{ objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => handleUploadFile(index)}
          image={imageData || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png"}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1200px-No-Image-Placeholder.svg.png";
          }}
          alt={`${name}_1`}
        />
      </ImageListItem>
    </React.Fragment>
  );
};

export default ImageCell;
