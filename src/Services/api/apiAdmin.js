// Services/api/Users.js
import { $api } from "../parametres/axios";

class apiAdmin {
  // Barcha adminlarni olish (paginationsiz)
  static All = async () => {
    const response = await $api.get("/user/admin");
    return response.data;
  };

  // Adminlarni sahifalab olish
  static Page = async (
    page = 1,
    limit = 10,
    {
      search,
      sortBy,
      sortOrder,
    } = {},
  ) => {
    const params = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await $api.get("/user/page", { params });
    return response.data;
  };

  // Bitta adminni ID bo'yicha olish
  static One = async (id) => {
    const response = await $api.get(`/user/${id}`);
    return response.data;
  };

  // Admin yaratish
  static Create = async (data) => {
    const response = await $api.post("/user", data);
    return response.data;
  };

  // Admin ma'lumotlarini yangilash
  static Update = async (id, data) => {
    const response = await $api.put(`/user/${id}`, data);
    return response.data;
  };

  // Adminni o'chirish
  static Delete = async (id) => {
    const response = await $api.delete(`/user/${id}`);
    return response.data;
  };

  // Admin parolini tiklash
  static ResetPassword = async (id) => {
    const response = await $api.post(`/user/reset-password/${id}`);
    return response.data;
  };
}

export { apiAdmin };