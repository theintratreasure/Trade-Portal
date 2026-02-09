import tradeApi from "@/api/tradeApi";

export const modifyPosition = async (data: {
  positionId: string;
  stopLoss?: number;
  takeProfit?: number;
}) => {
  const res = await tradeApi.patch(
    "/trade/position/modify",
    data
  );
  return res.data;
};
