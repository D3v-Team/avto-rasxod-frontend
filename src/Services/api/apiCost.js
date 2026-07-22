import { $api } from "../parametres/axios";

class apiCost {
  // Kunlik xarajatlar ro'yxati
  static All = async (
    page = 1,
    limit = 10,
    {
      car_id,
      fuel_id,
      date_from,
      date_to,
      is_holiday,
      search,
      sortBy,
      sortOrder,
    } = {},
  ) => {
    const params = { page, limit };

    if (car_id) params.car_id = car_id;
    if (fuel_id) params.fuel_id = fuel_id;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;
    if (is_holiday !== undefined && is_holiday !== "")
      params.is_holiday = is_holiday;
    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await $api.get("/car-daily-expenses", { params });
    return response.data;
  };

  // Bitta kunlik xarajat
  static One = async (id) => {
    const response = await $api.get(`/car-daily-expenses/${id}`);
    return response.data;
  };

  // Yaratish
  static Create = async (data) => {
    const response = await $api.post("/car-daily-expenses", data);
    return response.data;
  };

  // Yangilash
  static Update = async (id, data) => {
    const response = await $api.patch(`/car-daily-expenses/${id}`, data);
    return response.data;
  };

  // O'chirish
  static Delete = async (id) => {
    const response = await $api.delete(`/car-daily-expenses/${id}`);
    return response.data;
  };

  // 1) Bitta mashina bo'yicha OYLIK HISOBOT — barcha yoqilg'i turlari
  // "fuel_reports" massivida keladi.
  // GET /car-daily-expenses/monthly-report/{car_id}?month=YYYY-MM
  static MonthlyReport = async (car_id, month) => {
    const response = await $api.get(
      `/car-daily-expenses/monthly-report/${car_id}`,
      { params: { month } },
    );
    return response.data;
  };

  // 2) Barcha mashinalar bo'yicha OYLIK STATISTIKA (dashboard uchun)
  // GET /car-daily-expenses/monthly-statistics?month=YYYY-MM&is_active=&car_id=
  static MonthlyStatistics = async (month, { is_active, car_id } = {}) => {
    const params = { month };
    if (is_active !== undefined && is_active !== "")
      params.is_active = is_active;
    if (car_id) params.car_id = car_id;

    const response = await $api.get("/car-daily-expenses/monthly-statistics", {
      params,
    });
    return response.data;
  };

  // 3) Bitta mashina + bitta yoqilg'i turi bo'yicha KUNLIK HISOBOT
  // (har bir kun uchun "expenses" massivi keladi)
  // GET /car-daily-expenses/car-monthly-report?car_id=&month=&fuel_id=
  static CarMonthlyReport = async (car_id, month, fuel_id) => {
    const params = { car_id, month };
    if (fuel_id) params.fuel_id = fuel_id;

    const response = await $api.get("/car-daily-expenses/car-monthly-report", {
      params,
    });
    return response.data;
  };
}

export { apiCost };
