import React from 'react';
import { CardMedia, ImageListItem } from '@mui/material';
import dataConfig from '../../../../config';
import { AssetRecord } from '../../../../type/nacType';
import Swal from 'sweetalert2';
import client from '../../../../lib/axios/interceptor';

export interface Data {
  imagePath: string;
  name: string;
  rows: AssetRecord[];
  originalRows: AssetRecord[];
  index: number;
  fieldData: string;
  setRows: React.Dispatch<React.SetStateAction<AssetRecord[]>>;
  setOriginalRows: React.Dispatch<React.SetStateAction<AssetRecord[]>>;
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
const ImageCell = ({ imagePath, name, rows, setRows, index, fieldData, originalRows, setOriginalRows }: Data) => {
  const data = localStorage.getItem('data');
  const parsedData = data ? JSON.parse(data) : null;
  const [imageData, setImageData] = React.useState<string>(imagePath);

  const handleUploadFile = async (indexCode: number) => {
    const choice = window.confirm(
      "คุณต้องการถ่ายรูปจากกล้องหรืออัปโหลดจากอุปกรณ์?\n\nกด 'ตกลง' เพื่อถ่ายรูป หรือ 'ยกเลิก' เพื่ออัปโหลด"
    );

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    if (choice) {
      fileInput.capture = "camera"; // เปิดกล้อง
    }

    fileInput.onchange = async (e: any) => {
      let file = e.target.files?.[0];
      if (!file) return;

      try {
        file = await convertToJPG(file);

        const formData_1 = new FormData();
        formData_1.append("file", file);
        formData_1.append("fileName", file.name);

        const response = await client.post(
          `/check_files_NewNAC`,
          formData_1,
          { headers: dataConfig().headerUploadFile }
        );

        const att = response.data?.attach?.[0]?.ATT;

        if (response.status === 200 && att) {
          const selectedImageRes = `/NEW_NAC/${att}.jpg`;

          const list = [...rows];
          const listOriginalRows = [...originalRows];

          const currentRow = list[indexCode];
          const indexOriginalRows = originalRows.findIndex((row) => row.Code === currentRow.Code);
          const originalRow = listOriginalRows[indexOriginalRows];

          if (fieldData === 'ImagePath') {
            currentRow.ImagePath = selectedImageRes;
            originalRow.ImagePath = selectedImageRes;
          } else if (fieldData === 'ImagePath_2') {
            currentRow.ImagePath_2 = selectedImageRes;
            originalRow.ImagePath_2 = selectedImageRes;
          }

          const payload = {
            Code: currentRow.Code ?? '',
            Name: currentRow.Name ?? '',
            Asset_group: currentRow.Asset_group ?? '',
            Group_name: currentRow.Group_name ?? '',
            BranchID: currentRow.BranchID,
            OwnerCode: currentRow.OwnerID ?? '',
            Details: currentRow.Details ?? '',
            SerialNo: currentRow.SerialNo ?? '',
            Price: currentRow.Price ?? 0,
            ImagePath: fieldData === 'ImagePath' ? selectedImageRes : currentRow.ImagePath,
            ImagePath_2: fieldData === 'ImagePath_2' ? selectedImageRes : currentRow.ImagePath_2,
            Position: currentRow.Position ?? '',
            UserCode: typeof parsedData.UserCode === 'string' ? parsedData.UserCode : '',
          };

          try {
            const responseUpload = await client.post(
              `/UpdateDtlAsset`,
              payload,
              { headers: dataConfig().header}
            );

            if (responseUpload.status === 200) {
              setImageData(selectedImageRes);
              setRows(list);
              setOriginalRows(listOriginalRows);
            } else {
              Swal.fire({
                icon: "warning",
                title: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล (Status: " + responseUpload.status + ")",
                showConfirmButton: false,
                timer: 1500
              })
            }
          } catch (error) {
            console.error("Error saving image to DB:", error);
            Swal.fire({
              icon: "warning",
              title: "เกิดข้อผิดพลาดในการบันทึกข้อมูลรูปภาพ",
              showConfirmButton: false,
              timer: 1500
            })
          }
        } else {
          console.error("File upload error:", response);
          Swal.fire({
            icon: "warning",
            title: "ไม่สามารถอัปโหลดรูปภาพได้",
            showConfirmButton: false,
            timer: 1500
          })
        }
      } catch (error) {
        console.error("Error processing file:", error);
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
