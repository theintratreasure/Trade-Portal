import tradeApi from "@/api/tradeApi";

export type ModifyPendingPayload = {
  positionId: string;
  price: number;
  stopLoss: number;
  takeProfit: number;
};

export const modifyPendingOrder = async (
  payload: ModifyPendingPayload
) => {
  const res = await tradeApi.patch(
    "/trade/position/modify",
    payload
  );
  return res.data;
};
