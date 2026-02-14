import { useMutation } from "@tanstack/react-query";
import { inquiryService, InquiryPayload } from "@/services/inquiry.service";

export const useCreateInquiry = () =>
  useMutation({
    mutationFn: (payload: InquiryPayload) => inquiryService.create(payload),
  });

