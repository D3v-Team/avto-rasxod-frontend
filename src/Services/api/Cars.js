import { $api, BASE_URL } from "../parametres/axios";

class apiCars {
  /* ==========================
        CARS
  ========================== */

 static All = async (
  page = 1,
  limit = 10,
  search = "",
  is_active,
  is_deleted = false,
  responsible_employee_id = "",
  driver_id = "",
  sortBy = "",
  sortOrder = "",
) => {
  const params = {
    page,
    limit,
    is_deleted,
  };

  if (search) params.search = search;
  if (is_active !== undefined && is_active !== null)
    params.is_active = is_active;
  if (responsible_employee_id)
    params.responsible_employee_id = responsible_employee_id;
  if (driver_id) params.driver_id = driver_id;
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;

  const response = await $api.get(`${BASE_URL}/cars`, { params });

  return response;
};
  static One = async (id) => {
    const response = await $api.get(`${BASE_URL}/cars/${id}`);
    return response;
  };

  static Create = async (data) => {
    const response = await $api.post(`${BASE_URL}/cars`, data, {
      showSuccessToast: "Avtomobil muvaffaqiyatli yaratildi",
    });

    return response;
  };

  static Update = async (id, data) => {
    const response = await $api.patch(`${BASE_URL}/cars/${id}`, data, {
      showSuccessToast: "Avtomobil ma'lumotlari muvaffaqiyatli yangilandi",
      showErrorToast:"Bunday raqamli avtomobil bazada mavjud !"
    });

    return response;
  };

  static Delete = async (id) => {
    const response = await $api.delete(`${BASE_URL}/cars/${id}`, {
      showSuccessToast: "Avtomobil muvaffaqiyatli o'chirildi",
    });

    return response;
  };

  /* ==========================
        CAR FUEL NORMS
  ========================== */

  static AllNorms = async (
    page = 1,
    limit = 10,
    car_id = "",
    fuel_id = "",
    search = "",
    sortBy = "",
    sortOrder = "",
  ) => {
    const params = { page, limit };

    if (car_id) params.car_id = car_id;
    if (fuel_id) params.fuel_id = fuel_id;
    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await $api.get(`${BASE_URL}/car-fuel-norms`, { params });

    return response;
  };

  static OneNorm = async (id) => {
    const response = await $api.get(`${BASE_URL}/car-fuel-norms/${id}`);

    return response;
  };

  static CreateNorm = async (data) => {
    const response = await $api.post(`${BASE_URL}/car-fuel-norms`, data, {
      showSuccessToast: "Yoqilg'i normasi muvaffaqiyatli yaratildi",
    });

    return response;
  };

  static UpdateNorm = async (id, data) => {
    const response = await $api.patch(
      `${BASE_URL}/car-fuel-norms/${id}`,
      data,
      {
        showSuccessToast: "Yoqilg'i normasi muvaffaqiyatli yangilandi",
      },
    );

    return response;
  };

  static DeleteNorm = async (id) => {
    const response = await $api.delete(`${BASE_URL}/car-fuel-norms/${id}`, {
      showSuccessToast: "Yoqilg'i normasi muvaffaqiyatli o'chirildi",
    });

    return response;
  };
}

export { apiCars };
