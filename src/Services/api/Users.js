import { $api, BASE_URL } from "../parametres/axios";

class apiEmployees {
  // Barcha xodimlarni olish
  static All = async () => {
    const response = await $api.get(`${BASE_URL}/employees`);
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