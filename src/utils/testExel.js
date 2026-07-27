import ExcelJS from "exceljs";

export const testExcel = async () => {
  try {
    const response = await fetch("/templates/Йўл варақа.xlsx");

    if (!response.ok) {
      throw new Error("Template topilmadi");
    }

    const buffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);

    console.log("Sheet:", worksheet.name);

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value !== null) {
          console.log(cell.address, "=>", cell.value);
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
};