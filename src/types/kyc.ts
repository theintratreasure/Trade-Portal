export type KycDocumentType =
  | "NIC"
  | "PASSPORT"
  | "DRIVING_LICENSE";

export type KycImage = {
  image_url: string;
  image_public_id: string;
};

export type KycDocuments = {
  front: KycImage;
  back: KycImage;
  selfie: KycImage;
};

export type SubmitKycPayload = {
  documentType: KycDocumentType;
  documents: KycDocuments;
};

export type KycStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "NOT_STARTED";

export type KycResponse = {
  status: KycStatus;
  rejectionReason?: string;
  documents?: KycDocuments;
};
