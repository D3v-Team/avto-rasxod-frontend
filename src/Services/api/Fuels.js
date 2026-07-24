import { $api } from "../parametres/axios";

class apiFuel {
  // Fuel list
  static All = async (
    page = 1,
    limit = 10,
    search = "",
    sortBy,
    sortOrder
  ) => {
    const params = {
      page,
      limit,
    };

    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await $api.get("/fuels", { params });
    return response;
  };

  // Bitta fuel
  static One = async (id) => {
    const response = await $api.get(`/fuels/${id}`);
    return response;
  };

  // Yaratish
  static Create = async (data) => {
    const response = await $api.post("/fuels", data, {
      showSuccessToast: "Yoqilg'i muvaffaqiyatli yaratildi",
    });
    return response;
  };

  // Yangilash
  static Update = async (id, data) => {
    const response = await $api.patch(`/fuels/${id}`, data, {
      showSuccessToast: "Yoqilg'i muvaffaqiyatli yangilandi",
    });
    return response;
  };

  // O'chirish
  static Delete = async (id) => {
    const response = await $api.delete(`/fuels/${id}`, {
      showSuccessToast: "Yoqilg'i muvaffaqiyatli o'chirildi",
    });
    return response;
  };
}

export { apiFuel };