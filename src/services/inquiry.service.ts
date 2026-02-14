import api from "@/api/axios";

export type InquiryPayload = {
  name: string;
  email: string;
  phone: string;
  title: string;
  description: string;
};

export const inquiryService = {
  create: async (payload: InquiryPayload) => {
    const { data } = await api.post("/inquiry", payload);
    return data;
  },
};

