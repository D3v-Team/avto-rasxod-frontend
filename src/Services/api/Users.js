import { $api, BASE_URL } from "../parametres/axios";

class apiEmployees {
  // Barcha xodimlar (filter + pagination)
  static All = async (role = "", searchTerm = "", page = 1) => {
    const params = {};

    if (role) params.role = role;
    if (searchTerm) params.searchTerm = searchTerm;
    params.page = page;

    const response = await $api.get(`${BASE_URL}/employees/filter`, {
      params,
    });

    return response;
  };

  // Agar boshqa joylarda alohida kerak bo'lsa qoldirsa ham bo'ladi,
  // kerak bo'lmasa butunlay o'chirib tashlash mumkin.
  static Filter = async (role = "", searchTerm = "", page = 1) => {
    const params = {};

    if (role) params.role = role;
    if (searchTerm) params.searchTerm = searchTerm;
    params.page = page;

    const response = await $api.get(`${BASE_URL}/employees/filter`, {
      params,
    });

    return response;
  };

  // Bitta xodim
  static One = async (id) => {
    return await $api.get(`${BASE_URL}/employees/${id}`);
  };

  // Xodim qo'shish
  static Create = async (data) => {
    return await $api.post(`${BASE_URL}/employees`, data, {
      showSuccessToast: "Xodim muvaffaqiyatli yaratildi",
    });
  };

  // Xodimni yangilash
  static Update = async (id, data) => {
    return await $api.patch(`${BASE_URL}/employees/${id}`, data, {
      showSuccessToast: "Xodim muvaffaqiyatli yangilandi",
    });
  };

  // Xodimni o'chirish
  static Delete = async (id) => {
    return await $api.delete(`${BASE_URL}/employees/${id}`, {
      showSuccessToast: "Xodim muvaffaqiyatli o'chirildi",
    });
  };
}

export { apiEmployees };