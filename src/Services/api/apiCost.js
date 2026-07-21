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
    const params = {
      page,
      limit,
    };

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

  // Oylik hisobot (mashina + yoqilg'i turi bo'yicha)
  static MonthlyReport = async (car_id, fuel_id, month) => {
    const response = await $api.get(
      `/car-daily-expenses/monthly-report/${car_id}/${fuel_id}`,
      { params: { month } },
    );
    return response.data;
  };
}

export { apiCost };
