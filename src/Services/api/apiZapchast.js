import { $api } from "../parametres/axios";

class apiZapchast {
  static All = async (
    page = 1,
    limit = 15,
    { car_id, date_from, date_to, payment_type, search } = {},
  ) => {
    const params = { page, limit };

    if (car_id) params.car_id = car_id;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;
    if (payment_type) params.payment_type = payment_type;
    if (search) params.search = search;

    const response = await $api.get("/car-spare-parts-expenses", { params });
    return response.data;
  };

  static One = async (id) => {
    const response = await $api.get(`/car-spare-parts-expenses/${id}`);
    return response.data;
  };

  static Create = async (data) => {
    const response = await $api.post("/car-spare-parts-expenses", data);
    return response.data;
  };

  static Update = async (id, data) => {
    const response = await $api.patch(`/car-spare-parts-expenses/${id}`, data);
    return response.data;
  };

  static Delete = async (id) => {
    const response = await $api.delete(`/car-spare-parts-expenses/${id}`);
    return response.data;
  };

  static ExportExcel = async (date_from, date_to, org_name) => {
    const params = { date_from, date_to };
    if (org_name) params.org_name = org_name;

    const response = await $api.get(
      "/car-spare-parts-expenses/report/excel-ledger",
      {
        params,
        responseType: "blob",
      },
    );
    return response.data;
  };
}

export { apiZapchast };
