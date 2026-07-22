import { $api, BASE_URL } from "../parametres/axios";

class apiEmployees {
  // Barcha xodimlarni olish
  static All = async () => {
    const response = await $api.get(`${BASE_URL}/employees`);
    return response;
  };

  // 🟢 YANGI METOD: Rol, searchTerm, page va limit bo'yicha filterlab olish
  static Filter = async (role = "", searchTerm = "", page = 1, limit = 100) => {
    const params = {};
    if (role) params.role = role;
    if (searchTerm) params.searchTerm = searchTerm;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await $api.get(`${BASE_URL}/employees/filter`, { params });
    return response;
  };

  // Bitta xodim
  static One = async (id) => {
    const response = await $api.get(`${BASE_URL}/employees/${id}`);
    return response;
  };

  // Xodim qo'shish
  static Create = async (data) => {
    const response = await $api.post(
      `${BASE_URL}/employees`,
      data,
      {
        showSuccessToast: "Employee successfully created",
      }
    );
    return response;
  };

  // Xodimni yangilash
  static Update = async (id, data) => {
    const response = await $api.patch(
      `${BASE_URL}/employees/${id}`,
      data,
      {
        showSuccessToast: "Employee successfully updated",
      }
    );
    return response;
  };

  // Xodimni o'chirish
  static Delete = async (id) => {
    const response = await $api.delete(
      `${BASE_URL}/employees/${id}`,
      {
        showSuccessToast: "Employee successfully deleted",
      }
    );
    return response;
  };
}

export { apiEmployees };

