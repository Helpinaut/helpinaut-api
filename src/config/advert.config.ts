export const AdvertConfig = {
  MIN_PAGE: Number(process.env.ADVERT_MIN_PAGE ?? 1),
  MAX_LIMIT: Number(process.env.ADVERT_MAX_LIMIT ?? 20),
  MIN_PRICE: Number(process.env.ADVERT_MIN_PRICE ?? 1),
  MAX_PRICE: Number(process.env.ADVERT_MAX_PRICE ?? 9999),
  MAX_TITLE: Number(process.env.ADVERT_MAX_TITLE_LENGTH ?? 50),
  MAX_DESCRIPTION: Number(process.env.ADVERT_MAX_DESCRIPTION_LENGTH ?? 500),
};
