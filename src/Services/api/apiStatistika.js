// Services/api/apiStatistika.js
import { $api } from "../parametres/axios";


class apiStatistika {
  static AllEmployeesAndCarsCounts = async () => {
    const response = await $api.get(
      "/car-daily-expenses/all-employees-and-cars-counts",
    );
    return response.data;
  };

  static MonthlyStatistics = async (month, { is_active, car_id } = {}) => {
    const params = { month };
    if (is_active !== undefined) params.is_active = is_active;
    if (car_id) params.car_id = car_id;

    const response = await $api.get(
      "/car-daily-expenses/monthly-statistics",
      { params },
    );
    return response.data;
  };

  static MonthlySummary = async (carId, month) => {
    const response = await $api.get(
      `/car-daily-expenses/monthly-summary/${carId}`,
      { params: { month } },
    );
    return response.data;
  };

  static CarMonthlyReport = async (carId, month, fuelId) => {
    const params = { car_id: carId, month };
    if (fuelId) params.fuel_id = fuelId;

    const response = await $api.get(
      "/car-daily-expenses/car-monthly-report",
      { params },
    );
    return response.data;
  };

  static YearlyStatistics = async (year, { car_id } = {}) => {
    const params = { year };
    if (car_id) params.car_id = car_id;

    const response = await $api.get(
      "/car-daily-expenses/yearly-statistics",
      { params },
    );
    return response.data;
  };
    static OrganizationMonthlyReport = async ({ 
    year, 
    month, 
    page = 1, 
    limit = 10, 
    is_active, 
    search 
  }) => {
    const params = { year, month, page, limit };
    if (is_active !== undefined) params.is_active = is_active;
    if (search) params.search = search;

    const response = await $api.get(
      "/car-daily-expenses/organization-monthly-report",
      { params }
    );
    return response.data;
  };
  static OrganizationMonthlyReportExcel = async ({
    year,
    month,
    is_active,
    search,
  }) => {
    const params = { year, month };
    if (is_active !== undefined) params.is_active = is_active;
    if (search) params.search = search;

    const response = await $api.get(
      "/car-daily-expenses/organization-monthly-report-excel",
      { params, responseType: "blob" },
    );
    return response;
  };
}

export { apiStatistika };