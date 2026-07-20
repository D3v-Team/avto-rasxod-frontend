import { $api, BASE_URL } from "../parametres/axios";

class apiCars {
  // Barcha mashinalar
  static All = async (
    page = 1,
    limit = 10,
    search = "",
    is_active,
    responsible_employee_id = "",
    driver_id = "",
    sortBy = "",
    sortOrder = ""
  ) => {
    const params = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (is_active !== undefined && is_active !== null)
      params.is_active = is_active;
    if (responsible_employee_id)
      params.responsible_employee_id = responsible_employee_id;
    if (driver_id) params.driver_id = driver_id;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await $api.get(`${BASE_URL}/cars`, {
      params,
    });

    return response;
  };

  // Bitta mashina
  static One = async (id) => {
    const response = await $api.get(`${BASE_URL}/cars/${id}`);
    return response;
  };

  // Mashina qo'shish
  static Create = async (data) => {
    const response = await $api.post(
      `${BASE_URL}/cars`,
      data,
      {
        showSuccessToast: "Car successfully created",
      }
    );

    return response;
  };

  // Mashinani yangilash
  static Update = async (id, data) => {
    const response = await $api.patch(
      `${BASE_URL}/cars/${id}`,
      data,
      {
        showSuccessToast: "Car successfully updated",
      }
    );

    return response;
  };

  // Mashinani o'chirish
  static Delete = async (id) => {
    const response = await $api.delete(
      `${BASE_URL}/cars/${id}`,
      {
        showSuccessToast: "Car successfully deleted",
      }
    );

    return response;
  };
}

export { apiCars };