import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const TEMPLATE_URL = "/template/Йўл варақа.xlsx";
const MONTH_NAMES = {
  1: "Yanvar",
  2: "Fevral",
  3: "Mart",
  4: "Aprel",
  5: "May",
  6: "Iyun",
  7: "Iyul",
  8: "Avgust",
  9: "Sentabr",
  10: "Oktabr",
  11: "Noyabr",
  12: "Dekabr",
};

const normalizeCellValue = (value) => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string") {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text.toLowerCase().replace(/\s+/g, " ").trim();
    }

    if (typeof value.richText === "object") {
      return value.richText
        .map((part) => part.text)
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
};

const buildVehicleLine = (selectedCar) => {
  const parts = [];

  if (selectedCar?.name) parts.push(selectedCar.name);
  if (selectedCar?.plate_number) parts.push(selectedCar.plate_number);

  return parts.join(" ");
};

const findMatchingWorksheet = (workbook, selectedCar) => {
  const candidates = [];

  if (selectedCar?.name) {
    candidates.push(normalizeCellValue(selectedCar.name));
  }

  if (selectedCar?.plate_number) {
    candidates.push(normalizeCellValue(selectedCar.plate_number));
  }

  if (selectedCar?.name && selectedCar?.plate_number) {
    candidates.push(normalizeCellValue(`${selectedCar.name} ${selectedCar.plate_number}`));
    candidates.push(normalizeCellValue(`${selectedCar.plate_number} ${selectedCar.name}`));
  }

  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

  if (uniqueCandidates.length === 0) {
    return workbook.getWorksheet(1);
  }

  let bestWorksheet = workbook.getWorksheet(1);
  let bestScore = -1;

  workbook.worksheets.forEach((worksheet) => {
    const templateValue = normalizeCellValue(worksheet.getCell("A6").value);
    let score = 0;

    uniqueCandidates.forEach((candidate) => {
      if (templateValue.includes(candidate)) {
        score += 3;
      }

      if (candidate.includes(templateValue) || templateValue.includes(candidate)) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestWorksheet = worksheet;
    }
  });

  return bestWorksheet;
};

const buildDriverLine = (selectedCar) => {
  const driver = selectedCar?.driver_name || "";
  const responsible = selectedCar?.responsible_name || "";
  const parts = [];

  if (driver) parts.push(`Ҳайдовчи: ${driver}`);
  if (responsible) parts.push(`Бириктирилган: ${responsible}`);

  return parts.join("  ");
};

const buildIssueLine = (formData) => {
  const parts = [];

  if (formData?.issueDate) parts.push(formData.issueDate);
  if (formData?.issueTime) parts.push(formData.issueTime);

  return parts.length > 0 ? parts.join(" ") : "";
};

const setCellValue = (worksheet, cellAddress, value, shouldClear = false) => {
  if (value === undefined || value === null) return;

  if (value === "") {
    if (shouldClear) {
      worksheet.getCell(cellAddress).value = "";
    }
    return;
  }

  worksheet.getCell(cellAddress).value = value;
};

export const generateWaybill = async (selectedCar, formData) => {
  try {
    const response = await fetch(TEMPLATE_URL);

    if (!response.ok) {
      throw new Error("Template topilmadi");
    }

    const buffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = findMatchingWorksheet(workbook, selectedCar);

    if (!worksheet) {
      throw new Error("Template ichidagi sheet topilmadi");
    }

    const sheetsToRemove = workbook.worksheets.filter((sheet) => sheet.id !== worksheet.id);
    sheetsToRemove.forEach((sheet) => {
      workbook.removeWorksheet(sheet.name);
    });

    const year = formData?.year || new Date().getFullYear();
    const month = formData?.month ? MONTH_NAMES[Number(formData.month)] : "";
    const waybillNumber = formData?.number || "";

    if (formData?.year || formData?.month) {
      setCellValue(
        worksheet,
        "A1",
        month ? `${year} йил ${month} ойига` : `${year} йил _________ ойига`,
      );
    }

    if (formData?.number) {
      setCellValue(
        worksheet,
        "A3",
        `№ ${waybillNumber} - сонли ЙЎЛ ВАРАҚАСИ`,
      );
    }

    const vehicleLine = buildVehicleLine(selectedCar);
    setCellValue(worksheet, "A6", vehicleLine || "", false);

    const driverLine = buildDriverLine(selectedCar);
    setCellValue(worksheet, "A9", driverLine || "", false);

    const issueLine = buildIssueLine(formData);
    if (issueLine) {
      setCellValue(
        worksheet,
        "A18",
        `Йўл варақаси берилган вақт: ${issueLine}`,
      );
    }

    const workbookBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([workbookBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const safeFileName = `yol_varaqasi_${year}${String(formData?.month || "").padStart(2, "0")}${waybillNumber ? `_${waybillNumber}` : ""}.xlsx`;
    saveAs(blob, safeFileName);

    return true;
  } catch (error) {
    console.error("Yo'l varaqasi yaratishda xatolik:", error);

    if (error?.message === "Template topilmadi") {
      toast.error("Template topilmadi");
    }

    throw error;
  }
};

export const testExcel = async () => {
  try {
    const response = await fetch(TEMPLATE_URL);

    if (!response.ok) {
      throw new Error("Template topilmadi");
    }

    const buffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("Worksheet topilmadi");
    }

    console.log("Worksheet:", worksheet.name);

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.value !== null && cell.value !== "") {
          console.log(`${cell.address} = ${cell.value}`);
        }
      });
    });
  } catch (error) {
    console.error("Excel testda xatolik:", error);
  }
};