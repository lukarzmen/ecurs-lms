export const formatPrice = (price: number) => {
  return Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(price);
};
